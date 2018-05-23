'use strict'

# @ifdef NATIVE
{ AsyncStorage
, Alert
} = require 'react-native'
# @endif
update = require 'immutability-helper'
Photos = require './photos'

ARIS_URL = 'https://arisgames.org/server/'
# ARIS_URL = 'http://localhost:10080/server/'

class Game
  constructor: (json) ->
    if json?
      @game_id       = parseInt json.game_id
      @name          = json.name
      @description   = json.description
      @latitude      = parseFloat json.map_latitude
      @longitude     = parseFloat json.map_longitude
      @zoom          = parseInt json.map_zoom_level
      @siftr_url     = json.siftr_url or null
      @is_siftr      = if parseInt json.is_siftr  then true else false
      @published     = if parseInt json.published then true else false
      @moderated     = if parseInt json.moderated then true else false
      @colors_id     = parseInt(json.colors_id) or null
      @icon_media_id = parseInt json.icon_media_id
      @created       = new Date(json.created.replace(' ', 'T') + 'Z')
      @prompt        = json.prompt
      @password      = json.password
      @type          = json.type
    else
      @game_id       = null
      @name          = null
      @description   = null
      @latitude      = null
      @longitude     = null
      @zoom          = null
      @siftr_url     = null
      @is_siftr      = null
      @published     = null
      @moderated     = null
      @colors_id     = null
      @icon_media_id = null
      @created       = null
      @prompt        = null
      @password      = null
      @type          = null

  createJSON: ->
    game_id:        @game_id or undefined
    name:           @name or ''
    description:    @description or ''
    map_latitude:   @latitude or 0
    map_longitude:  @longitude or 0
    map_zoom_level: @zoom or 0
    siftr_url:      @siftr_url
    is_siftr:       @is_siftr
    published:      @published
    moderated:      @moderated
    colors_id:      @colors_id
    icon_media_id:  @icon_media_id
    prompt:         @prompt
    password:       @password
    type:           @type

deserializeGame = (json) ->
  g = Object.assign(new Game, json)
  g.created = new Date(g.created)
  g

class Colors
  constructor: (json) ->
    if json?
      @colors_id = parseInt json.colors_id
      @name      = json.name
      @tag_1     = json.tag_1
      @tag_2     = json.tag_2
      @tag_3     = json.tag_3
      @tag_4     = json.tag_4
      @tag_5     = json.tag_5
      @tag_6     = json.tag_6
      @tag_7     = json.tag_7
      @tag_8     = json.tag_8

class User
  constructor: (json) ->
    if json?
      @user_id      = parseInt json.user_id
      @display_name = json.display_name or json.user_name
      @media_id     = parseInt json.media_id

arisHTTPS = (x) ->
  if typeof x is 'string'
    x.replace('http://arisgames.org', 'https://arisgames.org')
  else
    x

class Tag
  constructor: (json) ->
    if json?
      @icon_url   = arisHTTPS(json.media?.data?.url)
      @tag        = json.tag
      @tag_id     = parseInt json.tag_id
      @game_id    = parseInt json.game_id
      @sort_index = parseInt json.sort_index
    else
      @icon_url   = null
      @tag        = null
      @tag_id     = null
      @game_id    = null
      @sort_index = null

  createJSON: ->
    tag_id: @tag_id or undefined
    game_id: @game_id
    tag: @tag

class Comment
  constructor: (json) ->
    if json?
      @description = json.description
      @comment_id  = parseInt json.note_comment_id
      @user        = new User json.user
      @created     = new Date(json.created.replace(' ', 'T') + 'Z')
      @note_id     = parseInt json.note_id

