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
, CameraRoll
, ListView
, TouchableWithoutFeedback
, Keyboard
} = require 'react-native'
{styles} = require './styles'
import Camera from 'react-native-camera'
import InfiniteScrollView from 'react-native-infinite-scroll-view'
# @endif

{Auth, Game, Tag, Field, FieldData} = require './aris'
{clicker, withSuccess, P, BUTTON, DIV} = require './utils'
Photos = require './photos'

# @ifdef NATIVE
SiftrRoll = React.createClass
  getDefaultProps: ->
    onSelectImage: (->)

  getInitialState: ->
    photos: []
    canLoadMore: true
    dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 != r2})

  componentWillMount: ->
    @getMorePhotos()

  getMorePhotos: ->
    thisGet = this.lastGet = Date.now()
    CameraRoll.getPhotos
      first: 20
      after: this.state.photoCursor
      assetType: 'Photos'
    .then (result) =>
      return unless thisGet is this.lastGet
      if result.edges.length > 0
        @setState
          photos: @state.photos.concat result.edges.map ({node}) => node.image.uri
          photoCursor: result.page_info.end_cursor
          canLoadMore: result.page_info.has_next_page
      else
        @setState canLoadMore: false

  render: ->
    <ListView
      style={flex: 1}
      contentContainerStyle={
        flexDirection: 'row'
        flexWrap: 'wrap'
        alignItems: 'center'
        justifyContent: 'center'
      }
      enableEmptySections={true}
      renderScrollComponent={(props) => <InfiniteScrollView {...props} />}
      dataSource={this.state.dataSource.cloneWithRows(this.state.photos)}
      renderRow={(uri) =>
        <TouchableOpacity onPress={=> this.props.onSelectImage uri}>
          <Image source={
            uri: uri
          } style={
            width: 160
            height: 160
            margin: 5
          } />
        </TouchableOpacity>
      }
      canLoadMore={@state.canLoadMore}
      onLoadMoreAsync={=> @getMorePhotos()}
    />
# @endif

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
    # @ifdef NATIVE
    source: 'camera'
    camera: 'back'
    flash: false
    field_id: null
    # @endif

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
    files = @filesReady()
    return unless files.every ({file}) => file? # TODO should field files be optional
    if not @props.online
      # TODO handle field media
      @props.onStoreMedia
        file: @state.file
      return
    updateProgress = @props.onProgress
    Photos.uploadImages files.map(({file}) => file), @props.auth, @props.game, updateProgress, (results) =>
      fieldMedia = []
      for {field_id}, i in files
        continue if i is 0
        {media} = results[i]
        fieldMedia.push {field_id: field_id, media_id: media.media_id}
      @props.onCreateMedia results[0], fieldMedia
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

  chooseImage: (field_id, file) ->
    return unless file?
    if field_id?
      @setState extraFiles: @state.extraFiles.set(field_id, file)
    else
      @setState {file}

  render: ->
    pictureSlots = []
    # main picture
    pictureSlots.push
      field_id: undefined
      currentImage: => @state.file
    # other pictures
    for field in @props.fields.filter((field) => field.field_type is 'MEDIA')
      pictureSlots.push
        field_id: field.field_id
        currentImage: => @state.extraFiles.get(field.field_id, null)

    <View style={styles.overlayWhole}>
      <View>
        <ScrollView horizontal={true} centerContent={true} style={
          backgroundColor: 'rgb(240,240,240)'
        }>
          {
            pictureSlots.map ({field_id, currentImage}) =>
              <TouchableOpacity key={field_id ? 0} onPress={=> @setState {field_id}}>
                {
                  <Image source={
                    if (file = currentImage())?
                      file
                    else
                      require '../web/assets/img/icon-needs-pic.png'
                  } style={styles.photoSlot} />
                }
              </TouchableOpacity>
          }
        </ScrollView>
      </View>
      <View style={backgroundColor: 'white', padding: 3}>
        <Text style={color: '#979797', textAlign: 'center'}>
          {
            if @state.field_id?
              field = @props.fields.find((field) => field.field_id is @state.field_id)
              "Add image of: #{field.label}".toUpperCase()
            else
              'Add main image'.toUpperCase()
          }
        </Text>
      </View>
      {
        switch @state.source
          when 'camera'
            <View style={flex: 1}>
              <View style={
                flex: 1
                backgroundColor: 'black'
              }>
                <Camera
                  ref={(cam) => this.camera = cam}
                  style={
                    flex: 1
                  }
                  type={@state.camera}
                  flashMode={if @state.flash then Camera.constants.FlashMode.on else Camera.constants.FlashMode.off}
                />
              </View>
              <View style={
                flexDirection: 'row'
                justifyContent: 'space-around'
                alignItems: 'center'
              }>
                <TouchableOpacity onPress={=>
                  @setState camera: if @state.camera is 'front' then 'back' else 'front'
                }>
                  <Image source={require '../web/assets/img/icon-switch-camera.png'} style={
                    width: 30
                    height: 30
                    margin: 10
                  } />
                </TouchableOpacity>
                <TouchableOpacity onPress={=>
                  return unless this.camera?
                  this.camera.capture({}).then ({path}) =>
                    @chooseImage @state.field_id,
                      uri: path
                      isStatic: true
                      type: 'image/jpeg'
                      name: 'upload.jpg'
                }>
                  <Image source={require '../web/assets/img/icon-take-picture.png'} style={
                    width: 50
                    height: 50
                    margin: 10
                  } />
                </TouchableOpacity>
                <TouchableOpacity onPress={=>
                  @setState flash: not @state.flash
                }>
                  <Image source={require '../web/assets/img/icon-flash.png'} style={
                    width: 32 * 0.7
                    height: 46 * 0.7
                    margin: 10
                  } />
                </TouchableOpacity>
              </View>
            </View>
          when 'roll'
            <View style={flex: 1}>
              <SiftrRoll
                onSelectImage={(path) =>
                  @chooseImage @state.field_id,
                    uri: path
                    isStatic: true
                    # TODO do we need to support other types
                    type: 'image/jpeg'
                    name: 'upload.jpg'
                }
              />
            </View>
      }
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={@props.onCancel}>
          <Text style={[styles.blackViolaButton, {color: 'rgb(188,188,188)'}]}>cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={=> @setState source: 'camera'}>
          <Image style={width: 52 * 0.7, height: 38 * 0.7} source={
            if @state.source is 'camera'
              require '../web/assets/img/icon-from-camera.png'
            else
              require '../web/assets/img/icon-from-camera-gray.png'
          } />
        </TouchableOpacity>
        <TouchableOpacity onPress={=> @setState source: 'roll'}>
          <Image style={width: 52 * 0.7, height: 52 * 0.7} source={
            if @state.source is 'roll'
              require '../web/assets/img/icon-from-roll.png'
            else
              require '../web/assets/img/icon-from-roll-gray.png'
          } />
        </TouchableOpacity>
        <TouchableOpacity onPress={@beginUpload}>
          <Text style={
            if @filesReady().every(({file}) => file?)
              styles.blackViolaButton
            else
              [styles.blackViolaButton, {color: 'rgb(188,188,188)'}]
          }>next</Text>
        </TouchableOpacity>
      </View>
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
            return null if field.field_type is 'MEDIA'
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
        </TouchableWithoutFeedback>
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
              onFocus={=> @setState focusedBox: 'caption'}
              onEndEditing={=>
                if @state.focusedBox is 'caption'
                  @setState focusedBox: null
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
                return null if field.field_type is 'MEDIA'
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
