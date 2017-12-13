'use strict'

React = require 'react'
T = require 'prop-types'
createClass = require 'create-react-class'

# @ifdef NATIVE
{ View
, TextInput
, TouchableOpacity
, ScrollView
, Image
, ImageBackground
, Linking
, NetInfo
, ActivityIndicator
, StatusBar
, BackHandler
, Platform
, AppState
, Keyboard
, TouchableWithoutFeedback
, Alert
, Dimensions
} = require 'react-native'
{UploadQueue} = require './upload-queue'
{styles, Text} = require './styles'
{StatusSpace} = require './status-space'
{KeyboardAwareView} = require 'react-native-keyboard-aware-view'
{KeyboardAwareScrollView} = require 'react-native-keyboard-aware-scroll-view'
RNFS = require 'react-native-fs'
{CacheMedia} = require './media'
# @endif

{ Auth
, Game
, arisHTTPS
, deserializeGame
, deserializeNote
} = require './aris'

{SiftrView, SiftrInfo} = require './siftr-view'
Photos = require './photos'
# @ifdef WEB
{GameList, SiftrURL} = require './siftr-browser'
# @endif

{clicker, withSuccess, DIV, P, BUTTON} = require './utils'

{parseUri} = require './parse-uri'

AuthContainer = createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    onLogin: T.func
    onLogout: T.func
    hasBrowserButton: T.bool
    onBrowserButton: T.func
    menuOpen: T.bool
    onMenuMove: T.func
    online: T.bool

  getDefaultProps: ->
    onLogin: (->)
    onLogout: (->)
    hasBrowserButton: false
    onBrowserButton: (->)
    menuOpen: false
    onMenuMove: (->)

  getInitialState: ->
    hasBrowserButton: false
    onBrowserButton: (->)
    userPicture: null

  goBackToBrowser: ->
    @props.onMenuMove false
    @props.onBrowserButton()

  componentWillMount: ->
    @fetchPicture()

  componentWillReceiveProps: (nextProps) ->
    if @props.auth isnt nextProps.auth
      @fetchPicture nextProps.auth

  fetchPicture: (auth = @props.auth) ->
    media_id = auth.authToken?.media_id
    unless media_id?
      @setState userPicture: null
      return
    if @props.online
      @props.auth.call 'media.getMedia',
        media_id: media_id
      , withSuccess (userPicture) =>
        @setState {userPicture}

  # @ifdef NATIVE
  render: ->
    null # removed
  # @endif

  # @ifdef WEB
  render: ->
    <div className={"auth-container #{if @props.menuOpen then 'auth-menu-open' else 'auth-menu-closed'}"}>
      <div className="auth-nav">
        <a href="#"
          onClick={clicker => @props.onMenuMove not @props.menuOpen}
          className="auth-nav-button"
        ><img src="assets/img/menu.png" /></a>
        <span>
        {
          if @props.auth.authToken?
            " Logged in as #{@props.auth.authToken.display_name}"
          else
            " Log in"
        }
        </span>
      </div>
      <div className="auth-contents">
        {@props.children}
      </div>
      <div className="auth-menu">
        {
          if @props.auth.authToken?
            <div>
              <div className="auth-menu-user-picture" style={
                backgroundImage:
                  if (url = @state.userPicture?.big_thumb_url)
                    "url(#{arisHTTPS url})"
              } />
              <p>
                {@props.auth.authToken.display_name}
              </p>
              <p>
                <button type="button" onClick={@props.onLogout}>Logout</button>
              </p>
            </div>
          else
            <LoginBox onLogin={@props.onLogin} />
        }
        {
          if @props.hasBrowserButton
            <p>
              <button type="button" onClick={@goBackToBrowser}>Back to Browser</button>
            </p>
        }
      </div>
    </div>
  # @endif

LoginBox = createClass
  propTypes:
    onLogin: T.func

  doLogin: ->
    if @props.onLogin?
      # @ifdef NATIVE
      @props.onLogin @username, @password
      # @endif
      # @ifdef WEB
      @props.onLogin @refs.username.value, @refs.password.value
      # @endif

  handleEnter: (e) ->
    @doLogin() if e.keyCode is 13

  # @ifdef NATIVE
  render: ->
    <View>
      <TextInput
        placeholder="Username"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={true}
        onChangeText={(username) => @username = username}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(password) => @password = password}
      />
      <TouchableOpacity onPress={@doLogin}>
        <Text style={[styles.blueButton, margin: 10]}>Login</Text>
      </TouchableOpacity>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <form>
      <p>
        <input
          placeholder="Username"
          type="text"
          ref="username"
          onKeyDown={@handleEnter}
          className="login-field"
        />
      </p>
      <p>
        <input
          placeholder="Password"
          type="password"
          ref="password"
          onKeyDown={@handleEnter}
          className="login-field"
        />
      </p>
      <p>
        <button type="button" onClick={clicker @doLogin}>Login</button>
      </p>
    </form>
  # @endif

