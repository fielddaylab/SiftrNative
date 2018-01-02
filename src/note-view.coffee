'use strict'

React = require 'react'
T = require 'prop-types'

{ Note
, Auth
, Comment
, Field
} = require './aris'

# @ifdef NATIVE
{ Alert
, View
, TextInput
, Image
, ScrollView
, TouchableOpacity
, Linking
, BackHandler
, Modal
, TouchableWithoutFeedback
} = require 'react-native'
import FitImage from 'react-native-fit-image'
import Hyperlink from 'react-native-hyperlink'
import Gallery from 'react-native-image-gallery'
{styles, Text} = require './styles'
import {Media, CacheMedia} from './media'
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

# @ifdef NATIVE
class SquareImage extends React.Component
  # image box that sets the height equal to the width

  constructor: (props) ->
    super props
    @state = {}

  render: ->
    <View
      style={
        alignSelf: 'stretch'
        flexDirection: 'row'
        height: @state.width ? undefined
        alignItems: 'stretch'
      }
      onLayout={@resize.bind(@)}
    >
      {
        @props.sources.map (source, i) =>
          if source.uri in [null, '']
            source = null
          <TouchableOpacity key={i} onPress={=> @props.onGallery source} style={flex: 1, alignItems: 'stretch'}>
            <Image
              source={source}
              style={
                resizeMode: 'cover'
                flex: 1
              }
            />
          </TouchableOpacity>
      }
    </View>

  resize: (evt) ->
    dims = evt.nativeEvent.layout
    @setState width: dims.width
# @endif

class SiftrCommentInput extends React.Component
  @propTypes:
    defaultText: T.string
    canCancel: T.bool
    onSave: T.func
    onCancel: T.func

  @defaultProps:
    defaultText: ''
    canCancel: false
    onSave: (->)
    onCancel: (->)

  constructor: (props) ->
    super props
    @state =
      text: @props.defaultText

  doSave: ->
    @props.onSave @state.text
    @setState text: ''

  # @ifdef NATIVE
  render: ->
    <View style={
      flexDirection: 'row'
      alignItems: 'stretch'
      marginTop: 5
      marginBottom: 5
    }>
      <TextInput
        placeholder={
          if @props.canCancel
            'Save comment...'
          else
            'Add comment...'
        }
        value={@state.text}
        onChangeText={(text) => @setState {text}}
        style={
          backgroundColor: 'white'
          padding: 5
          fontSize: 15
          flex: 1
        }
      />
      <TouchableOpacity onPress={@doSave.bind(@)}>
        <Text style={styles.blueButton}>
          Save
        </Text>
      </TouchableOpacity>
      {
        if @props.canCancel
          <TouchableOpacity onPress={@props.onCancel}>
            <Text style={[styles.grayButton, {marginLeft: 5}]}>
              Cancel
            </Text>
          </TouchableOpacity>
      }
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
        <a href="#" onClick={clicker @doSave.bind(@)} className="create-button-blue">
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

