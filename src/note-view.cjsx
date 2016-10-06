'use strict'

React = require 'react'
T = React.PropTypes

{ Note
, Auth
, Comment
} = require './aris'

# @ifdef NATIVE
{ Alert
, View
, TextInput
, Image
, ScrollView
} = require 'react-native'
# @endif

{clicker, withSuccess, P, UL, LI, DIV, BUTTON} = require './utils'

# By Diego Perini. https://gist.github.com/dperini/729294
# MT: removed the ^ and $, and removed the \.? "TLD may end with dot"
# since it often breaks people's links
urlRegex = /(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?/i

linkableText = (str) ->
  md = str.match(urlRegex)
  if md?
    <span>
      { str[0 ... md.index] }
      <a href={md[0]} target="_blank">
        { md[0] }
      </a>
      { linkableText str[(md.index + md[0].length)..] }
    </span>
  else
    <span>{ str }</span>

writeParagraphs = (text) ->
  paras =
    para for para in text.split("\n") when para.match(/\S/)
  for para, i in paras
    <p key={i}>{ linkableText para }</p>

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

  getInitialState: ->
    text: @props.defaultText

  doSave: ->
    @props.onSave @state.text
    @setState text: ''

  # @ifdef NATIVE
  render: ->
    <View>
      <TextInput
        placeholder="Enter a comment"
        value={@state.text}
        onChangeText={(text) => @setState {text}}
      />
      <BUTTON onClick={@doSave}><P>Save</P></BUTTON>
      {
        if @props.canCancel
          <BUTTON onClick={@props.onCancel}><P>Cancel</P></BUTTON>
      }
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="note-comment">
      <p className="note-comment-credit">
        {
          if @props.canCancel
            'Editing comment...'
          else
            'New comment...'
        }
      </p>
      <textarea placeholder="Enter a comment..."
        value={@state.text}
        onChange={(e) => @setState text: e.target.value}
      />
      <p>
        <a href="#" onClick={clicker @doSave} className="create-button-blue">
          SAVE
        </a>
        {' '}
        {
          if @props.canCancel
            <a href="#" onClick={clicker @props.onCancel} className="create-button-gray">
              CANCEL
            </a>
        }
      </p>
    </div>
  # @endif

SiftrComment = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    comment: T.instanceOf(Comment).isRequired
    auth: T.instanceOf(Auth).isRequired
    onEdit: T.func
    onDelete: T.func
    isAdmin: T.bool

  getDefaultProps: ->
    onEdit: (->)
    onDelete: (->)
    isAdmin: false

  getInitialState: ->
    editing: false

  # @ifdef NATIVE
  confirmDelete: ->
    msg = 'Are you sure you want to delete this comment?'
    cancel =
      text: 'Cancel'
      style: 'cancel'
      onPress: (->)
    ok =
      text: 'OK'
      onPress: => @props.onDelete @props.comment
    Alert.alert 'Confirm Delete', msg, [cancel, ok]
  # @endif

  # @ifdef WEB
  confirmDelete: ->
    if confirm 'Are you sure you want to delete this comment?'
      @props.onDelete @props.comment
  # @endif

  # @ifdef NATIVE
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
              <P>[Edit]</P>
            </BUTTON>
        }
        {
          if @props.auth.authToken?.user_id is @props.comment.user.user_id or @props.isAdmin
            <BUTTON onClick={@confirmDelete}>
              <P>[Delete]</P>
            </BUTTON>
        }
      </DIV>
  # @endif

  # @ifdef WEB
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
      <div className="note-comment">
        <p className="note-comment-credit">
          { @props.comment.user.display_name } at { @props.comment.created.toLocaleString() }
          {
            if @props.auth.authToken?.user_id is @props.comment.user.user_id
              <a className="note-comment-action" href="#" onClick={clicker => @setState editing: true}>
                <img src="assets/img/freepik/edit45_blue.png" />
              </a>
          }
          {
            if @props.auth.authToken?.user_id is @props.comment.user.user_id or @props.isAdmin
              <a className="note-comment-action" href="#" onClick={clicker @confirmDelete}>
                <img src="assets/img/freepik/delete81_blue.png" />
              </a>
          }
        </p>
        <div>
          { writeParagraphs @props.comment.description }
        </div>
      </div>
  # @endif