Loading = createClass
  # @ifdef NATIVE
  render: ->
    <View style={flex: 1, backgroundColor: 'rgb(233,240,240)'}>
      <StatusSpace />
      <View style={flex: 1, alignItems: 'center', justifyContent: 'center'}>
        <ActivityIndicator size="large" />
      </View>
    </View>
  # @endif
  # @ifdef WEB
  render: ->
    <p>Loading...</p>
  # @endif

# @ifdef NATIVE
NativeLogin = createClass
  getDefaultProps: ->
    onLogin: (->)
    onRegister: (->)

  getInitialState: ->
    page: 'sign-in'
    keyboard: false
    username: ''
    password: ''
    password2: ''
    email: ''

  doLogin: ->
    @props.onLogin @state.username, @state.password

  doRegister: ->
    if @state.password is ''
      Alert.alert "You must enter a password."
    else if @state.password isnt @state.password2
      Alert.alert "Passwords don't match."
    else
      @props.onRegister @state.username, @state.password, @state.email

  componentWillMount: ->
    @onKeyboardShow = =>
      @setState keyboard: true
    @onKeyboardHide = =>
      @setState keyboard: false
    verb = if Platform.OS is 'ios' then 'Will' else 'Did'
    Keyboard.addListener "keyboard#{verb}Show", @onKeyboardShow
    Keyboard.addListener "keyboard#{verb}Hide", @onKeyboardHide

  componentWillUnmount: ->
    verb = if Platform.OS is 'ios' then 'Will' else 'Did'
    Keyboard.removeListener "keyboard#{verb}Show", @onKeyboardShow
    Keyboard.removeListener "keyboard#{verb}Hide", @onKeyboardHide

  render: ->
    {height} = Dimensions.get 'window'
    tablet = height > 900
    <KeyboardAwareView animated={true} style={
      flex: 1
      flexDirection: 'column'
    }>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={
        if @state.page is 'sign-in'
          require('../web/assets/img/bg1.jpg')
        else
          require('../web/assets/img/bg2.jpg')
      } style={
        flex: if @state.keyboard and not tablet then 0 else 1
        flexDirection: 'column'
        backgroundColor: 'rgba(0,0,0,0)'
        alignItems: 'center'
        justifyContent: 'space-between'
        width: null
        height: null
      }>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={height: 40} />
        </TouchableWithoutFeedback>
        {
          unless @state.keyboard and not tablet
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={
                flexDirection: 'column'
                alignItems: 'center'
              }>
                <Image source={require('../web/assets/img/siftr-logo.png')} style={
                  width: 190 * 0.5
                  height: 196 * 0.5
                  marginBottom: 20
                } />
                <Text style={color: 'white'}>Exploring our world together</Text>
              </View>
            </TouchableWithoutFeedback>
        }
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={
            flexDirection: 'row'
            alignItems: 'flex-end'
            justifyContent: 'space-around'
            alignSelf: 'stretch'
          }>
            <TouchableOpacity style={
              padding: 16
              borderBottomWidth: 7
              borderBottomColor: if @state.page is 'sign-in' then 'white' else 'rgba(0,0,0,0)'
            } onPress={=> @setState
              page: 'sign-in'
              password: ''
              password2: ''
              email: ''
            }>
              <Text style={color: 'white'}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={
              padding: 16
              borderBottomWidth: 7
              borderBottomColor: if @state.page is 'sign-up' then 'white' else 'rgba(0,0,0,0)'
            } onPress={=> @setState
              page: 'sign-up'
              password: ''
              password2: ''
              email: ''
            }>
              <Text style={color: 'white'}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
      {
        switch @state.page
          when 'sign-in'
            <View style={
              flex: 1
              flexDirection: 'column'
            }>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={
                  flex: 1
                  justifyContent: 'center'
                  alignItems: 'stretch'
                }>
                  <TextInput
                    placeholder="Username"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={true}
                    onChangeText={(username) => @setState {username}}
                    value={@state.username}
                    onSubmitEditing={=> @passwordBox.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @passwordBox = box}
                    placeholder="Password"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(password) => @setState {password}}
                    value={@state.password}
                    onSubmitEditing={@doLogin}
                    returnKeyType="go"
                  />
                </View>
              </TouchableWithoutFeedback>
              <TouchableOpacity onPress={@doLogin} style={
                backgroundColor: 'rgb(255,124,107)'
                alignItems: 'center'
                justifyContent: 'center'
                paddingTop: 20
                paddingBottom: 20
              }>
                <Text style={color: 'white'}>Log in</Text>
              </TouchableOpacity>
            </View>
          when 'sign-up'
            <View style={
              flex: 1
              flexDirection: 'column'
            }>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={
                  flex: 1
                  justifyContent: 'center'
                  alignItems: 'stretch'
                }>
                  <TextInput
                    placeholder="Username"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={true}
                    onChangeText={(username) => @setState {username}}
                    value={@state.username}
                    onSubmitEditing={=> @passwordBox.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @passwordBox = box}
                    placeholder="Password"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(password) => @setState {password}}
                    value={@state.password}
                    onSubmitEditing={=> @password2Box.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @password2Box = box}
                    placeholder="Password (confirm)"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(password2) => @setState {password2}}
                    value={@state.password2}
                    onSubmitEditing={=> @emailBox.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @emailBox = box}
                    placeholder="Email (optional)"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(email) => @setState {email}}
                    value={@state.email}
                    onSubmitEditing={@doRegister}
                    returnKeyType="go"
                  />
                </View>
              </TouchableWithoutFeedback>
              <TouchableOpacity onPress={@doRegister} style={
                backgroundColor: 'rgb(255,124,107)'
                alignItems: 'center'
                justifyContent: 'center'
                paddingTop: 20
                paddingBottom: 20
              }>
                <Text style={color: 'white'}>Create account</Text>
              </TouchableOpacity>
            </View>
      }
    </KeyboardAwareView>

