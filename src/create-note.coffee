'use strict'

React = require 'react'
T = require 'prop-types'
update = require 'immutability-helper'
{ Map, Set } = require 'immutable'
createClass = require 'create-react-class'

EXIF = require 'exif-js'

# @ifdef NATIVE
{ Image
, View
, TextInput
, Picker
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
{styles, Text} = require './styles'
import Camera from 'react-native-camera'
import InfiniteScrollView from 'react-native-infinite-scroll-view'
import firebase from 'react-native-firebase'
# @endif

{Auth, Game, Tag, Field, FieldData} = require './aris'
{clicker, withSuccess, P, BUTTON, DIV} = require './utils'
Photos = require './photos'

# @ifdef NATIVE
class SiftrRoll extends React.Component
  constructor: (props) ->
    super(props)
    this.state =
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

SiftrRoll.defaultProps =
  onSelectImage: (->)
# @endif

# @ifdef WEB
CreatePhotoBox = createClass
  getDefaultProps: ->
    onChooseFile: (->)
    file: null
    orientation: null
    header: 'Main image'
    required: true

  getInitialState: ->
    highlight: false

  render: ->
    stop = (ev) =>
      ev.stopPropagation()
      ev.preventDefault()
    <div>
      <form className="file-form">
        <input ref="fileInput" type="file" name="raw_upload"
          onChange={=>
            files = @refs.fileInput?.files
            if files? and files.length > 0
              @props.onChooseFile files[0]
          }
        />
      </form>
      <a href="#"
        onClick={clicker => @refs.fileInput.click()}
        className={"photo-drop #{if @state.highlight then 'photo-drop-highlight' else ''}"}
        onDragEnter={(ev) =>
          stop ev
          @setState highlight: true
        }
        onDragExit={(ev) =>
          stop ev
          @setState highlight: false
        }
        onDragOver={stop}
        onDrop={(ev) =>
          stop ev
          @setState highlight: false
          files = ev.dataTransfer.files
          if files.length > 0
            @props.onChooseFile files[0]
        }
      >
        {
          if @props.file?
            <div
              className={"upload-preview exif-#{@props.orientation}"}
              style={backgroundImage: "url(#{URL.createObjectURL @props.file})"}
            />
          else
            <div
              className="upload-preview no-image"
              style={backgroundImage: "url(assets/img/icon-cloud-upload.png)"}
            />
        }
        <div>
          <h3>{ @props.header }</h3>
          <h4>{ if @props.required then 'required*' else 'optional' }</h4>
        </div>
      </a>
    </div>
# @endif

# Step 1: Upload
export CreateStep1 = createClass
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
      @props.onStoreMedia {files}
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
    files = @filesReady()
    return unless files.every ({file}) => file? # TODO should field files be optional
    updateProgress = (n) => @setState progress: n
    Photos.uploadImages files.map(({file}) => file), @props.auth, @props.game, updateProgress, (results) =>
      fieldMedia = []
      for {field_id}, i in files
        continue if i is 0
        {media} = results[i]
        fieldMedia.push {field_id: field_id, media_id: media.media_id}
      @props.onCreateMedia results[0], fieldMedia
  # @endif

  # @ifdef NATIVE
  componentWillMount: ->
    firebase.analytics().logEvent 'start_create_note', {}
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
      field_id: null
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
              <TouchableOpacity key={field_id ? 0} onPress={=> @setState {field_id}} style={
                flexDirection: 'column'
                alignItems: 'center'
              }>
                {
                  <Image source={
                    if (file = currentImage())?
                      file
                    else
                      require '../web/assets/img/icon-needs-pic.png'
                  } style={styles.photoSlot} />
                }
                {
                  if @state.field_id is field_id
                    <Image
                      source={require '../web/assets/img/white-indicator.png'}
                      style={
                        width: 250 * 0.08
                        height: 110 * 0.08
                      }
                    />
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
                  field_id = @state.field_id
                  this.camera.capture({}).then ({path}) =>
                    @chooseImage field_id,
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

  getEXIF: (field_id, file) ->
    return unless file?
    EXIF.getData file, =>
      if field_id?
        @setState extraFiles: @state.extraFiles.set(field_id, file)
      else
        @setState {file}

  render: ->
    pictureSlots = []
    # main picture
    pictureSlots.push
      field_id: null
      currentImage: => @state.file
      header: 'Main image'
    # other pictures
    for field in @props.fields.filter((field) => field.field_type is 'MEDIA')
      pictureSlots.push
        field_id: field.field_id
        currentImage: => @state.extraFiles.get(field.field_id, null)
        header: field.label

    if @state.progress?
      <div className="create-step-1">
        <div className="create-content">
          <span>Uploading… {Math.floor(@state.progress * 100)}%</span>
        </div>
      </div>
    else
      <div className="create-step-1">
        <div className="create-content">
          {
            pictureSlots.map ({field_id, currentImage, header}) =>
              img = currentImage()
              <CreatePhotoBox
                key={field_id}
                onChooseFile={(file) => @getEXIF(field_id, file)}
                file={img}
                orientation={if img? then EXIF.getTag(img, 'Orientation') else null}
                header={header}
                required={true}
              />
          }
        </div>
        <div className="create-buttons">
          <a href="#" className="create-button-gray" onClick={clicker @props.onCancel}>
            cancel
          </a>
          <a href="#" className="create-button-white" onClick={clicker @beginUpload}>
            next
          </a>
        </div>
      </div>
  # @endif

# @ifdef WEB

# Step 2: Caption
export CreateStep2 = createClass
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

  doEnterCaption: ->
    text = @state.text
    return unless text.match(/\S/)
    @props.onEnterCaption text

  render: ->
    <div className="create-step-2">
      <div className="create-content">
        <textarea className="create-caption"
          value={@state.text}
          onChange={(e) => @setState text: e.target.value}
          placeholder="Enter a caption…"
        />
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-gray" onClick={clicker @props.onBack}>
          back
        </a>
        <a href="#" className="create-button-white" onClick={clicker @doEnterCaption}>
          next
        </a>
      </div>
    </div>

# Step 3: Location
export CreateStep3 = createClass
  propTypes:
    onPickLocation: T.func
    onBack: T.func
    onCancel: T.func

  getDefaultProps: ->
    onPickLocation: (->)
    onBack: (->)
    onCancel: (->)

  render: ->
    <div className="create-step-3-box">
      <div className="create-step-3-window">
      </div>
      <div className="create-step-3">
        <div className="create-content-center">
          <span>Pick Location</span>
        </div>
        <div className="create-buttons">
          <a href="#" className="create-button-gray" onClick={clicker @props.onBack}>
            back
          </a>
          <a href="#" className="create-button-white" onClick={clicker @props.onPickLocation}>
            next
          </a>
        </div>
      </div>
    </div>

# Step 4: Category
export CreateStep4 = createClass
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

  render: ->
    <div className="create-step-4">
      <div className="create-content-center">
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
        <a href="#" className="create-button-gray" onClick={clicker @props.onBack}>
          back
        </a>
        <a href="#" className="create-button-white" onClick={clicker => @props.onFinish @props.category}>
          next
        </a>
      </div>
    </div>

# Step 5: Form
export CreateStep5 = createClass
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

  render: ->
    <div className="create-step-5">
      <div className="create-content-center">
        {
          @props.fields.map (field) =>
            return null if field.field_type is 'MEDIA'
            <div key={field.field_id}>
              <div>
                <p>{ if field.field_type is 'NOMEN' then "Nomen #{field.label}" else field.label }</p>
              </div>
              {
                field_data = @props.field_data ? []
                onChangeData = (newData) => @props.onChangeData newData
                getText = =>
                  for data in field_data
                    if data.field_id is field.field_id
                      return data.field_data
                  ''
                setText = (event) =>
                  newData =
                    data for data in field_data when data.field_id isnt field.field_id
                  newData.push new FieldData {
                    field_id: field.field_id
                    field_data: event.target.value
                  }
                  onChangeData newData
                switch field.field_type
                  when 'TEXT'
                    <p>
                      <input
                        type="text"
                        value={getText()}
                        onChange={setText}
                        placeholder={field.label}
                      />
                    </p>
                  when 'TEXTAREA'
                    <p>
                      <textarea
                        value={getText()}
                        onChange={setText}
                        placeholder={field.label}
                      />
                    </p>
                  when 'SINGLESELECT'
                    <p>
                      <select
                        value={do =>
                          for data in field_data
                            if data.field_id is field.field_id
                              return data.field_option_id
                          field.options[0].field_option_id
                        }
                        onChange={(event) =>
                          field_option_id = event.target.value
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
                            <option value={option.field_option_id} key={option.field_option_id}>
                              {option.option}
                            </option>
                        }
                      </select>
                    </p>
                  when 'MULTISELECT'
                    field.options.map (option) =>
                      <p key={option.field_option_id}>
                        <label>
                          <input
                            type="checkbox"
                            value={field_data.some (data) =>
                              data.field_id is field.field_id and data.field_option_id is option.field_option_id
                            }
                            onChange={(event) =>
                              checked = event.target.checked
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
                          { option.option }
                        </label>
                      </p>
                  else
                    <p>(not implemented yet)</p>
              }
            </div>
        }
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-gray" onClick={clicker @props.onBack}>
          back
        </a>
        <a href="#" className="create-button-blue" onClick={clicker => @props.onFinish @props.field_data}>
          post!
        </a>
      </div>
    </div>

# @endif

# @ifdef NATIVE

export class Blackout extends React.Component
  @defaultProps:
    isFocused: false
    keyboardUp: false

  render: ->
    <View style={@props.style}>
      {@props.children}
      {
        if @props.keyboardUp and not @props.isFocused
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={
              position: 'absolute'
              top: 0
              left: 0
              bottom: 0
              right: 0
              backgroundColor: 'rgba(0,0,0,0.5)'
            } />
          </TouchableWithoutFeedback>
      }
    </View>

# Steps 2-5 (native app), all non-photo data together
export CreateData = createClass
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
    # @ifdef NATIVE
    firebase.analytics().logEvent 'entering_note_info', {}
    # @endif
    unless @props.resumedNote
      @props.onStartLocation()
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
            @setState isPickingLocation: false
          }>
            <Text style={styles.blueButton}>Pick Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    else
      <View style={flex: 1}>
        <ScrollView
          style={
            flex: 1
            backgroundColor:
              if @state.focusedBox?
                'rgb(127,127,127)'
              else
                'rgb(249,249,249)'
          }
          contentContainerStyle={
            flexDirection: 'column'
            alignItems: 'stretch'
          }
        >
          <View style={
            flexDirection: 'column'
            alignItems: 'stretch'
          }>
            <Blackout keyboardUp={@state.focusedBox?} isFocused={@state.focusedBox is 'caption'}>
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
                  height: 120
                  padding: 10
                  fontSize: 16
                  backgroundColor: 'white'
                }
              />
            </Blackout>
            <Blackout keyboardUp={@state.focusedBox?} isFocused={false}>
              <View style={[styles.buttonRow, backgroundColor: 'white']}>
                <TouchableOpacity onPress={=>
                  @setState isPickingLocation: true
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
                backgroundColor: 'white'
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
            </Blackout>
            {
              @props.fields.map (field) =>
                return null if field.field_type is 'MEDIA'
                <Blackout keyboardUp={@state.focusedBox?} isFocused={@state.focusedBox is field.field_id} key={field.field_id} style={alignSelf: 'stretch'}>
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
                      ''
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
                        <View style={backgroundColor: 'white'}>
                          <TextInput
                            multiline={false}
                            value={getText()}
                            onChangeText={setText}
                            style={styles.input}
                            placeholder={field.label}
                            onFocus={=> @setState focusedBox: field.field_id}
                            onEndEditing={=>
                              if @state.focusedBox is field.field_id
                                @setState focusedBox: null
                            }
                          />
                        </View>
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
                            backgroundColor: 'white'
                          }
                          onFocus={=> @setState focusedBox: field.field_id}
                          onEndEditing={=>
                            if @state.focusedBox is field.field_id
                              @setState focusedBox: null
                          }
                        />
                      when 'SINGLESELECT'
                        <Picker
                          style={backgroundColor: 'white'}
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
                          <View style={flexDirection: 'row', backgroundColor: 'white'} key={option.field_option_id}>
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
                        <TouchableOpacity style={padding: 10, backgroundColor: 'white'} onPress={=>
                          # Linking.openURL "nomen://?nomen_id=#{field.label}&siftr_id=6234" # TODO actual siftr_id
                          @props.onViolaIdentify
                            note: @props.createNote
                            location: @props.getLocation()
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
                </Blackout>
            }
          </View>
        </ScrollView>
        <Blackout keyboardUp={@state.focusedBox?} isFocused={false}>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={@props.onCancel} style={flex: 1, alignItems: 'center'}>
              <Text style={[styles.blackViolaButton, color: 'rgb(165,159,164)']}>Cancel</Text>
            </TouchableOpacity>
            <View style={
              width: 2
              height: 20
              backgroundColor: 'rgb(237,237,237)'
            } />
            <TouchableOpacity onPress={=>
              unless @props.createNote.uploading
                @props.onFinish @props.onCreateNote
            } style={flex: 1, alignItems: 'center'}>
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
        </Blackout>
      </View>

# @endif