SiftrComments = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    comments: T.arrayOf(T.instanceOf Comment).isRequired
    auth: T.instanceOf(Auth).isRequired
    onEditComment: T.func
    onNewComment: T.func
    onDeleteComment: T.func
    isAdmin: T.bool

  getDefaultProps: ->
    onEditComment: (->)
    onNewComment: (->)
    onDeleteComment: (->)
    isAdmin: false

  # @ifdef NATIVE
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
                    onDelete={@props.onDeleteComment}
                    isAdmin={@props.isAdmin}
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
  # @endif

  # @ifdef WEB
  render: ->
    <div>
      {
        if @props.comments.length is 0
          <div className="note-comment">
            <p className="note-comment-credit">No comments.</p>
          </div>
        else
          @props.comments.map (comment) =>
            <SiftrComment
              key={comment.comment_id}
              comment={comment}
              note={@props.note}
              auth={@props.auth}
              onEdit={(text) => @props.onEditComment comment, text}
              onDelete={@props.onDeleteComment}
              isAdmin={@props.isAdmin}
            />
      }
      {
        if @props.auth.authToken?
          <SiftrCommentInput
            canCancel={false}
            onSave={@props.onNewComment}
          />
        else
          <p>Log in to write a comment.</p>
      }
    </div>
  # @endif