NativeCard = createClass
  getInitialState: ->
    contributors: null
    posts: null
    photos: null
    authors: null

  getDefaultProps: ->
    onSelect: (->)
    onInfo: (->)
    cardMode: 'full'

  componentWillMount: ->
    @isMounted = true
    @props.auth.getUsersForGame
      game_id: @props.game.game_id
    , withSuccess (authors) =>
      return unless @isMounted
      @setState
        authors:
          author.display_name for author in authors
    useNotes = (notes) =>
      return unless @isMounted
      @setState
        photos:
          for note in notes.slice(0, 8)
            continue unless note.thumb_url?
            url: note.thumb_url
            note_id: note.note_id
        posts: notes.length
        contributors: do =>
          user_ids = {}
          for note in notes
            user_ids[note.user.user_id] = true
            for comment in note.comments
              user_ids[comment.user.user_id] = true
          Object.keys(user_ids).length
    if @props.online
      @props.auth.searchNotes
        game_id: @props.game.game_id
        order_by: 'recent'
      , withSuccess useNotes
    else
      siftrDir = "#{RNFS.DocumentDirectoryPath}/siftrs/#{@props.game.game_id}"
      RNFS.readFile("#{siftrDir}/notes.txt").then (json) =>
        notes =
          deserializeNote(note) for note in JSON.parse json
        useNotes notes

  componentWillUnmount: ->
    @isMounted = false

  shouldComponentUpdate: (nextProps, nextState) ->
    @props.cardMode isnt nextProps.cardMode or
    @props.game isnt nextProps.game or
    @state.authors isnt nextState.authors or
    @state.photos isnt nextState.photos or
    @state.contributors isnt nextState.contributors or
    @state.posts isnt nextState.posts

  render: ->
    switch @props.cardMode
      when 'full'
        <TouchableOpacity onPress={(args...) => @props.onSelect(args...)} style={
          backgroundColor: 'white'
          margin: 12
          marginBottom: 0
          borderRadius: 12
        }>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View style={flex: 1}>
              <Text>{@props.game.name}</Text>
              <Text>{@state.authors?.join(', ') ? '…'}</Text>
            </View>
          </View>
          <View style={flexDirection: 'row', overflow: 'hidden'}>
            {
              if @state.photos?
                for {url, note_id} in @state.photos
                  <CacheMedia
                    key={note_id}
                    url={url}
                    withURL={(url) =>
                      <Image
                        source={if url? then uri: url else undefined}
                        style={height: 100, width: 100}
                      />
                    }
                  />
              else
                <View style={height: 100, width: 100} />
            }
          </View>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View>
              <Text>{@state.contributors ? '…'} contributors</Text>
              <Text>{@state.posts ? '…'} posts</Text>
            </View>
            <TouchableOpacity style={padding: 10} onPress={(args...) => @props.onInfo(args...)}>
              <Image source={require('../web/assets/img/icon-4dots.png')} style={width: 38 * 0.7, height: 40 * 0.7, resizeMode: 'contain'} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      when 'compact'
        <TouchableOpacity onPress={(args...) => @props.onSelect(args...)} style={
          backgroundColor: 'white'
          margin: 12
          marginBottom: 0
          borderRadius: 12
        }>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View style={flex: 1}>
              <Text>{@props.game.name}</Text>
              <Text>{@state.authors?.join(', ') ? '…'}</Text>
            </View>
            <TouchableOpacity style={padding: 10} onPress={(args...) => @props.onInfo(args...)}>
              <Image source={require('../web/assets/img/icon-4dots.png')} style={width: 38 * 0.7, height: 40 * 0.7, resizeMode: 'contain'} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

