'use strict'

React = require 'react'
T = React.PropTypes
update = require 'immutability-helper'
{ Map, Set } = require 'immutable';

EXIF = require 'exif-js'

# @ifdef NATIVE
{ Image
, View
, TextInput
, Picker
, Text
, TouchableOpacity
, ActivityIndicator
, ScrollView
, Switch
, Linking
, BackHandler
} = require 'react-native'
{styles} = require './styles'
# @endif

{Auth, Game, Tag, Field, FieldData} = require './aris'
{clicker, withSuccess, P, BUTTON, DIV} = require './utils'
Photos = require './photos'

# Step 1: Upload
CreateStep1 = React.createClass
  propTypes:
    onCreateMedia: T.func
    onCancel: T.func
    # @ifdef NATIVE
    onStoreMedia: T.func
    onStartUpload: T.func
    onProgress: T.func
    # @endif
    auth: T.instanceOf(Auth).isRequired
    game: T.instanceOf(Game).isRequired
    online: T.bool
    fields: T.arrayOf(T.instanceOf Field)

  getDefaultProps: ->
    onCreateMedia: (->)
    onCancel: (->)
    # @ifdef NATIVE
    onStoreMedia: (->)
    onStartUpload: (->)
    onProgress: (->)
    # @endif
    online: true

  getInitialState: ->
    progress: null
    file: null # file that has EXIF tags already loaded
    extraFiles: Map()

  filesReady: ->
    files = []
    files.push {field_id: null, file: @state.file}
    for field in @props.fields
      continue unless field.field_type is 'MEDIA'
      files.push
        field_id: field.field_id
        file: @state.extraFiles.get(field.field_id, null)
    files

  # @ifdef NATIVE
  beginUpload: ->
    if not @props.online
      @props.onStoreMedia
        file: @state.file
      return
    files = @filesReady()
    return unless files.every ({file}) => file? # TODO should field files be optional
    updateProgress = @props.onProgress
    Photos.uploadImages files.map(({file}) => file), @props.auth, @props.game, updateProgress, (medias) =>
      @props.onCreateMedia medias[0]
    @props.onStartUpload()
  # @endif

  # @ifdef WEB
  beginUpload: ->
    file = @state.file
    return unless file?
    updateProgress = (n) => @setState progress: n
    Photos.uploadImage file, @props.auth, @props.game, updateProgress, @props.onCreateMedia
  # @endif

  # @ifdef NATIVE
  componentWillMount: ->
    @hardwareBack = =>
      @props.onCancel()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  chooseImage: (field_id = null) ->
    Photos.requestImage (file) =>
      if file?
        if field_id is null
          @setState {file}
        else
          @setState extraFiles: @state.extraFiles.set(field_id, file)

  render: ->
    if @state.progress?
      <View style={styles.overlayWholeCenter}>
        <ActivityIndicator size="large" />
        <Text style={fontSize: 20, margin: 10}>
          Uploading… {Math.floor(@state.progress * 100)}%
        </Text>
      </View>
    else
      <View style={styles.overlayWhole}>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={@props.onCancel}>
            <Text style={styles.orangeViolaButton}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={@beginUpload}>
            {
              if @filesReady().every(({file}) => file?)
                <Text style={styles.blackViolaButton}>Next</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView style={
          flex: 1
        }>
          <TouchableOpacity onPress={=> @chooseImage()}>
            {
              if @state.file?
                <Image source={@state.file} resizeMode="contain" style={
                  height: 300
                  width: 300
                } />
              else
                <Image source={require '../web/assets/img/select-image.png'} />
            }
          </TouchableOpacity>
          {
            @props.fields.filter((field) => field.field_type is 'MEDIA').map (field) =>
              <View key={field.field_id}>
                <Text>{ field.label }</Text>
                <TouchableOpacity onPress={=> @chooseImage field.field_id}>
                  {
                    if (file = @state.extraFiles.get(field.field_id, null))?
                      <Image source={file} resizeMode="contain" style={
                        height: 300
                        width: 300
                      } />
                    else
                      <Image source={require '../web/assets/img/select-image.png'} />
                  }
                </TouchableOpacity>
              </View>
          }
        </ScrollView>
      </View>
  # @endif

  # @ifdef WEB

  getEXIF: ->
    file = (@refs.fileInput?.files ? [])[0]
    return unless file?
    EXIF.getData file, =>
      @setState file: file

  render: ->
    if @state.progress?
      <div className="create-step-1">
        <div className="create-content">
          <span>Uploading… {Math.floor(@state.progress * 100)}%</span>
        </div>
      </div>
    else
      <div className="create-step-1">
        <form className="file-form">
          <input ref="fileInput" type="file" name="raw_upload"
            onChange={@getEXIF}
          />
        </form>
        <div className="create-content">
          {
            if @state.file?
              <a href="#" onClick={clicker => @refs.fileInput.click()}>
                <div
                  className={"upload-preview exif-#{EXIF.getTag(@state.file, 'Orientation')}"}
                  style={
                    backgroundImage: "url(#{URL.createObjectURL @state.file})"
                  }
                />
              </a>
            else
              <a href="#" onClick={clicker => @refs.fileInput.click()}>
                <img src="assets/img/select-image.png" />
              </a>
          }
        </div>
        <div className="create-buttons">
          <a href="#" className="create-button-gray" onClick={clicker @props.onCancel}>
            CANCEL
          </a>
          <a href="#" className="create-button-blue" onClick={clicker @beginUpload}>
            DESCRIPTION {'>'}
          </a>
        </div>
      </div>
  # @endif

# Step 2: Caption
CreateStep2 = React.createClass
  propTypes:
    onEnterCaption: T.func
    onBack: T.func
    onCancel: T.func
    defaultCaption: T.string

  getDefaultProps: ->
    onEnterCaption: (->)
    onBack: (->)
    onCancel: (->)
    defaultCaption: ''

  componentWillMount: ->
    @setState
      text: @props.defaultCaption
    # @ifdef NATIVE
    @hardwareBack = =>
      @props.onBack()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack
    # @endif

  doEnterCaption: ->
    text = @state.text
    return unless text.match(/\S/)
    @props.onEnterCaption text

  # @ifdef NATIVE
  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  render: ->
    <View style={styles.overlayBottom}>
      <View style={
        margin: 10
        flexDirection: 'row'
        alignItems: 'flex-start'
      }>
        <TextInput
          placeholder="Add a description…"
          value={@state.text}
          onChangeText={(text) => @setState {text}}
          multiline={true}
          style={
            height: 150
            flex: 1
            padding: 10
            fontSize: 16
          }
        />
        <TouchableOpacity onPress={@props.onCancel} style={margin: 10}>
          <Image source={require '../web/assets/img/x-blue.png'} />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={@props.onBack}>
          <Text style={styles.blueButton}>{'<'} IMAGE</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={@doEnterCaption}>
          <Text style={styles.blueButton}>LOCATION {'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="create-step-2">
      <div className="create-content">
        <div className="create-caption-box">
          <textarea className="create-caption"
            value={@state.text}
            onChange={(e) => @setState text: e.target.value}
            placeholder="Enter a caption…"
          />
          <a href="#" onClick={clicker @props.onCancel}>
            <img src="assets/img/x-blue.png" />
          </a>
        </div>
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-blue" onClick={clicker @props.onBack}>
          {'<'} IMAGE
        </a>
        <a href="#" className="create-button-blue" onClick={clicker @doEnterCaption}>
          LOCATION {'>'}
        </a>
      </div>
    </div>
  # @endif

# Step 3: Location
CreateStep3 = React.createClass
  propTypes:
    onPickLocation: T.func
    onBack: T.func
    onCancel: T.func

  getDefaultProps: ->
    onPickLocation: (->)
    onBack: (->)
    onCancel: (->)

  # @ifdef NATIVE
  componentWillMount: ->
    @hardwareBack = =>
      @props.onBack()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  render: ->
    <View style={styles.overlayBottom}>
      <View style={
        margin: 10
        flexDirection: 'row'
        alignItems: 'flex-start'
      }>
        <View style={flex: 1, alignItems: 'center', justifyContent: 'center'}>
          <Text style={fontSize: 18}>Pick Location</Text>
        </View>
        <TouchableOpacity onPress={@props.onCancel}>
          <Image source={require '../web/assets/img/x-blue.png'} />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={@props.onBack}>
          <Text style={styles.blueButton}>{'<'} CAPTION</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={@props.onPickLocation}>
          <Text style={styles.blueButton}>CATEGORY {'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="create-step-3">
      <div className="create-content-center">
        <span>Pick Location</span>
        <a href="#" className="create-float-x" onClick={clicker @props.onCancel}>
          <img src="assets/img/x-blue.png" />
        </a>
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-blue" onClick={clicker @props.onBack}>
          {'<'} CAPTION
        </a>
        <a href="#" className="create-button-blue" onClick={clicker @props.onPickLocation}>
          CATEGORY {'>'}
        </a>
      </div>
    </div>
  # @endif

# Step 4: Category
CreateStep4 = React.createClass
  propTypes:
    categories: T.arrayOf(T.instanceOf Tag).isRequired
    category: T.instanceOf(Tag).isRequired
    onPickCategory: T.func
    onFinish: T.func
    onBack: T.func
    onCancel: T.func
    getColor: T.func

  getDefaultProps: ->
    onPickCategory: (->)
    onFinish: (->)
    onBack: (->)
    onCancel: (->)
    getColor: -> 'black'

  # @ifdef NATIVE
  componentWillMount: ->
    @hardwareBack = =>
      @props.onBack()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  render: ->
    <View style={styles.overlayBottom}>
      <View style={
        margin: 10
        flexDirection: 'row'
        alignItems: 'flex-start'
      }>
        <Picker
          style={flex: 1}
          selectedValue={@props.category.tag_id}
          onValueChange={(tag_id) =>
            for category in @props.categories
              if category.tag_id is tag_id
                @props.onPickCategory category
          }
        >
          {
            @props.categories.map (category) =>
              <Picker.Item label={category.tag} value={category.tag_id} key={category.tag_id} />
          }
        </Picker>
        <TouchableOpacity onPress={@props.onCancel}>
          <Image source={require '../web/assets/img/x-blue.png'} />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={@props.onBack}>
          <Text style={styles.blueButton}>{'<'} LOCATION</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={=> @props.onFinish @props.category}>
          <Text style={styles.blueButton}>FORM {'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="create-step-4">
      <div className="create-content-center">
        <a href="#" className="create-float-x" onClick={clicker @props.onCancel}>
          <img src="assets/img/x-blue.png" />
        </a>
        <p>
          {
            @props.categories.map (category) =>
              checked = category is @props.category
              color = @props.getColor category
              <a href="#" key={category.tag_id}
                onClick={clicker => @props.onPickCategory category}
                className={"search-tag #{if checked then 'search-tag-on' else ''}"}
                style={
                  borderColor: color
                  color: if checked then undefined else color
                  backgroundColor: if checked then color else undefined
                }
              >
                { if checked then "✓ #{category.tag}" else "● #{category.tag}" }
              </a>
          }
        </p>
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-blue" onClick={clicker @props.onBack}>
          {'<'} LOCATION
        </a>
        <a href="#" className="create-button-blue" onClick={clicker => @props.onFinish @props.category}>
          FORM {'>'}
        </a>
      </div>
    </div>
  # @endif

# Step 5: Form
CreateStep5 = React.createClass
  propTypes:
    onChangeData: T.func
    onFinish: T.func
    onBack: T.func
    onCancel: T.func
    fields: T.arrayOf(T.instanceOf Field)
    field_data: T.arrayOf(T.instanceOf FieldData)

  getDefaultProps: ->
    onChangeData: (->)
    onFinish: (->)
    onBack: (->)
    onCancel: (->)
    fields: []
    field_data: []

  # @ifdef NATIVE
  componentWillMount: ->
    @hardwareBack = =>
      @props.onBack()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  render: ->
    <ScrollView contentContainerStyle={
      backgroundColor: 'white'
      flexDirection: 'column'
      alignItems: 'stretch'
    }>
      <View style={
        margin: 10
        flexDirection: 'column'
        alignItems: 'flex-start'
      }>
        <TouchableOpacity onPress={@props.onCancel} style={alignSelf: 'flex-end'}>
          <Image source={require '../web/assets/img/x-blue.png'} />
        </TouchableOpacity>
        {
          @props.fields.map (field) =>
            <View key={field.field_id} style={alignSelf: 'stretch'}>
              <Text>{ if field.field_type is 'NOMEN' then "Nomen #{field.label}" else field.label }</Text>
              {
                getText = =>
                  for data in @props.field_data
                    if data.field_id is field.field_id
                      return data.field_data
                setText = (text) =>
                  newData =
                    data for data in @props.field_data when data.field_id isnt field.field_id
                  newData.push new FieldData {
                    field_id: field.field_id
                    field_data: text
                  }
                  @props.onChangeData newData
                switch field.field_type
                  when 'TEXT'
                    <TextInput
                      multiline={false}
                      value={getText()}
                      onChangeText={setText}
                      style={
                        height: 50
                        borderColor: '#222'
                        borderWidth: 1
                        padding: 10
                        fontSize: 16
                        alignSelf: 'stretch'
                      }
                    />
                  when 'TEXTAREA'
                    <TextInput
                      multiline={true}
                      value={getText()}
                      onChangeText={setText}
                      style={
                        height: 120
                        borderColor: '#222'
                        borderWidth: 1
                        padding: 10
                        fontSize: 16
                        alignSelf: 'stretch'
                      }
                    />
                  when 'SINGLESELECT'
                    <Picker
                      selectedValue={do =>
                        for data in @props.field_data
                          if data.field_id is field.field_id
                            return data.field_option_id
                        field.options[0].field_option_id
                      }
                      onValueChange={(field_option_id) =>
                        newData =
                          data for data in @props.field_data when data.field_id isnt field.field_id
                        newData.push new FieldData {
                          field_id: field.field_id
                          field_option_id: field_option_id
                        }
                        @props.onChangeData newData
                      }
                    >
                      {
                        field.options.map (option) =>
                          <Picker.Item label={option.option} value={option.field_option_id} key={option.field_option_id} />
                      }
                    </Picker>
                  when 'MULTISELECT'
                    field.options.map (option) =>
                      <View style={flexDirection: 'row'} key={option.field_option_id}>
                        <Switch
                          value={@props.field_data.some (data) =>
                            data.field_id is field.field_id and data.field_option_id is option.field_option_id
                          }
                          onValueChange={(checked) =>
                            newData =
                              data for data in @props.field_data when not (data.field_id is field.field_id and data.field_option_id is option.field_option_id)
                            if checked
                              newData.push new FieldData {
                                field_id: field.field_id
                                field_option_id: option.field_option_id
                              }
                            @props.onChangeData newData
                          }
                        />
                        <Text>{ option.option }</Text>
                      </View>
                  when 'NOMEN'
                    <TouchableOpacity onPress={=>
                      Linking.openURL "nomen://?nomen_id=#{field.label}&siftr_id=6234" # TODO actual siftr_id
                    }>
                      <Text>
                        {
                          do =>
                            for data in @props.field_data
                              if data.field_id is field.field_id
                                return data.field_data
                        }
                      </Text>
                      <Text>Launch Nomen</Text>
                    </TouchableOpacity>
                  when 'MEDIA'
                    null # handled in CreateStep1
                  else
                    <Text>(not implemented yet)</Text>
              }
            </View>
        }
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={@props.onBack}>
          <Text style={styles.blueButton}>{'<'} CATEGORY</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={=> @props.onFinish @props.field_data}>
          <Text style={styles.blueButton}>FINISH</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="create-step-5">
      <div className="create-content-center">
        <a href="#" className="create-float-x" onClick={clicker @props.onCancel}>
          <img src="assets/img/x-blue.png" />
        </a>
        <p>{ JSON.stringify @props.fields }</p>
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-blue" onClick={clicker @props.onBack}>
          {'<'} CATEGORY
        </a>
        <a href="#" className="create-button-blue" onClick={clicker => @props.onFinish @props.field_data}>
          FINISH
        </a>
      </div>
    </div>
  # @endif

# @ifdef NATIVE

# Steps 2-5 (native app), all non-photo data together
CreateData = React.createClass
  propTypes:
    createNote: T.any.isRequired
    onUpdateNote: T.func
    onStartLocation: T.func
    getLocation: T.func
    categories: T.arrayOf(T.instanceOf Tag).isRequired
    getColor: T.func
    fields: T.arrayOf(T.instanceOf Field)
    # misc
    onFinish: T.func
    onBack: T.func
    onCancel: T.func

  getDefaultProps: ->
    onUpdateNote: (->)
    onStartLocation: (->)
    getLocation: (->)
    getColor: (->)
    fields: []
    onFinish: (->)
    onBack: (->)
    onCancel: (->)

  getInitialState: ->
    isPickingLocation: false
    tagListOpen: false

  componentWillMount: ->
    @hardwareBack = =>
      if @state.isPickingLocation
        @setState isPickingLocation: false
      else
        @props.onBack()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  render: ->
    if @state.isPickingLocation
      <View style={styles.overlayBottom}>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={=>
            location = @props.getLocation()
            @props.onUpdateNote update @props.createNote,
              location:
                $set: location
            @setState isPickingLocation: false
          }>
            <Text style={styles.blueButton}>Pick Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    else
      <View style={flex: 1}>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={@props.onBack}>
            <Text style={styles.blackViolaButton}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={=>
            unless @props.createNote.uploading
              @props.onFinish @props.onCreateNote
          }>
            <Text style={styles.blackViolaButton}>
              {
                if @props.createNote.uploading
                  "Uploading… (#{Math.floor((@props.progress ? 0) * 100)}%)"
                else
                  "Post"
              }
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={flex: 1, backgroundColor: 'white'} contentContainerStyle={
          flexDirection: 'column'
          alignItems: 'stretch'
        }>
          <View style={
            flexDirection: 'column'
            alignItems: 'stretch'
          }>
            <TextInput
              placeholder="Add a description…"
              value={@props.createNote.caption}
              onChangeText={(text) =>
                @props.onUpdateNote update @props.createNote,
                  caption: $set: text
              }
              multiline={true}
              style={
                height: 150
                flex: 1
                padding: 10
                fontSize: 16
              }
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={=>
                @setState isPickingLocation: true
                @props.onStartLocation()
              }>
                <Text style={styles.blueButton}>Pick Location</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={=>
              @setState tagListOpen: not @state.tagListOpen
            } style={
              borderTopColor: 'rgb(230,230,230)'
              borderTopWidth: 1
              padding: 13
              flexDirection: 'row'
              alignItems: 'center'
              justifyContent: 'space-between'
            }>
              <View style={
                backgroundColor: @props.getColor(@props.createNote.category)
                height: 16
                width: 16
                borderRadius: 8
                marginRight: 20
              } />
              <Text style={flex: 1}>{ @props.createNote.category?.tag }</Text>
              <Image source={require('../web/assets/img/icon-expand.png')} style={
                width: 32 * 0.7
                height: 18 * 0.7
                resizeMode: 'contain'
              } />
            </TouchableOpacity>
            {
              if @state.tagListOpen
                <View>
                  {
                    @props.categories.map (category) =>
                      <TouchableOpacity key={category.tag_id} onPress={=>
                        @setState tagListOpen: false
                        @props.onUpdateNote update @props.createNote,
                          category: $set: category
                      } style={
                        borderTopColor: 'rgb(230,230,230)'
                        borderTopWidth: 1
                        padding: 13
                        flexDirection: 'row'
                        alignItems: 'center'
                        justifyContent: 'space-between'
                        backgroundColor: 'rgb(240,240,240)'
                      }>
                        <View style={
                          backgroundColor: @props.getColor(category)
                          height: 16
                          width: 16
                          borderRadius: 8
                          marginRight: 20
                        } />
                        <Text style={flex: 1}>{ category.tag }</Text>
                      </TouchableOpacity>
                  }
                </View>
            }
            {
              @props.fields.map (field) =>
                <View key={field.field_id} style={alignSelf: 'stretch'}>
                  <View style={styles.settingsHeader}>
                    <Text style={styles.settingsHeaderText}>{ if field.field_type is 'NOMEN' then "Nomen #{field.label}" else field.label }</Text>
                  </View>
                  {
                    field_data = @props.createNote.field_data ? []
                    onChangeData = (newData) =>
                      @props.onUpdateNote update @props.createNote,
                        field_data:
                          $set: newData
                    getText = =>
                      for data in field_data
                        if data.field_id is field.field_id
                          return data.field_data
                    setText = (text) =>
                      newData =
                        data for data in field_data when data.field_id isnt field.field_id
                      newData.push new FieldData {
                        field_id: field.field_id
                        field_data: text
                      }
                      onChangeData newData
                    switch field.field_type
                      when 'TEXT'
                        <TextInput
                          multiline={false}
                          value={getText()}
                          onChangeText={setText}
                          style={styles.input}
                          placeholder={field.label}
                        />
                      when 'TEXTAREA'
                        <TextInput
                          multiline={true}
                          value={getText()}
                          onChangeText={setText}
                          style={
                            height: 120
                            borderColor: '#222'
                            borderWidth: 1
                            padding: 10
                            fontSize: 16
                            alignSelf: 'stretch'
                          }
                        />
                      when 'SINGLESELECT'
                        <Picker
                          selectedValue={do =>
                            for data in field_data
                              if data.field_id is field.field_id
                                return data.field_option_id
                            field.options[0].field_option_id
                          }
                          onValueChange={(field_option_id) =>
                            newData =
                              data for data in field_data when data.field_id isnt field.field_id
                            newData.push new FieldData {
                              field_id: field.field_id
                              field_option_id: field_option_id
                            }
                            onChangeData newData
                          }
                        >
                          {
                            field.options.map (option) =>
                              <Picker.Item label={option.option} value={option.field_option_id} key={option.field_option_id} />
                          }
                        </Picker>
                      when 'MULTISELECT'
                        field.options.map (option) =>
                          <View style={flexDirection: 'row'} key={option.field_option_id}>
                            <Switch
                              value={field_data.some (data) =>
                                data.field_id is field.field_id and data.field_option_id is option.field_option_id
                              }
                              onValueChange={(checked) =>
                                newData =
                                  data for data in field_data when not (data.field_id is field.field_id and data.field_option_id is option.field_option_id)
                                if checked
                                  newData.push new FieldData {
                                    field_id: field.field_id
                                    field_option_id: option.field_option_id
                                  }
                                onChangeData newData
                              }
                            />
                            <Text>{ option.option }</Text>
                          </View>
                      when 'NOMEN'
                        <TouchableOpacity onPress={=>
                          Linking.openURL "nomen://?nomen_id=#{field.label}&siftr_id=6234" # TODO actual siftr_id
                        }>
                          <Text>
                            {
                              do =>
                                for data in field_data
                                  if data.field_id is field.field_id
                                    return data.field_data
                            }
                          </Text>
                          <Text>Launch Nomen</Text>
                        </TouchableOpacity>
                      else
                        <Text>(not implemented yet)</Text>
                  }
                </View>
            }
          </View>
        </ScrollView>
      </View>

# @endif

exports.CreateStep1 = CreateStep1
exports.CreateStep2 = CreateStep2
exports.CreateStep3 = CreateStep3
exports.CreateStep4 = CreateStep4
exports.CreateStep5 = CreateStep5
# @ifdef NATIVE
exports.CreateData = CreateData
# @endif
