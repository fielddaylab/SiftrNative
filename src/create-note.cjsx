'use strict'

React = require 'react'
T = React.PropTypes

{Auth, Game} = require './aris'
{withSuccess, BUTTON} = require './utils'

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

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  beginUpload: ->
    file = (@refs.fileInput?.files ? [])[0]
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
      , withSuccess @props.onCreateMedia

  render: ->
    if @state.progress?
      <p>
        Uploading... {Math.floor(@state.progress * 100)}%
      </p>
    else
      <p>
        <input type="file" ref="fileInput" />
        <BUTTON onClick={@beginUpload}>Upload</BUTTON>
      </p>
  # @endif

# Step 2: Caption
CreateStep2 = React.createClass
  propTypes:
    onEnterCaption: T.func
    onBack: T.func
    onCancel: T.func

  getDefaultProps: ->
    onEnterCaption: (->)
    onBack: (->)
    onCancel: (->)

  render: ->
    null

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
    null

# Step 4: Category
CreateStep4 = React.createClass
  propTypes:
    onPickCategory: T.func
    onBack: T.func
    onCancel: T.func

  getDefaultProps: ->
    onPickCategory: (->)
    onBack: (->)
    onCancel: (->)

  render: ->
    null

exports.CreateStep1 = CreateStep1