BrowserList = createClass
  getDefaultProps: ->
    onSelect: (->)
    onInfo: (->)
    cardMode: 'full'

  shouldComponentUpdate: (nextProps, nextState) ->
    @props.games isnt nextProps.games or
    @props.cardMode isnt nextProps.cardMode or
    @props.auth isnt nextProps.auth
    # onSelect and onInfo are function-wrapped

  render: ->
    if @props.games?
      <ScrollView style={flex: 1, backgroundColor: 'rgb(233,240,240)'}>
        {
          @props.games.map (game) =>
            <NativeCard
              key={game.game_id}
              cardMode={@props.cardMode}
              game={game}
              onSelect={=> @props.onSelect game}
              auth={@props.auth}
              onInfo={=> @props.onInfo game}
              online={@props.online}
            />
        }
      </ScrollView>
    else
      <View style={flex: 1, alignItems: 'center', justifyContent: 'center'}>
        <ActivityIndicator size="large" />
      </View>

makeBrowser = (getGames) ->
  createClass
    getDefaultProps: ->
      onSelect: (->)
      onInfo: (->)
      cardMode: 'full'

    getInitialState: ->
      games: null

    componentWillMount: ->
      @_isMounted = true
      @updateGames()

    componentWillUnmount: ->
      @_isMounted = false

    updateGames: (props = @props) ->
      thisSearch = @lastSearch = Date.now()
      getGames props, (games) =>
        return unless @_isMounted
        return unless thisSearch is @lastSearch
        @setState {games}

    shouldComponentUpdate: (nextProps, nextState) ->
      @props.auth isnt nextProps.auth or
      @state.games isnt nextState.games or
      @props.cardMode isnt nextProps.cardMode
      # onSelect and onInfo are function-wrapped

    componentWillReceiveProps: (newProps) ->
      if not @props.auth? or ['auth', 'search', 'mine', 'followed'].some((x) => @props[x] isnt newProps[x])
        @updateGames newProps

    render: ->
      <BrowserList
        auth={@props.auth}
        games={@state.games}
        onSelect={(args...) => @props.onSelect(args...)}
        onInfo={(args...) => @props.onInfo(args...)}
        cardMode={@props.cardMode}
        online={@props.online}
      />

BrowserSearch = makeBrowser (props, cb) ->
  if props.search is ''
    cb []
  else
    props.auth.searchSiftrs
      search: props.search
      count: 10
    , withSuccess (games) ->
      cb games

BrowserSearchPane = createClass
  getInitialState: ->
    search: ''

  shouldComponentUpdate: (nextProps, nextState) ->
    @props.auth isnt nextProps.auth or
    @state.search isnt nextState.search or
    @props.cardMode isnt nextProps.cardMode
    # onSelect and onInfo are function-wrapped

  render: ->
    <View style={flex: 1}>
      <TextInput
        style={
          height: 40
          borderWidth: 2
          borderColor: 'gray'
          padding: 10
        }
        placeholder="Search…"
        autoCapitalize="none"
        autoCorrect={true}
        autoFocus={false}
        onChangeText={(search) => @setState search: search}
      />
      <BrowserSearch
        auth={@props.auth}
        onSelect={(args...) => @props.onSelect(args...)}
        onInfo={(args...) => @props.onInfo(args...)}
        search={@state.search}
        cardMode={@props.cardMode}
      />
    </View>

BrowserMine = makeBrowser (props, cb) ->
  cb props.mine

BrowserFollowed = makeBrowser (props, cb) ->
  cb props.followed

BrowserDownloaded = makeBrowser (props, cb) ->
  siftrsDir = "#{RNFS.DocumentDirectoryPath}/siftrs"
  RNFS.exists(siftrsDir).then (dirExists) ->
    if dirExists
      RNFS.readDir(siftrsDir).then (files) ->
        proms = for f in files
          game_id = parseInt f.name
          continue unless game_id and f.isDirectory()
          RNFS.readFile "#{siftrsDir}/#{game_id}/game.txt"
        Promise.all(proms).then (games) ->
          cb( deserializeGame(JSON.parse game) for game in games )
    else
      cb []

BrowserFeatured = makeBrowser (props, cb) ->
  props.auth.getStaffPicks {}, withSuccess (games) ->
    cb(game for game in games when game.is_siftr)

BrowserPopular = makeBrowser (props, cb) ->
  props.auth.searchSiftrs
    count: 20 # TODO infinite scroll
    offset: 0
    order_by: 'popular'
  , withSuccess cb

BrowserNearMe = makeBrowser (props, cb) ->
  navigator.geolocation.getCurrentPosition (res) ->
    props.auth.getNearbyGamesForPlayer
      latitude: res.coords.latitude
      longitude: res.coords.longitude
      filter: 'siftr'
    , withSuccess cb

