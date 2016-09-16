'use strict'

React = require 'react'
T = React.PropTypes

{Auth, Game, Tag} = require './aris'
{withSuccess, P, BUTTON} = require './utils'

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
        {' '}
        <BUTTON onClick={@beginUpload}>Upload</BUTTON>
        {' '}
        <BUTTON onClick={@props.onCancel}>Cancel</BUTTON>
      </p>
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
    <P>
      <input type="text" defaultValue={@props.defaultCaption} ref="inputText" placeholder="Enter a caption..." />
      {' '}
      <BUTTON onClick={@doEnterCaption}>Enter</BUTTON>
      {' '}
      <BUTTON onClick={@props.onBack}>Back</BUTTON>
      {' '}
      <BUTTON onClick={@props.onCancel}>Cancel</BUTTON>
    </P>
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
    <P>
      <BUTTON onClick={@props.onPickLocation}>Pick Location</BUTTON>
      {' '}
      <BUTTON onClick={@props.onBack}>Back</BUTTON>
      {' '}
      <BUTTON onClick={@props.onCancel}>Cancel</BUTTON>
    </P>

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
    <p>
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
