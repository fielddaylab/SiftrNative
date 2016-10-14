'use strict'

React = require 'react'
T = React.PropTypes

EXIF = require 'exif-js'

# @ifdef NATIVE
ImagePicker = require 'react-native-image-picker'
{ Platform
, Image
, View
, TextInput
, Picker
, Text
, TouchableOpacity
, ActivityIndicator
} = require 'react-native'
{styles} = require './styles'
# @endif

{Auth, Game, Tag} = require './aris'
{clicker, withSuccess, P, BUTTON, DIV} = require './utils'

# Step 1: Upload
CreateStep1 = React.createClass
  propTypes:
    onCreateMedia: T.func
    onCancel: T.func
    auth: T.instanceOf(Auth).isRequired
    game: T.instanceOf(Game).isRequired

  getDefaultProps: ->
    onCreateMedia: (->)
    onCancel: (->)

  getInitialState: ->
    progress: null
    file: null # file that has EXIF tags already loaded

  # @ifdef NATIVE
  beginUpload: ->
    file = @state.file
    return unless file?
    @setState progress: 0
    updateProgress = (n) => @setState progress: n
    @props.auth.rawUpload file, updateProgress, withSuccess (raw_upload_id) =>
      @props.auth.call 'media.createMediaFromRawUpload',
        file_name: file.name
        raw_upload_id: raw_upload_id
        game_id: @props.game.game_id
        resize: 800
      , withSuccess (media) => @props.onCreateMedia
        media: media
        exif: {} # EXIF.getAllTags file

  render: ->
    if @state.progress?
      return <View style={
        backgroundColor: 'white'
        position: 'absolute'
        top: 0
        bottom: 0
        left: 0
        right: 0
        flexDirection: 'column'
        alignItems: 'center'
        justifyContent: 'center'
      }>
        <ActivityIndicator
          size="large"
        />
        <Text style={fontSize: 20, margin: 10}>
          Uploading… {Math.floor(@state.progress * 100)}%
        </Text>
      </View>
    <View style={
      backgroundColor: 'white'
      position: 'absolute'
      top: 0
      bottom: 0
      left: 0
      right: 0
      flexDirection: 'column'
      alignItems: 'stretch'
    }>
      <View style={
        flex: 1
        alignItems: 'center'
        justifyContent: 'center'
      }>
        <TouchableOpacity
          onPress={=>
            ImagePicker.showImagePicker
              mediaType: 'photo'
              noData: true
              storageOptions:
                cameraRoll: true
            , (result) =>
              return if result.didCancel
              unless result?.uri?
                console.warn JSON.stringify result
                return
              if result.fileName? and result.type?
                # android (rest are ios)
                mime = result.type
                name = result.fileName
              else if result.uri.match(/\.jpe?g$/i)
                mime = 'image/jpeg'
                name = 'upload.jpg'
              else if result.uri.match(/\.png$/i)
                mime = 'image/png'
                name = 'upload.png'
              else if result.uri.match(/\.gif$/i)
                mime = 'image/gif'
                name = 'upload.gif'
              else
                console.warn JSON.stringify result
                return
              @setState file:
                uri:
                  if Platform.OS is 'ios'
                    result.uri.replace('file://', '')
                  else
                    result.uri
                isStatic: true
                type: mime
                name: name
          }
        >
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
      </View>
      <View style={
        flexDirection: 'row'
        justifyContent: 'space-between'
        alignItems: 'center'
        padding: 10
      }>
        <TouchableOpacity onPress={@props.onCancel}>
          <Text style={styles.grayButton}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={@beginUpload}>
          <Text style={styles.blueButton}>DESCRIPTION {'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  # @endif

  # @ifdef WEB
  beginUpload: ->
    file = @state.file
    return unless file?
    name = file.name
    ext = name[name.indexOf('.') + 1 ..]
    @setState progress: 0
    updateProgress = (n) => @setState progress: n
    @props.auth.rawUpload file, updateProgress, withSuccess (raw_upload_id) =>
      @props.auth.call 'media.createMediaFromRawUpload',
        file_name: "upload.#{ext}"
        raw_upload_id: raw_upload_id
        game_id: @props.game.game_id
        resize: 800
      , withSuccess (media) => @props.onCreateMedia
        media: media
        exif: EXIF.getAllTags file

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

  doEnterCaption: ->
    text = @state.text
    return unless text.match(/\S/)
    @props.onEnterCaption text

  # @ifdef NATIVE
  render: ->
    <View style={
      backgroundColor: 'white'
      position: 'absolute'
      bottom: 0
      left: 0
      right: 0
      flexDirection: 'column'
      alignItems: 'stretch'
    }>
      <View style={
        margin: 10
        flexDirection: 'row'
        alignItems: 'flex-start'
      }>
        <TextInput
          value={@state.text}
          onChangeText={(text) => @setState {text}}
          multiline={true}
          style={
            height: 150
            flex: 1
            borderColor: '#222'
            borderWidth: 1
            padding: 10
            fontSize: 16
          }
        />
        <TouchableOpacity onPress={@props.onCancel} style={margin: 10}>
          <Image source={require '../web/assets/img/x-blue.png'} />
        </TouchableOpacity>
      </View>
      <View style={
        flexDirection: 'row'
        justifyContent: 'space-between'
        alignItems: 'center'
        padding: 10
      }>
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
            placeholder="Enter a caption..."
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
  render: ->
    <View style={
      backgroundColor: 'white'
      position: 'absolute'
      bottom: 0
      left: 0
      right: 0
      flexDirection: 'column'
    }>
      <BUTTON onClick={@props.onPickLocation}><P>Pick Location</P></BUTTON>
      <BUTTON onClick={@props.onBack}><P>Back</P></BUTTON>
      <BUTTON onClick={@props.onCancel}><P>Cancel</P></BUTTON>
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
  render: ->
    <View style={
      backgroundColor: 'white'
      position: 'absolute'
      bottom: 0
      left: 0
      right: 0
      flexDirection: 'column'
    }>
      <Picker
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
      <BUTTON onClick={=> @props.onFinish @props.category}><P>Finish</P></BUTTON>
      <BUTTON onClick={@props.onBack}><P>Back</P></BUTTON>
      <BUTTON onClick={@props.onCancel}><P>Cancel</P></BUTTON>
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
          FINISH
        </a>
      </div>
    </div>
  # @endif

exports.CreateStep1 = CreateStep1
exports.CreateStep2 = CreateStep2
exports.CreateStep3 = CreateStep3
exports.CreateStep4 = CreateStep4