NativePassword = createClass
  getDefaultProps: ->
    onClose: (->)
    onChangePassword: (->)

  render: ->
    <View style={
      flexDirection: 'column'
      flex: 1
      backgroundColor: 'white'
    }>
      <StatusSpace />
      <View style={
        flexDirection: 'row'
        justifyContent: 'space-between'
        alignItems: 'center'
      }>
        <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={@props.onClose}>
          <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-back.png')} />
        </TouchableOpacity>
        <View style={flex: 4, alignItems: 'center'}>
          <Text>Change Password</Text>
        </View>
        <View style={flex: 1} />
      </View>
      <ScrollView style={flex: 1}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Current password</Text>
        </View>
        <TextInput
          placeholder="Current password"
          secureTextEntry={true}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @oldPassword = str}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>New password</Text>
        </View>
        <TextInput
          placeholder="New password"
          secureTextEntry={true}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @newPassword1 = str}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>New password, once more</Text>
        </View>
        <TextInput
          placeholder="New password, once more"
          secureTextEntry={true}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @newPassword2 = str}
        />
        <TouchableOpacity style={styles.settingsButton} onPress={=>
          if @newPassword1 is @newPassword2
            @props.onChangePassword
              username: @props.auth.authToken.username
              oldPassword: @oldPassword
              newPassword: @newPassword1
            , (changed) =>
              if changed
                @props.onClose()
              else
                console.warn 'could not change password'
        }>
          <Text>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>

NativeProfile = createClass
  getDefaultProps: ->
    onClose: (->)
    onEditProfile: (->)

  getInitialState: ->
    display_name: @props.auth.authToken.display_name
    url: @props.auth.url
    bio: @props.auth.bio
    currentPicture: null
    newPicture: null
    progress: null

  componentWillMount: ->
    @fetchPicture()

  fetchPicture: ->
    media_id = @props.auth.authToken.media_id
    if media_id?
      @props.auth.call 'media.getMedia',
        media_id: media_id
      , withSuccess (userMedia) =>
        @setState currentPicture:
          uri: userMedia.url.replace('http://', 'https://')
    else
      @setState currentPicture: null

  render: ->
    <View style={
      flexDirection: 'column'
      flex: 1
      backgroundColor: 'white'
    }>
      <StatusSpace />
      <View style={
        flexDirection: 'row'
        justifyContent: 'space-between'
        alignItems: 'center'
      }>
        <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={@props.onClose}>
          <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-back.png')} />
        </TouchableOpacity>
        <View style={flex: 4, alignItems: 'center'}>
          <Text>Edit Profile</Text>
        </View>
        <View style={flex: 1} />
      </View>
      <KeyboardAwareScrollView style={flex: 1} contentContainerStyle={alignItems: 'stretch'}>
        <View style={
          flexDirection: 'row'
          justifyContent: 'center'
          paddingTop: 15
        }>
          <TouchableOpacity onPress={=>
            return if @state.progress?
            Photos.requestImage (img) =>
              if img?
                @setState newPicture: img
          }>
            {
              if @state.newPicture?
                <Image
                  source={@state.newPicture}
                  style={styles.editProfilePic}
                />
              else if @state.currentPicture?
                <CacheMedia
                  url={@state.currentPicture.uri}
                  withURL={(pic) =>
                    <Image
                      source={if pic? then uri: pic else undefined}
                      style={styles.editProfilePic}
                    />
                  }
                />
              else
                <View
                  style={styles.editProfilePic}
                />
            }
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Username"
          style={styles.input}
          value={@props.auth.authToken.username}
          editable={false}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Display name</Text>
        </View>
        <TextInput
          placeholder="Display name"
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={(str) => @setState display_name: str}
          value={@state.display_name}
          editable={not @state.progress?}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Website</Text>
        </View>
        <TextInput
          placeholder="Website"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @setState url: str}
          value={@state.url}
          editable={not @state.progress?}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Bio</Text>
        </View>
        <TextInput
          placeholder="Bio"
          style={styles.input}
          autoCapitalize="sentences"
          autoCorrect={true}
          onChangeText={(str) => @setState bio: str}
          value={@state.bio}
          editable={not @state.progress?}
        />
        <TouchableOpacity style={styles.settingsButton} onPress={=>
          return if @state.progress?
          @props.onEditProfile
            display_name: @state.display_name
            url: @state.url
            bio: @state.bio
            newPicture: @state.newPicture
          , (progress) =>
            @setState {progress}
          , (changed) =>
            if changed
              @props.onClose()
            else
              console.warn 'could not save profile'
        }>
          <Text>
            {
              if @state.progress?
                "Uploading photo… #{Math.floor(@state.progress * 100)}%"
              else
                "Save"
            }
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>

NativeSettings = createClass
  getInitialState: ->
    setting: null

  getDefaultProps: ->
    onLogout: (->)
    onClose: (->)
    onChangePassword: (->)
    onEditProfile: (->)

  render: ->
    switch @state.setting
      when 'profile'
        <NativeProfile
          onClose={=> @setState setting: null}
          auth={@props.auth}
          onEditProfile={@props.onEditProfile}
        />
      when 'password'
        <NativePassword
          onClose={=> @setState setting: null}
          auth={@props.auth}
          onChangePassword={@props.onChangePassword}
        />
      else
        <View style={
          flexDirection: 'column'
          flex: 1
          backgroundColor: 'white'
        }>
          <StatusSpace />
          <View style={
            flexDirection: 'row'
            justifyContent: 'space-between'
            alignItems: 'center'
          }>
            <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={@props.onClose}>
              <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-back.png')} />
            </TouchableOpacity>
            <View style={flex: 4, alignItems: 'center'}>
              <Text>Settings</Text>
            </View>
            <View style={flex: 1} />
          </View>
          <ScrollView style={flex: 1}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsHeaderText}>Account</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={=> @setState setting: 'profile'}>
              <Text>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={=> @setState setting: 'password'}>
              <Text>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={@props.onLogout}>
              <Text>Logout</Text>
            </TouchableOpacity>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsHeaderText}>About</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={=>
              Linking.openURL "https://github.com/fielddaylab/SiftrNative"
            }>
              <Text>Open Source</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