SiftrNoteView = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    onClose: T.func
    auth: T.instanceOf(Auth).isRequired
    onDelete: T.func
    onReload: T.func
    isAdmin: T.bool
    onPromptLogin: T.func

  getDefaultProps: ->
    onClose: (->)
    onDelete: (->)
    onReload: (->)
    isAdmin: false
    onPromptLogin: (->)

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

  doDeleteComment: (comment) ->
    @props.auth.call 'note_comments.deleteNoteComment',
      note_comment_id: comment.comment_id
    , withSuccess => @loadComments()

  likeNote: ->
    unless @props.auth.authToken?
      @props.onPromptLogin()
      return
    @props.auth.call 'notes.likeNote',
      game_id: @props.note.game_id
      note_id: @props.note.note_id
    , withSuccess => @props.onReload @props.note

  unlikeNote: ->
    unless @props.auth.authToken?
      @props.onPromptLogin()
      return
    @props.auth.call 'notes.unlikeNote',
      game_id: @props.note.game_id
      note_id: @props.note.note_id
    , withSuccess => @props.onReload @props.note

  approveNote: ->
    unless @props.auth.authToken?
      @props.onPromptLogin()
      return
    @props.auth.call 'notes.approveNote',
      note_id: @props.note.note_id
    , withSuccess => @props.onReload @props.note

  # @ifdef NATIVE
  confirmFlag: ->
    msg = 'Are you sure you want to flag this note for inappropriate content?'
    cancel =
      text: 'Cancel'
      style: 'cancel'
      onPress: (->)
    ok =
      text: 'OK'
      onPress: => @props.onFlag @props.note
    Alert.alert 'Confirm Flag', msg, [cancel, ok]

  confirmDelete: ->
    msg = 'Are you sure you want to delete this note?'
    cancel =
      text: 'Cancel'
      style: 'cancel'
      onPress: (->)
    ok =
      text: 'OK'
      onPress: => @props.onDelete @props.note
    Alert.alert 'Confirm Delete', msg, [cancel, ok]
  # @endif

  # @ifdef WEB
  confirmFlag: ->
    if confirm 'Are you sure you want to flag this note for inappropriate content?'
      @props.onFlag @props.note

  confirmDelete: ->
    if confirm 'Are you sure you want to delete this note?'
      @props.onDelete @props.note
  # @endif

  # @ifdef NATIVE
  render: ->
    <ScrollView style={
      backgroundColor: 'white'
      position: 'absolute'
      top: 0
      bottom: 0
      left: 0
      right: 0
      flexDirection: 'column'
    }>
      <View>
        <Image
          source={uri: @props.note.photo_url}
          style={
            width: 300
            height: 300
          }
        />
      </View>
      <P>Posted by {@props.note.user.display_name} at {@props.note.created.toLocaleString()}</P>
      {
        switch @props.note.published
          when 'PENDING'
            if @props.isAdmin
              <BUTTON onClick={@approveNote}><P>Approve this note</P></BUTTON>
            else
              <P>This note is visible only to you until a moderator approves it.</P>
          when 'AUTO'
            <BUTTON onClick={@confirmFlag}><P>Flag this note</P></BUTTON>
          when 'APPROVED'
            null
      }
      {
        if @props.auth.authToken?
          if @props.note.player_liked
            <BUTTON onClick={@unlikeNote}><P>Unlike this note</P></BUTTON>
          else
            <BUTTON onClick={@likeNote}><P>Like this note</P></BUTTON>
        else
          <P>Log in to like this note.</P>
      }
      {
        if @props.note.user.user_id is @props.auth.authToken?.user_id or @props.isAdmin
          <BUTTON onClick={@confirmDelete}><P>Delete this note</P></BUTTON>
      }
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
            onDeleteComment={@doDeleteComment}
            isAdmin={@props.isAdmin}
          />
      }
      <BUTTON onClick={@props.onClose}>
        <P>Close Note</P>
      </BUTTON>
    </ScrollView>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="note-view">
      <div className="note-top">
        <h2 className="note-credit">
          {@props.note.user.display_name} at {@props.note.created.toLocaleString()}
        </h2>
        <a href="#" onClick={clicker @props.onClose} className="note-x">
          <img src="assets/img/x-blue.png" />
        </a>
      </div>
      <a href={@props.note.photo_url} target="_blank">
        <img className="note-photo" src={@props.note.photo_url} />
      </a>
      <div className="note-actions">
        {
          if @props.auth.authToken? and @props.note.player_liked
            <a href="#" className="note-action" onClick={clicker @unlikeNote}>
              <img src="assets/img/freepik/heart-filled.png" />
            </a>
          else
            <a href="#" className="note-action" onClick={clicker @likeNote}>
              <img src="assets/img/freepik/heart.png" />
            </a>
        }
        {
          if @props.note.user.user_id is @props.auth.authToken?.user_id or @props.isAdmin
            <a href="#" className="note-action" onClick={clicker @confirmDelete}>
              <img src="assets/img/freepik/delete81.png" />
            </a>
        }
        {
          if @props.note.published is 'AUTO' and @props.auth.authToken?.user_id isnt @props.note.user.user_id
            <a href="#" className="note-action" onClick={clicker @confirmFlag}>
              <img src="assets/img/freepik/warning.png" />
            </a>
        }
      </div>
      {
        switch @props.note.published
          when 'PENDING'
            if @props.isAdmin
              <BUTTON onClick={@approveNote}><P>Approve this note</P></BUTTON>
            else
              <P>This note is visible only to you until a moderator approves it.</P>
          when 'AUTO', 'APPROVED'
            null
      }
      <div className="note-caption">
        { writeParagraphs @props.note.description }
      </div>
      <div className="note-comments">
        {
          if @state.comments is null
            <div className="note-comment">
              <p className="note-comment-credit">Loading comments...</p>
            </div>
          else
            <SiftrComments
              note={@props.note}
              auth={@props.auth}
              comments={@state.comments ? []}
              onEditComment={@doEditComment}
              onNewComment={@doNewComment}
              onDeleteComment={@doDeleteComment}
              isAdmin={@props.isAdmin}
            />
        }
      </div>
    </div>
  # @endif

exports.SiftrNoteView = SiftrNoteView