class SiftrComment extends React.Component
  @propTypes:
    note: T.instanceOf(Note).isRequired
    comment: T.instanceOf(Comment).isRequired
    auth: T.instanceOf(Auth).isRequired
    onEdit: T.func
    onDelete: T.func
    isAdmin: T.bool

  @defaultProps:
    onEdit: (->)
    onDelete: (->)
    isAdmin: false

  constructor: (props) ->
    super props
    @state =
      editing: false
      # @ifdef NATIVE
      commentModal: false
      userPicture: null
      # @endif

  # @ifdef NATIVE
  getUserMedia: ->
    @props.auth.call 'media.getMedia',
      media_id: @props.comment.user.media_id
    , withSuccess (userPicture) =>
      @setState {userPicture}

  componentWillMount: ->
    @getUserMedia()

  componentWillReceiveProps: (nextProps) ->
    if nextProps.comment.user.user_id isnt @props.comment.user.user_id
      @getUserMedia()
  # @endif

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
        flexDirection: 'row'
        alignItems: 'flex-start'
      }>
        {
          if @state.userPicture?
            <CacheMedia
              url={@state.userPicture.thumb_url}
              withURL={(url) =>
                <Image source={if url? then uri: url else undefined} style={
                  width: 26
                  height: 26
                  borderRadius: 13
                  margin: 10
                  marginRight: 0
                  resizeMode: 'cover'
                } />
              }
            />
          else
            <View style={
              width: 26
              height: 26
              borderRadius: 13
              backgroundColor: '#888888'
              margin: 10
              marginRight: 0
            } />
        }
        <View style={
          flex: 1
          flexDirection: 'column'
          alignItems: 'stretch'
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
              if (@props.auth.authToken?.user_id is @props.comment.user.user_id) or (@props.auth.authToken?.user_id is @props.comment.user.user_id or @props.isAdmin)
                <TouchableOpacity onPress={=> @setState commentModal: true}>
                  <Image style={marginLeft: 10, width: 17, height: 17} source={require '../web/assets/img/icon-edit-pencil.png'} />
                </TouchableOpacity>
            }
            {
              if @state.commentModal
                <OptionsModal
                  onClose={=> @setState commentModal: false}
                  options={[
                    if @props.auth.authToken?.user_id is @props.comment.user.user_id
                      text: 'Edit comment'
                      onPress: => @setState editing: true, commentModal: false
                    if @props.auth.authToken?.user_id is @props.comment.user.user_id or @props.isAdmin
                      text: 'Delete comment'
                      onPress: @confirmDelete.bind(@)
                  ].filter (x) => x?}
                />
            }
          </View>
          <View>
            { writeParagraphs @props.comment.description }
          </View>
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
              <a className="note-comment-action" href="#" onClick={clicker @confirmDelete.bind(@)}>
                <img src="assets/img/freepik/delete81_blue.png" />
              </a>
          }
        </p>
        <div>
          { writeParagraphs @props.comment.description }
        </div>
      </div>
  # @endif