NativeHome = createClass
  getInitialState: ->
    discoverPage: if @props.online then null else 'downloaded'
    viewingGameInfo: null
    cardMode: 'full'
    settings: false

  getDefaultProps: ->
    onLogout: (->)
    onSelect: (->)
    mine: null
    followed: null
    followGame: (->)
    unfollowGame: (->)
    onChangePassword: (->)
    onEditProfile: (->)

  componentWillMount: ->
    @choosePage @props

  componentWillReceiveProps: (nextProps) ->
    @choosePage nextProps

  choosePage: (props) ->
    if not @state.discoverPage?
      if props.followed? and props.followed.length
        @setState discoverPage: 'followed'
      else if props.followed? and props.mine? and props.mine.length
        @setState discoverPage: 'mine'
      else if props.followed? and props.mine?
        @setState discoverPage: 'featured'

  render: ->
    isHome     = @state.discoverPage in ['mine', 'followed', 'downloaded'         ] and not @state.settings
    isDiscover = @state.discoverPage in ['featured', 'popular', 'nearme', 'search'] and not @state.settings
    CurrentBrowser = switch @state.discoverPage
      when 'mine'       then BrowserMine
      when 'followed'   then BrowserFollowed
      when 'downloaded' then BrowserDownloaded
      when 'featured'   then BrowserFeatured
      when 'popular'    then BrowserPopular
      when 'nearme'     then BrowserNearMe
      when 'search'     then BrowserSearchPane

    <SiftrInfo
      game={@state.viewingGameInfo}
      isOpen={@state.viewingGameInfo?}
      onChange={(b) => if not b then @setState viewingGameInfo: null}
      followed={@props.followed}
      followGame={=> @props.followGame @state.viewingGameInfo}
      unfollowGame={=> @props.unfollowGame @state.viewingGameInfo}
    >
      {
        if @state.settings
          <NativeSettings
            onClose={=> @setState settings: false}
            onLogout={@props.onLogout}
            auth={@props.auth}
            onChangePassword={@props.onChangePassword}
            onEditProfile={@props.onEditProfile}
          />
        else if not @state.discoverPage?
          <Loading />
        else
          <View style={
            flexDirection: 'column'
            flex: 1
            backgroundColor: 'white'
          }>
            <StatusSpace />
            <View style={
              flexDirection: 'row'
              justifyContent: 'space-between'
              alignItems: 'center'
            }>
              <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={=> @setState discoverPage: 'search'}>
                <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-search.png')} />
              </TouchableOpacity>
              <View style={flex: 4, alignItems: 'center'}>
                <Text>
                  {
                    if isHome then 'Home' else 'Explore'
                  }
                </Text>
              </View>
              <TouchableOpacity style={flex: 1, alignItems: 'flex-end'} onPress={=>
                @setState cardMode:
                  if @state.cardMode is 'full'
                    'compact'
                  else
                    'full'
              }>
                <Image style={resizeMode: 'contain', height: 20} source={
                  if @state.cardMode is 'full'
                    require('../web/assets/img/icon-cards.png')
                  else
                    require('../web/assets/img/icon-compact.png')
                } />
              </TouchableOpacity>
            </View>
            {
              if isHome
                <View style={flexDirection: 'row'}>
                  <TouchableOpacity key={1} onPress={=> @setState discoverPage: 'mine'} style={
                    if @state.discoverPage is 'mine' then styles.exploreTabOn else styles.exploreTabOff
                  }>
                    <Text style={
                      color: if @state.discoverPage is 'mine' then 'black' else '#B8B8B8'
                    }>Mine</Text>
                  </TouchableOpacity>
                  <TouchableOpacity key={2} onPress={=> @setState discoverPage: 'followed'} style={
                    if @state.discoverPage is 'followed' then styles.exploreTabOn else styles.exploreTabOff
                  }>
                    <Text style={
                      color: if @state.discoverPage is 'followed' then 'black' else '#B8B8B8'
                    }>Followed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity key={3} onPress={=> @setState discoverPage: 'downloaded'} style={
                    if @state.discoverPage is 'downloaded' then styles.exploreTabOn else styles.exploreTabOff
                  }>
                    <Text style={
                      color: if @state.discoverPage is 'downloaded' then 'black' else '#B8B8B8'
                    }>Downloaded</Text>
                  </TouchableOpacity>
                </View>
              else if isDiscover
                <View style={flexDirection: 'row'}>
                  <TouchableOpacity onPress={=> @setState discoverPage: 'featured'} style={
                    if @state.discoverPage is 'featured' then styles.exploreTabOn else styles.exploreTabOff
                  }>
                    <Text style={
                      color: if @state.discoverPage is 'featured' then 'black' else '#B8B8B8'
                    }>Featured</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={=> @setState discoverPage: 'popular'} style={
                    if @state.discoverPage is 'popular' then styles.exploreTabOn else styles.exploreTabOff
                  }>
                    <Text style={
                      color: if @state.discoverPage is 'popular' then 'black' else '#B8B8B8'
                    }>Popular</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={=> @setState discoverPage: 'nearme'} style={
                    if @state.discoverPage is 'nearme' then styles.exploreTabOn else styles.exploreTabOff
                  }>
                    <Text style={
                      color: if @state.discoverPage is 'nearme' then 'black' else '#B8B8B8'
                    }>Near Me</Text>
                  </TouchableOpacity>
                </View>
            }
            {
              if @props.queueMessage?
                <View style={
                  backgroundColor: 'rgb(233,240,240)'
                  padding: 4
                  alignSelf: 'stretch'
                }>
                  <Text>
                    {@props.queueMessage}
                  </Text>
                </View>
            }
            <CurrentBrowser
              auth={@props.auth}
              onSelect={@props.onSelect}
              cardMode={@state.cardMode}
              onInfo={(game) => @setState viewingGameInfo: game}
              mine={@props.mine}
              followed={@props.followed}
              online={@props.online}
            />
            <View style={
              flexDirection: 'row'
              justifyContent: 'space-between'
              alignItems: 'center'
            }>
              <TouchableOpacity style={padding: 10} onPress={=>
                if not isHome then @setState discoverPage: 'mine', settings: false
              }>
                <Image style={resizeMode: 'contain', height: 30} source={
                  if isHome
                    require('../web/assets/img/icon-home-selected.png')
                  else
                    require('../web/assets/img/icon-home.png')
                } />
              </TouchableOpacity>
              <TouchableOpacity style={padding: 10} onPress={=>
                if not isDiscover then @setState discoverPage: 'featured', settings: false
              }>
                <Image style={resizeMode: 'contain', height: 24} source={
                  if isDiscover
                    require('../web/assets/img/icon-eye-selected.png')
                  else
                    require('../web/assets/img/icon-eye.png')
                } />
              </TouchableOpacity>
              <TouchableOpacity style={padding: 10} onPress={=> @setState settings: true}>
                <Image style={resizeMode: 'contain', height: 28} source={
                  if @state.settings
                    require('../web/assets/img/icon-user-selected.png')
                  else
                    require('../web/assets/img/icon-user.png')
                } />
              </TouchableOpacity>
            </View>
          </View>
      }
    </SiftrInfo>
