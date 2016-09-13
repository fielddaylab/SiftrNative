'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
, TouchableOpacity
} = require 'react-native'
# @endif

{ Note
, Auth
} = require './aris'

{clicker, withSuccess} = require './utils'

SiftrNoteView = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    onClose: T.func
    auth: T.instanceOf(Auth).isRequired

  getDefaultProps: ->
    onClose: (->)

  getInitialState: ->
    comments: null

  componentWillMount: ->
    @loadComments()

  componentWillReceiveProps: (nextProps) ->
    if @props.note.note_id isnt nextProps.note.note_id
      @setState comments: null
      @loadComments nextProps.note

  loadComments: (note = @props.note) ->
    @props.auth.getNoteCommentsForNote
      note_id: note.note_id
      game_id: note.game_id
    , withSuccess (comments) =>
      if @props.note.note_id is note.note_id
        @setState {comments}

  # @ifdef NATIVE
  render: ->
    <View>
      <Text>{@props.note.description}</Text>
      {
        if @state.comments is null
          <Text>Loading comments...</Text>
        else if @state.comments.length is 0
          <Text>No comments.</Text>
        else
          <View>
            {
              <Text key={comment.comment_id}>{comment.description}</Text> for comment in @state.comments
            }
          </View>
      }
      <TouchableOpacity onPress={@props.onClose}>
        <Text>Close Note</Text>
      </TouchableOpacity>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <div>
      <p>{@props.note.description}</p>
      {
        if @state.comments is null
          <p>Loading comments...</p>
        else if @state.comments.length is 0
          <p>No comments.</p>
        else
          <ul>
            {
              <li key={comment.comment_id}>{comment.description}</li> for comment in @state.comments
            }
          </ul>
      }
      <a href="#" onClick={clicker @props.onClose}>Close Note</a>
    </div>
  # @endif

exports.SiftrNoteView = SiftrNoteView