class SiftrComments extends React.Component
  @propTypes:
    note: T.instanceOf(Note).isRequired
    comments: T.arrayOf(T.instanceOf Comment).isRequired
    auth: T.instanceOf(Auth).isRequired
    onEditComment: T.func
    onNewComment: T.func
    onDeleteComment: T.func
    isAdmin: T.bool

  @defaultProps:
    onEditComment: (->)
    onNewComment: (->)
    onDeleteComment: (->)
    isAdmin: false

  # @ifdef NATIVE
  render: ->
    <View style={
      borderTopWidth: 1
      borderTopColor: '#F1F5F4'
    }>
      {
        if @props.comments.length is 0
          <View style={
            flexDirection: 'column'
            alignItems: 'flex-start'
            margin: 10
          }>
            <Text style={
              fontSize: 13
            }>
              No comments.
            </Text>
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
      <View style={
        borderTopWidth: 1
        borderTopColor: '#F1F5F4'
      }>
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

# @ifdef NATIVE
class OptionsModal extends React.Component
  @defaultProps:
    onClose: (->)
    options: []

  render: ->
    <Modal transparent={true} onRequestClose={@props.onClose}>
      <TouchableWithoutFeedback onPress={@props.onClose}>
        <View style={
          height: 150
          backgroundColor: 'rgba(0,0,0,0.5)'
        } />
      </TouchableWithoutFeedback>
      <View style={
        backgroundColor: 'white'
        flex: 1
        padding: 10
        flexDirection: 'column'
        justifyContent: 'flex-start'
        alignItems: 'flex-start'
      }>
        <TouchableOpacity onPress={@props.onClose}>
          <Image style={margin: 10} source={require '../web/assets/img/x-blue.png'} />
        </TouchableOpacity>
        {
          @props.options.map ({text, onPress}) =>
            <TouchableOpacity key={text} onPress={onPress}>
              <Text style={margin: 10}>{ text }</Text>
            </TouchableOpacity>
        }
      </View>
    </Modal>

class GalleryModal extends React.Component
  render: ->
    <Modal onRequestClose={@props.onClose}>
      <Gallery
        style={flex: 1, backgroundColor: 'black'}
        images={@props.images}
        initialPage={@props.initialPage}
      />
      <TouchableOpacity onPress={@props.onClose} style={
        position: 'absolute'
        top: 25
        left: 15
        backgroundColor: 'rgba(255,255,255,0.2)'
        padding: 2
      }>
        <Image source={require '../web/assets/img/icon-back.png'} style={
          width: 36 * 0.75
          height: 28 * 0.75
        } />
      </TouchableOpacity>
    </Modal>
# @endif

class SiftrNoteView extends React.Component
  @propTypes:
    note: T.instanceOf(Note).isRequired
    onClose: T.func
    auth: T.instanceOf(Auth).isRequired
    onDelete: T.func
    onReload: T.func
    isAdmin: T.bool
    onPromptLogin: T.func
    getColor: T.func
    fields: T.arrayOf(T.instanceOf Field)

  @defaultProps:
    onClose: (->)
    onDelete: (->)
    onReload: (->)
    isAdmin: false
    onPromptLogin: (->)
    getColor: -> 'black'

  constructor: (props) ->
    super props
    @state =
      comments: null
      editingCaption: false
      # @ifdef NATIVE
      noteModal: false
      gallery: null
      # @endif

  # @ifdef NATIVE
  openNoteOptions: ->
    @setState noteModal: true
  # @endif

  componentWillMount: ->
    @loadExtra()
    # @ifdef NATIVE
    @hardwareBack = =>
      @props.onClose()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack
    # @endif

  # @ifdef NATIVE
  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack
  # @endif

  componentWillReceiveProps: (nextProps) ->
    if @props.note.note_id isnt nextProps.note.note_id
      @setState comments: null
      @loadExtra nextProps.note

  loadExtra: (note = @props.note) ->
    # load comments
    @props.auth.getNoteCommentsForNote
      note_id: note.note_id
      game_id: note.game_id
    , withSuccess (comments) =>
      if @props.note.note_id is note.note_id
        @setState
          comments:
            comment for comment in comments when comment.description.match(/\S/)
    # load field data
    @props.auth.getFieldDataForNote
      note_id: note.note_id
    , withSuccess (data) =>
      if @props.note.note_id is note.note_id
        @setState
          field_data: data

  doNewComment: (text) ->
    @props.auth.createNoteComment
      game_id: @props.note.game_id
      note_id: @props.note.note_id
      description: text
    , withSuccess => @loadExtra()

  doEditComment: (comment, text) ->
    @props.auth.updateNoteComment
      note_comment_id: comment.comment_id
      description: text
    , withSuccess => @loadExtra()

  doDeleteComment: (comment) ->
    @props.auth.call 'note_comments.deleteNoteComment',
      note_comment_id: comment.comment_id
    , withSuccess => @loadExtra()

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
    # TODO move to CacheMedia

    photoIDs = [@props.note.media_id]
    if (@state.field_data? and @props.fields?)
      for field in @props.fields
        if field.field_type is 'MEDIA'
          data =
            d for d in @state.field_data when d.field_id is field.field_id
          if data.length > 0
            photoIDs.push data[0].media.media_id

    photoURLs =
      (@state["media#{media_id}"] or '') for media_id in photoIDs

    <ScrollView
      ref={(sv) => @scrollView = sv}
      style={
        backgroundColor: 'white'
        position: 'absolute'
        top: 0
        bottom: 0
        left: 0
        right: 0
        flexDirection: 'column'
      }
      keyboardShouldPersistTaps="handled"
    >
      {
        photoIDs.map (media_id) =>
          <Media
            key={media_id}
            auth={@props.auth}
            media_id={media_id}
            onLoad={(url) => @setState {"media#{media_id}": url}}
          />
      }
      {
        if @state.noteModal
          <OptionsModal
            onClose={=> @setState noteModal: false}
            options={[
              if @props.note.user.user_id is @props.auth.authToken?.user_id
                text: 'Edit post'
                onPress: => @setState editingCaption: true, noteModal: false
              if @props.note.published is 'AUTO' and @props.auth.authToken?.user_id isnt @props.note.user.user_id
                text: 'Flag for inappropriate content'
                onPress: @confirmFlag.bind(@)
              if @props.note.user.user_id is @props.auth.authToken?.user_id or @props.isAdmin
                text: 'Delete post'
                onPress: @confirmDelete.bind(@)
            ].filter (x) => x?}
          />
        else if @state.gallery?
          <GalleryModal
            onClose={=> @setState gallery: null}
            initialPage={photoURLs.indexOf @state.gallery}
            images={{source: {uri}} for uri in photoURLs}
          />
      }
      <SquareImage
        sources={{uri} for uri in photoURLs}
        onGallery={({uri}) => @setState gallery: uri}
      />
      <View style={
        backgroundColor: 'white'
        padding: 5
        flexDirection: 'row'
        justifyContent: 'flex-start'
        borderBottomColor: '#F1F5F4'
        borderBottomWidth: 1
        alignItems: 'center'
      }>
        {
          if @props.auth.authToken? and @props.note.player_liked
            <TouchableOpacity onPress={@unlikeNote.bind(@)}>
              <Image style={margin: 5, width: 18, height: 16} source={require "../web/assets/img/icon-heart-full.png"} />
            </TouchableOpacity>
          else
            <TouchableOpacity onPress={@likeNote.bind(@)}>
              <Image style={margin: 5, width: 18, height: 16} source={require "../web/assets/img/icon-heart-empty.png"} />
            </TouchableOpacity>
        }
        <TouchableOpacity onPress={=> @scrollView?.scrollToEnd animated: true}>
          <Image style={margin: 5, width: 19, height: 17} source={require "../web/assets/img/icon-speech-bubble.png"} />
        </TouchableOpacity>
      </View>
      {
        switch @props.note.published
          when 'PENDING'
            if @props.isAdmin
              <BUTTON onClick={@approveNote.bind(@)}><P>Approve this note</P></BUTTON>
            else
              <P>This note is visible only to you until a moderator approves it.</P>
          when 'AUTO', 'APPROVED'
            null
      }
      <Text style={margin: 10}>
        { @props.note.created.toLocaleString() }
      </Text>
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
        if not (@state.field_data? and @props.fields?)
          <Text style={margin: 10}>Loading data...</Text>
        else
          for field in @props.fields
            data =
              d for d in @state.field_data when d.field_id is field.field_id
            switch field.field_type
              when 'TEXT', 'TEXTAREA'
                <Text key={field.field_id} style={margin: 10}>
                  [{field.label}] {data[0]?.field_data}
                </Text>
              when 'SINGLESELECT', 'MULTISELECT'
                <Text key={field.field_id} style={margin: 10}>
                  [{field.label}]
                  {
                    opts = []
                    for d in data
                      for opt in field.options
                        if opt.field_option_id is d.field_option_id
                          opts.push opt.option
                    ' ' + opts.join(', ')
                  }
                </Text>
              when 'NOMEN'
                <Text key={field.field_id} style={margin: 10}>
                  [Nomen {field.label}] {data[0]?.field_data}
                </Text>
              else
                continue
      }
      {
        if @state.comments is null
          <Text style={margin: 10}>Loading comments...</Text>
        else
          <SiftrComments
            note={@props.note}
            auth={@props.auth}
            comments={@state.comments ? []}
            onEditComment={@doEditComment.bind(@)}
            onNewComment={@doNewComment.bind(@)}
            onDeleteComment={@doDeleteComment.bind(@)}
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
            <a href="#" className="note-action" onClick={clicker @unlikeNote.bind(@)}>
              <img src="assets/img/freepik/heart-filled.png" />
            </a>
          else
            <a href="#" className="note-action" onClick={clicker @likeNote.bind(@)}>
              <img src="assets/img/freepik/heart.png" />
            </a>
        }
        {
          if @props.note.user.user_id is @props.auth.authToken?.user_id or @props.isAdmin
            <a href="#" className="note-action" onClick={clicker @confirmDelete.bind(@)}>
              <img src="assets/img/freepik/delete81.png" />
            </a>
        }
        {
          if @props.note.published is 'AUTO' and @props.auth.authToken?.user_id isnt @props.note.user.user_id
            <a href="#" className="note-action" onClick={clicker @confirmFlag.bind(@)}>
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
              <BUTTON onClick={@approveNote.bind(@)}><P>Approve this note</P></BUTTON>
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
              onEditComment={@doEditComment.bind(@)}
              onNewComment={@doNewComment.bind(@)}
              onDeleteComment={@doDeleteComment.bind(@)}
              isAdmin={@props.isAdmin}
            />
        }
      </div>
    </div>
  # @endif

exports.SiftrNoteView = SiftrNoteView
