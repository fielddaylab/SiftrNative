'use strict'

React = require 'react'
T = React.PropTypes

EXIF = require 'exif-js'

# @ifdef NATIVE
ImagePicker = require 'react-native-image-picker'
{Platform, Image} = require 'react-native'
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
      return <P>Uploading... {Math.floor(@state.progress * 100)}%</P>
    <DIV>
      <BUTTON onClick={=>
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
      }>
        <P>Pick Image</P>
      </BUTTON>
      <BUTTON onClick={@beginUpload}>
        <P>Upload</P>
      </BUTTON>
      <BUTTON onClick={@props.onCancel}>
        <P>Cancel</P>
      </BUTTON>
      {
        if @state.file?
          <Image source={@state.file} style={styles.previewImage} />
        else
          <P>Pick an image.</P>
      }
    </DIV>
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
          <span>Uploading... {Math.floor(@state.progress * 100)}%</span>
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

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  doEnterCaption: ->
    text = @refs.inputText.value
    return unless text.match(/\S/)
    @props.onEnterCaption text

  render: ->
    <div className="create-step-2">
      <div className="create-content">
        <div className="create-caption-box">
          <textarea className="create-caption"
            defaultValue={@props.defaultCaption}
            ref="inputText"
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

  render: ->
    <p className="create-step-3">
      <BUTTON onClick={@props.onPickLocation}>Pick Location</BUTTON>
      {' '}
      <BUTTON onClick={@props.onBack}>Back</BUTTON>
      {' '}
      <BUTTON onClick={@props.onCancel}>Cancel</BUTTON>
    </p>

# Step 4: Category
CreateStep4 = React.createClass
  propTypes:
    categories: T.arrayOf(T.instanceOf Tag).isRequired
    onPickCategory: T.func
    onBack: T.func
    onCancel: T.func

  getDefaultProps: ->
    onPickCategory: (->)
    onBack: (->)
    onCancel: (->)

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  doPickCategory: ->
    tag_id = parseInt @refs.inputSelect.value
    for category in @props.categories
      if category.tag_id is tag_id
        @props.onPickCategory category
        return

  render: ->
    <p className="create-step-4">
      <select ref="inputSelect">
        {
          @props.categories.map (category) =>
            <option key={category.tag_id} value={category.tag_id}>{category.tag}</option>
        }
      </select>
      {' '}
      <BUTTON onClick={@doPickCategory}>Finish</BUTTON>
      {' '}
      <BUTTON onClick={@props.onBack}>Back</BUTTON>
      {' '}
      <BUTTON onClick={@props.onCancel}>Cancel</BUTTON>
    </p>
  # @endif

exports.CreateStep1 = CreateStep1
exports.CreateStep2 = CreateStep2
exports.CreateStep3 = CreateStep3
exports.CreateStep4 = CreateStep4
