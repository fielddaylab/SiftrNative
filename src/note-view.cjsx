'use strict'

React = require 'react'
T = React.PropTypes

{ Note
, Auth
, Comment
} = require './aris'

{clicker, withSuccess, P, UL, LI, DIV, BUTTON} = require './utils'

SiftrCommentInput = React.createClass
  propTypes:
    defaultText: T.string
    canCancel: T.bool
    onSave: T.func
    onCancel: T.func

  getDefaultProps: ->
    defaultText: ''
    canCancel: false
    onSave: (->)
    onCancel: (->)

  doSave: ->
    @props.onSave @refs.input.value

  # @ifdef NATIVE
  render: ->
    null # TODO
  # @endif

  # @ifdef WEB
  render: ->
    <p>
      <input placeholder="Enter a comment" type="text" defaultValue={@props.defaultText} ref="input" />
      <button onClick={clicker => @doSave()}>Save</button>
      {
        if @props.canCancel
          <button onClick={clicker @props.onCancel}>Cancel</button>
        else
          null
      }
    </p>
  # @endif

SiftrComment = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    comment: T.instanceOf(Comment).isRequired
    auth: T.instanceOf(Auth).isRequired
    onEdit: T.func

  getDefaultProps: ->
    onEdit: (->)

  getInitialState: ->
    editing: false

  render: ->
    if @state.editing
      <SiftrCommentInput
        defaultText={@props.comment.description}
        canCancel={true}
        onCancel={=> @setState editing: false}
        onSave={(text) =>
          @setState editing: false
          @props.onEdit text
        }
      />
    else
      <DIV>
        <P>
          [{ @props.comment.user.display_name }, { @props.comment.created.toLocaleString() }] { @props.comment.description }
        </P>
        {
          if @props.auth.authToken?.user_id is @props.comment.user.user_id
            <BUTTON onClick={=> @setState editing: true}>
              <P>[EDIT]</P>
            </BUTTON>
          else
            null
        }
      </DIV>

SiftrComments = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    comments: T.arrayOf(T.instanceOf Comment).isRequired
    auth: T.instanceOf(Auth).isRequired
    onEditComment: T.func
    onNewComment: T.func

  getDefaultProps: ->
    onEditComment: (->)
    onNewComment: (->)

  render: ->
    <DIV>
      {
        if @props.comments.length is 0
          <P>No comments.</P>
        else
          <UL>
            {
              @props.comments.map (comment) =>
                <LI key={comment.comment_id}>
                  <SiftrComment
                    comment={comment}
                    note={@props.note}
                    auth={@props.auth}
                    onEdit={(text) => @props.onEditComment comment, text}
                  />
                </LI>
            }
          </UL>
      }
      {
        if @props.auth.authToken?
          <SiftrCommentInput
            canCancel={false}
            onSave={@props.onNewComment}
          />
        else
          <P>Log in to write a comment.</P>
      }
    </DIV>

SiftrNoteView = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    onClose: T.func
    auth: T.instanceOf(Auth).isRequired
    onDelete: T.func

  getDefaultProps: ->
    onClose: (->)
    onDelete: (->)

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

  doNewComment: (text) ->
    @props.auth.createNoteComment
      game_id: @props.note.game_id
      note_id: @props.note.note_id
      description: text
    , withSuccess => @loadComments()

  doEditComment: (comment, text) ->
    @props.auth.updateNoteComment
      note_comment_id: comment.comment_id
      description: text
    , withSuccess => @loadComments()

  render: ->
    <DIV>
      {
      # @ifdef WEB
        <p>
          <img src={@props.note.photo_url} />
        </p>
      # @endif
      # @ifdef NATIVE
        null
      # @endif
      }
      <P>Posted by {@props.note.user.display_name} at {@props.note.created.toLocaleString()}</P>
      <P>{@props.note.description}</P>
      {
        if @state.comments is null
          <P>Loading comments...</P>
        else
          <SiftrComments
            note={@props.note}
            auth={@props.auth}
            comments={@state.comments ? []}
            onEditComment={@doEditComment}
            onNewComment={@doNewComment}
          />
      }
      <BUTTON onClick={@props.onClose}>
        <P>Close Note</P>
      </BUTTON>
    </DIV>

exports.SiftrNoteView = SiftrNoteView
