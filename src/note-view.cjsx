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
, Text
, TouchableOpacity
, Linking
} = require 'react-native'
{default: FitImage} = require 'react-native-fit-image'
Hyperlink = require 'react-native-hyperlink'
# @endif

{clicker, withSuccess, P, UL, LI, DIV, BUTTON} = require './utils'

# @ifdef WEB

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

# @endif

# @ifdef NATIVE
writeParagraphs = (text) ->
  paras =
    para for para in text.split("\n") when para.match(/\S/)
  for para, i in paras
    <Hyperlink key={i} onPress={(url) => Linking.openURL url} linkStyle={color: '#176fb7'}>
      <Text style={margin: 10}>{ para }</Text>
    </Hyperlink>
# @endif

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
    <View style={
      flexDirection: 'column'
      alignItems: 'stretch'
      backgroundColor: '#e8ebf5'
      borderWidth: 1
      borderColor: '#89c'
      margin: 10
    }>
      <View style={
        flexDirection: 'row'
        justifyContent: 'flex-start'
        alignItems: 'center'
        margin: 10
      }>
        <Text style={
          fontSize: 13
        }>
          {
            if @props.canCancel
              'Editing...'
            else
              'New comment...'
          }
        </Text>
      </View>
      <TextInput
        placeholder="Enter a comment"
        value={@state.text}
        onChangeText={(text) => @setState {text}}
        multiline={true}
        style={
          height: 100
          backgroundColor: 'white'
          padding: 5
          borderWidth: 1
          borderColor: 'black'
          fontSize: 15
          marginLeft: 10
          marginRight: 10
        }
      />
      <View style={
        margin: 10
        flexDirection: 'row'
        justifyContent: 'flex-start'
        alignItems: 'stretch'
      }>
        <TouchableOpacity onPress={@doSave}>
          <Text style={
            color: 'white'
            backgroundColor: '#61c9e2'
            padding: 10
            fontSize: 16
          }>
            SAVE
          </Text>
        </TouchableOpacity>
        {
          if @props.canCancel
            <TouchableOpacity onPress={@props.onCancel}>
              <Text style={
                color: 'white'
                backgroundColor: '#cfcbcc'
                padding: 10
                marginLeft: 3
                fontSize: 16
              }>
                CANCEL
              </Text>
            </TouchableOpacity>
        }
      </View>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="note-comment">
      <p className="note-comment-credit">
        {
          if @props.canCancel
            'Editing...'
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
      <View style={
        flexDirection: 'column'
        alignItems: 'stretch'
        backgroundColor: '#e8ebf5'
        borderWidth: 1
        borderColor: '#89c'
        margin: 10
      }>
        <View style={
          flexDirection: 'row'
          justifyContent: 'flex-start'
          alignItems: 'center'
          margin: 10
        }>
          <Text style={
            fontSize: 13
          }>
            { @props.comment.user.display_name } at { @props.comment.created.toLocaleString() }
          </Text>
          {
            if @props.auth.authToken?.user_id is @props.comment.user.user_id
              <TouchableOpacity onPress={=> @setState editing: true}>
                <Image style={marginLeft: 10} source={require '../web/assets/img/freepik/edit45_blue.png'} />
              </TouchableOpacity>
          }
          {
            if @props.auth.authToken?.user_id is @props.comment.user.user_id or @props.isAdmin
              <TouchableOpacity onPress={@confirmDelete}>
                <Image style={marginLeft: 10} source={require '../web/assets/img/freepik/delete81_blue.png'} />
              </TouchableOpacity>
          }
        </View>
        <View>
          { writeParagraphs @props.comment.description }
        </View>
      </View>
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
    <View>
      {
        if @props.comments.length is 0
          <View style={
            flexDirection: 'column'
            alignItems: 'stretch'
            backgroundColor: '#e8ebf5'
            borderWidth: 1
            borderColor: '#89c'
            margin: 10
          }>
            <View style={
              flexDirection: 'row'
              justifyContent: 'flex-start'
              alignItems: 'center'
              margin: 10
            }>
              <Text style={
                fontSize: 13
              }>
                No comments.
              </Text>
            </View>
          </View>
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
          <Text style={margin: 10}>Log in to write a comment.</Text>
      }
    </View>
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
    getColor: T.func

  getDefaultProps: ->
    onClose: (->)
    onDelete: (->)
    onReload: (->)
    isAdmin: false
    onPromptLogin: (->)
    getColor: -> 'black'

  getInitialState: ->
    comments: null
    editingCaption: false

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

  saveCaption: (text) ->
    @props.auth.call 'notes.updateNote',
      note_id: @props.note.note_id
      game_id: @props.note.game_id
      description: text
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
      <View style={
        flexDirection: 'row'
        justifyContent: 'space-between'
        alignItems: 'center'
      }>
        <View style={
          backgroundColor: @props.getColor @props.note
          height: 20
          width: 20
          borderRadius: 10
          margin: 10
        } />
        <Text style={margin: 10, fontWeight: 'bold'}>
          {@props.note.user.display_name} at {@props.note.created.toLocaleString()}
        </Text>
        <TouchableOpacity onPress={@props.onClose}>
          <Image
            source={require '../web/assets/img/x-blue.png'}
            style={margin: 10}
          />
        </TouchableOpacity>
      </View>
      <View>
        <FitImage
          source={uri: @props.note.photo_url}
          style={
            alignSelf: 'stretch'
          }
        />
      </View>
      <View style={
        backgroundColor: 'rgb(97,201,226)'
        padding: 5
        flexDirection: 'row'
        justifyContent: 'flex-start'
      }>
        {
          if @props.auth.authToken? and @props.note.player_liked
            <TouchableOpacity onPress={@unlikeNote}>
              <Image style={margin: 5} source={require "../web/assets/img/freepik/heart-filled.png"} />
            </TouchableOpacity>
          else
            <TouchableOpacity onPress={@likeNote}>
              <Image style={margin: 5} source={require "../web/assets/img/freepik/heart.png"} />
            </TouchableOpacity>
        }
        {
          if @props.note.user.user_id is @props.auth.authToken?.user_id or @props.isAdmin
            <TouchableOpacity onPress={@confirmDelete}>
              <Image style={margin: 5} source={require "../web/assets/img/freepik/delete81.png"} />
            </TouchableOpacity>
        }
        {
          if @props.note.published is 'AUTO' and @props.auth.authToken?.user_id isnt @props.note.user.user_id
            <TouchableOpacity onPress={@confirmFlag}>
              <Image style={margin: 5} source={require "../web/assets/img/freepik/warning.png"} />
            </TouchableOpacity>
        }
        {
          if @props.note.user.user_id is @props.auth.authToken?.user_id
            <TouchableOpacity onPress={=> @setState editingCaption: true}>
              <Image style={margin: 5} source={require "../web/assets/img/freepik/edit45.png"} />
            </TouchableOpacity>
        }
      </View>
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
      {
        if @state.editingCaption
          <SiftrCommentInput
            defaultText={@props.note.description}
            canCancel={true}
            onCancel={=> @setState editingCaption: false}
            onSave={(text) =>
              @setState editingCaption: false
              @saveCaption text
            }
          />
        else
          <View>
            { writeParagraphs @props.note.description }
          </View>
      }
      {
        if @state.comments is null
          <Text>Loading comments...</Text>
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
    </ScrollView>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="note-view">
      <div className="note-top">
        <div className="note-dot" style={
          backgroundColor: @props.getColor @props.note
        } />
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
        {
          if @props.note.user.user_id is @props.auth.authToken?.user_id
            <a href="#" className="note-action" onClick={clicker => @setState editingCaption: true}>
              <img src="assets/img/freepik/edit45.png" />
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
      {
        if @state.editingCaption
          <div className="note-comments">
            <SiftrCommentInput
              defaultText={@props.note.description}
              canCancel={true}
              onCancel={=> @setState editingCaption: false}
              onSave={(text) =>
                @setState editingCaption: false
                @saveCaption text
              }
            />
          </div>
        else
          <div className="note-caption">
            { writeParagraphs @props.note.description }
          </div>
      }
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