# @endif

SiftrNative = createClass
  getInitialState: ->
    auth: null
    games: null
    followed: null
    game: null
    menuOpen: false
    online: true

  # @ifdef WEB
  componentWillMount: ->
    @login()
  # @endif

  # @ifdef NATIVE
  componentDidMount: ->
    Linking.getInitialURL().then (url) =>
      @parseURL url
      @urlHandler = ({url}) => @parseURL(url)
      Linking.addEventListener 'url', @urlHandler
    @withInfo = (connectionInfo) =>
      online = connectionInfo.type not in ['none', 'NONE']
      @setState {online}, =>
        if online
          @login()
        else if not @state.auth?
          new Auth().loadSavedAuth (authToken) =>
            @setState auth: Object.assign new Auth, {authToken}
    NetInfo.getConnectionInfo().then @withInfo
    NetInfo.addEventListener 'connectionChange', @withInfo
    @withAppState = (appState) =>
      if appState isnt 'active'
        @setState aris: false
    AppState.addEventListener 'change', @withAppState

  componentWillUnmount: ->
    NetInfo.removeEventListener 'connectionChange', @withInfo
    Linking.removeEventListener 'url', @urlHandler
    AppState.removeEventListener 'change', @withAppState

  parseURL: (url) ->
    unless url
      @setState
        aris: false
      return
    mapping = {}
    for kv in parseUri(url).query.split('&')
      [k, v] = kv.split('=')
      mapping[k] = v
    siftr_id = parseInt(mapping.siftr_id)
    if siftr_id
      @launchByID
        aris: if parseInt(mapping.aris) then true else false
        siftr_id: siftr_id
        nomen_id: parseInt(mapping.nomen_id)
        species_id: decodeURIComponent((mapping.species_id+'').replace(/\+/g, '%20'))

  launchByID: ({aris, siftr_id, nomen_id, species_id}) ->
    return if @state.game?.game_id is siftr_id
    (@state.auth ? new Auth).getGame
      game_id: siftr_id
    , withSuccess (game) =>
      @setState
        game: game
        aris: aris
        nomenData:
          if nomen_id
            {nomen_id, species_id}

  clearNomenData: ->
    @setState nomenData: null
  # @endif

  updateGames: ->
    @state.auth.getGamesForUser {}, withSuccess (games) =>
      @setState games:
        game for game in games when game.is_siftr

  updateFollowed: ->
    @state.auth.getFollowedGamesForUser {}, withSuccess (games) =>
      @setState followed:
        game for game in games when game.is_siftr

  followGame: (game) ->
    @state.auth.call 'games.followGame',
      game_id: game.game_id
    , withSuccess => @updateFollowed()

  unfollowGame: (game) ->
    @state.auth.call 'games.unfollowGame',
      game_id: game.game_id
    , withSuccess => @updateFollowed()

  login: (username, password) ->
    return unless @state.online
    (@state.auth ? new Auth).login username, password, (newAuth, err) =>
      if username? and password? and not newAuth.authToken?
        Alert.alert err.returnCodeDescription
      @setState
        auth: newAuth
        games: null
        followed: null
      if newAuth.authToken?
        if @state.online
          @updateGames()
          @updateFollowed()
        @setState menuOpen: false

  register: (username, password, email) ->
    return unless @state.online
    (@state.auth ? new Auth).register username, password, email, (newAuth, err) =>
      unless newAuth.authToken?
        Alert.alert err.returnCodeDescription
      @setState
        auth: newAuth
        games: null
        followed: null
      if newAuth.authToken?
        if @state.online
          @updateGames()
          @updateFollowed()
        @setState menuOpen: false

  logout: ->
    (@state.auth ? new Auth).logout (newAuth) =>
      @setState
        auth: newAuth
        menuOpen: false

  gameBelongsToUser: (game) ->
    @state.games?.some (userGame) => userGame.game_id is game.game_id

  changePassword: (args, cb) ->
    if @state.online
      (@state.auth ? new Auth).changePassword args, (newAuth, err) =>
        if newAuth.authToken
          @setState auth: newAuth
          cb true
        else
          cb false
    else
      cb false

  editProfile: (args, progress, cb) ->
    if @state.online
      (@state.auth ? new Auth).editProfile args, progress, (newAuth, err) =>
        if newAuth.authToken
          @setState auth: newAuth
          cb true
        else
          cb false
    else
      cb false

  # @ifdef NATIVE
  render: ->
    if @state.auth?
      <UploadQueue
        auth={@state.auth}
        online={@state.online}
        onMessage={(queueMessage) => @setState {queueMessage}}
      >
        {
          if @state.auth.authToken?
            if @state.game?
              <SiftrView
                game={@state.game}
                auth={@state.auth}
                isAdmin={@gameBelongsToUser @state.game}
                aris={@state.aris}
                onExit={=>
                  if @state.aris
                    if Platform.OS is 'android'
                      BackHandler.exitApp()
                    else
                      return # Linking.openURL "ARIS://"
                  @setState
                    game: null
                    aris: false
                }
                onPromptLogin={=> @setState menuOpen: true}
                nomenData={@state.nomenData}
                clearNomenData={@clearNomenData}
                online={@state.online}
                followed={@state.followed}
                followGame={@followGame}
                unfollowGame={@unfollowGame}
                queueMessage={@state.queueMessage}
              />
            else
              <NativeHome
                auth={@state.auth}
                onLogout={@logout}
                onSelect={(game) => @setState {game}}
                online={@state.online}
                mine={@state.games}
                followed={@state.followed}
                followGame={@followGame}
                unfollowGame={@unfollowGame}
                onChangePassword={@changePassword}
                onEditProfile={@editProfile}
                queueMessage={@state.queueMessage}
              />
          else
            <NativeLogin onLogin={@login} onRegister={@register} />
        }
      </UploadQueue>
    else
      <Loading />
  # @endif

  # @ifdef WEB
  render: ->
    if @state.auth?
      <AuthContainer
        auth={@state.auth} onLogin={@login} onLogout={@logout}
        hasBrowserButton={@state.game?}
        onBrowserButton={=> @setState game: null}
        onMenuMove={(b) => @setState menuOpen: b}
        menuOpen={@state.menuOpen}
        online={@state.online}
      >
        {
          if @state.game?
            <SiftrView
              game={@state.game}
              auth={@state.auth}
              isAdmin={@gameBelongsToUser @state.game}
              onExit={=> @setState game: null}
              onPromptLogin={=> @setState menuOpen: true}
              nomenData={@state.nomenData}
              clearNomenData={@clearNomenData}
              online={@state.online}
            />
        }
        {
          unless @state.game?
            <GameList games={
              if @state.auth.authToken?
                @state.games
              else
                []
            } onSelect={(game) => @setState {game}} online={@state.online} />
        }
        {
          unless @state.game?
            <SiftrURL auth={@state.auth} onSelect={(game) => @setState {game}} />
        }
      </AuthContainer>
    else
      <Loading />
  # @endif

exports.SiftrNative = SiftrNative