class Note
  constructor: (json = null) ->
    if json?
      @note_id      = parseInt json.note_id
      @game_id      = parseInt json.game_id
      if json.user?
        @user       = new User json.user
      else
        @user       = new User
          user_id:      json.user_id
          display_name: json.display_name
      @description  = json.description
      @media_id     = parseInt json.media?.data?.media_id
      @photo_url    =
        if 0 in [parseInt(json.media?.data?.media_id), parseInt(json.media_id)]
          null
        else
          arisHTTPS(json.media?.url ? json.media.data.url)
      @thumb_url    =
        if 0 in [parseInt(json.media?.data?.media_id), parseInt(json.media_id)]
          null
        else
          arisHTTPS(json.media?.big_thumb_url ? json.media.data.big_thumb_url)
      @latitude     = parseFloat json.latitude
      @longitude    = parseFloat json.longitude
      @tag_id       = parseInt json.tag_id
      @created      = new Date(json.created.replace(' ', 'T') + 'Z')
      @player_liked = json.player_liked? and !!(parseInt json.player_liked)
      @note_likes   = parseInt json.note_likes
      @comments     = for o in (json.comments?.data ? [])
        comment = new Comment o
        continue unless comment.description?.match(/\S/)
        comment
      @published    = json.published

deserializeNote = (json) ->
  n = Object.assign(new Note, json)
  n.user = Object.assign(new User, n.user)
  n.created = new Date(n.created)
  n.comments =
    Object.assign(new Comment, o) for o in n.comments
  n

class Field
  constructor: (json = null) ->
    if json?
      @field_id   = parseInt json.field_id
      @game_id    = parseInt json.game_id
      @field_type = json.field_type
      @label      = json.label
      @required   = !!(parseInt json.required)
      @sort_index = if json.sort_index? then parseInt json.sort_index else null

class FieldOption
  constructor: (json = null) ->
    if json?
      @field_option_id = parseInt json.field_option_id
      @field_id        = parseInt json.field_id
      @game_id         = parseInt json.game_id
      @option          = json.option
      @sort_index      = if json.sort_index? then parseInt json.sort_index else null

class FieldData
  constructor: (json = null) ->
    if json?
      @field_data_id   = parseInt json.field_data_id
      @note_id         = parseInt json.note_id
      @field_id        = parseInt json.field_id
      @field_data      = json.field_data
      @media_id        = parseInt json.media_id
      @media           = json.media
      @field_option_id = parseInt json.field_option_id

displayError = (err) ->
  if err.returnCodeDescription?
    # @ifdef NATIVE
    Alert.alert("Error", err.returnCodeDescription)
    # @endif
    # @ifdef WEB
    alert(err.returnCodeDescription)
    # @endif
  else
    # @ifdef NATIVE
    Alert.alert(err.error, err.errorMore)
    # @endif
    # @ifdef WEB
    alert("#{err.error} - #{err.errorMore}")
    # @endif

sortByIndex = (key_id) -> (a, b) ->
  if a.sort_index? and b.sort_index?
    a.sort_index - b.sort_index
  else if a.sort_index?
    1
  else if b.sort_index?
    -1
  else
    a[key_id] - b[key_id]

# Handles Aris v2 authentication and API calls.
class Auth
  constructor: (json = null) ->
    @authToken =
      if json?
        user_id:      parseInt json.user_id
        permission:   'read_write'
        key:          json.read_write_key
        username:     json.user_name
        display_name: json.display_name
        media_id:     json.media_id
        email:        json.email
      else
        null
    @bio = json?.bio
    @url = json?.url

  rawUpload: (file, reportProgress, cb) ->
    req = new XMLHttpRequest
    req.open 'POST', "#{ARIS_URL}/rawupload.php", true
    req.onload = =>
      if 200 <= req.status < 400
        cb
          returnCode: 0
          data: req.responseText
      else
        handleError req.status
    req.onerror = => handleError req.responseText
    req.upload.addEventListener 'progress', (evt) =>
      if evt.lengthComputable
        reportProgress(evt.loaded / evt.total)
    , false
    form = new FormData
    form.append 'raw_upload', file
    tries = 3
    handleError = (error) =>
      if tries is 0
        cb {error}
      else
        tries -= 1
        # TODO: check if req is open. if not, fail out (there is a setup error, not network error)
        req.send form
    req.send form
    req

  loadSavedAuth: (cb) ->
    if @authToken?
      cb @authToken
      return
    useJSON = (json) =>
      if json?
        cb JSON.parse json
      else
        cb null
    # @ifdef NATIVE
    AsyncStorage.getItem 'aris-auth', (err, result) => useJSON result
    # @endif
    # @ifdef WEB
    useJSON window.localStorage?['aris-auth']
    # @endif

  call: (func, json, cb) ->
    req = new XMLHttpRequest
    req.open 'POST', "#{ARIS_URL}/json.php/v2.#{func}", true
    req.setRequestHeader 'Content-Type',
      'application/json; charset=UTF-8'
    @loadSavedAuth (auth) =>
      if @password?
        auth =
          if auth?
            update auth, password: $set: @password
          else
            password: @password
      json =
        if auth?
          update json, auth: $set: auth
        else
          json
      jsonString = JSON.stringify json
      req.onload = =>
        if 200 <= req.status < 400
          cb JSON.parse req.responseText
        else
          handleError req.status
      req.onerror = => handleError "Could not connect to Siftr"
      tries = 3
      trySend = =>
        if req.readyState is req.OPENED
          req.send jsonString
        else
          cb
            error: "Could not connect to Siftr"
            errorMore: "Make sure you can connect to siftr.org and arisgames.org."
      handleError = (error) =>
        if tries is 0
          cb {error}
        else
          tries -= 1
          trySend()
      trySend()
    req

  useLoginResult: (obj, logoutOnFail, cb = (->)) ->
    {data: json, returnCode} = obj
    if returnCode is 0 and json.user_id isnt null
      auth = new Auth json
      if @password?
        auth = update auth, password: $set: @password
      # @ifdef NATIVE
      AsyncStorage.setItem 'aris-auth', JSON.stringify(auth.authToken), => cb auth
      # @endif
      # @ifdef WEB
      try
        window.localStorage['aris-auth'] = JSON.stringify auth.authToken
      catch err
        # Private mode in iOS Safari disables local storage.
        # just don't bother remembering the auth.
        null
      cb auth
      # @endif
    else if logoutOnFail
      @logout (auth) =>
        cb auth, obj

  login: (username, password, cb = (->)) ->
    @call 'users.logIn',
      user_name: username
      password: password
      permission: 'read_write'
    , (obj) => @useLoginResult obj, true, cb

  register: (username, password, email, cb = (->)) ->
    @call 'users.createUser',
      user_name: username
      password: password
      email: email
    , (obj) => @useLoginResult obj, true, cb

  changePassword: ({username, oldPassword, newPassword}, cb = (->)) ->
    @call 'users.changePassword',
      user_name: username
      old_password: oldPassword
      new_password: newPassword
    , (obj) => @useLoginResult obj, false, cb

  editProfile: ({display_name, url, bio, newPicture}, updateProgress = (->), cb = (->)) ->
    withMediaID = (media_id) =>
      @call 'users.updateUser',
        display_name: display_name
        url: url
        bio: bio
        media_id: media_id
      , (obj) => @useLoginResult obj, false, cb
    if newPicture?
      Photos.uploadImage newPicture, @, null, updateProgress, ({media}) =>
        withMediaID media.media_id
    else
      withMediaID undefined

  logout: (cb = (->)) ->
    # @ifdef NATIVE
    AsyncStorage.removeItem 'aris-auth', => cb(new Auth)
    # @endif
    # @ifdef WEB
    try
      window.localStorage.removeItem 'aris-auth'
    catch err
      null
    auth = new Auth
    if @password?
      auth = update auth, password: $set: @password
    cb auth
    # @endif

  # Perform an ARIS call, but then wrap a successful result with a class.
  callWrapped: (func, json, cb, wrap) ->
    @call func, json, (result) =>
      if result.returnCode is 0 and result.data?
        result.data = wrap result.data
      cb result

  promise: (method, args...) ->
    new Promise (resolve, reject) =>
      @[method].call @, args..., (result) =>
        if result.returnCode is 0 and result.data?
          resolve result.data
        else
          reject result

  getGame: (json, cb) ->
    @callWrapped 'games.getGame', json, cb, (data) -> new Game data

  searchSiftrs: (json, cb) ->
    @callWrapped 'games.searchSiftrs', json, cb, (data) -> new Game o for o in data

  siftrSearch: (json, cb) ->
    @callWrapped 'notes.siftrSearch', json, cb, (data) ->
      notes:
        new Note o for o in data.notes
      map_notes:
        new Note o for o in data.map_notes
      map_clusters:
        data.map_clusters

  getTagsForGame: (json, cb) ->
    @callWrapped 'tags.getTagsForGame', json, cb, (data) ->
      tags =
        new Tag o for o in data
      tags.sort sortByIndex 'tag_id'
      tags

  getUsersForGame: (json, cb) ->
    @callWrapped 'users.getUsersForGame', json, cb, (data) -> new User o for o in data

  getFieldsForGame: (json, cb) ->
    @callWrapped 'fields.getFieldsForGame', json, cb, (data) ->
      fields =
        new Field o for o in data.fields
      fields.sort sortByIndex 'field_id'
      options =
        new FieldOption o for o in data.options
      for field in fields
        field.options =
          opt for opt in options when field.field_id is opt.field_id
        field.options.sort sortByIndex 'field_option_id'
      fields

  getGamesForUser: (json, cb) ->
    @callWrapped 'games.getGamesForUser', json, cb, (data) -> new Game o for o in data

  searchNotes: (json, cb) ->
    @callWrapped 'notes.searchNotes', json, cb, (data) -> new Note o for o in data

  createGame: (game, cb) ->
    @callWrapped 'games.createGame', game.createJSON(), cb, (data) -> new Game data

  updateGame: (game, cb) ->
    @callWrapped 'games.updateGame', game.createJSON(), cb, (data) -> new Game data

  getColors: (json, cb) ->
    @callWrapped 'colors.getColors', json, cb, (data) -> new Colors data

  createTag: (tag, cb) ->
    @callWrapped 'tags.createTag', tag.createJSON(), cb, (data) -> new Tag data

  updateTag: (json, cb) ->
    @callWrapped 'tags.updateTag', json, cb, (data) -> new Tag data

  createNoteComment: (json, cb) ->
    @callWrapped 'note_comments.createNoteComment', json, cb, (data) -> new Comment data

  updateNoteComment: (json, cb) ->
    @callWrapped 'note_comments.updateNoteComment', json, cb, (data) -> new Comment data

  getNoteCommentsForNote: (json, cb) ->
    @callWrapped 'note_comments.getNoteCommentsForNote', json, cb, (data) -> new Comment o for o in data

  getFieldDataForNote: (json, cb) ->
    @callWrapped 'fields.getFieldDataForNote', json, cb, (data) -> new FieldData o for o in data

  getFollowedGamesForUser: (json, cb) ->
    @callWrapped 'games.getFollowedGamesForUser', json, cb, (data) -> new Game o for o in data

  getStaffPicks: (json, cb) ->
    @callWrapped 'games.getStaffPicks', json, cb, (data) -> new Game o for o in data

  getNearbyGamesForPlayer: (json, cb) ->
    @callWrapped 'client.getNearbyGamesForPlayer', json, cb, (data) -> new Game o for o in data

for k, v of {Game, deserializeGame, User, Tag, Comment, Note, Auth, Colors, Field, FieldData, FieldOption, arisHTTPS, deserializeNote, displayError}
  exports[k] = v
