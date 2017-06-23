'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
, TextInput
, TouchableOpacity
, ScrollView
, Platform
, StatusBar
, Image
, Linking
, NetInfo
} = require 'react-native'
{UploadQueue} = require './upload-queue'
{styles} = require './styles'
SideMenu = require 'react-native-side-menu'
Orientation = require 'react-native-orientation'
# @endif

{ Auth
, Game
, arisHTTPS
} = require './aris'

{SiftrView} = require './siftr-view'
{GameList, SiftrURL} = require './siftr-browser'

{clicker, withSuccess, DIV, P, BUTTON} = require './utils'

{parseUri} = require './parse-uri'

AuthContainer = React.createClass
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
    orientation: 'PORTRAIT'
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
    @props.auth.call 'media.getMedia',
      media_id: media_id
    , withSuccess (userPicture) =>
      @setState {userPicture}

  # @ifdef NATIVE
  componentDidMount: ->
    # TODO something's not linked right with orientation on android.
    # we don't need it anyway, but for now just don't set it up
    if Platform.OS is 'ios'
      Orientation.getSpecificOrientation (err, orientation) =>
        @setState {orientation}
      @orientationListener = (orientation) =>
        @setState {orientation}
      Orientation.addSpecificOrientationListener @orientationListener

  componentWillUnmount: ->
    if Platform.OS is 'ios'
      Orientation.removeSpecificOrientationListener @orientationListener

  render: ->
    <SideMenu
      isOpen={@props.menuOpen}
      onChange={@props.onMenuMove}
      edgeHitWidth={0}
      menu={
        <View style={backgroundColor: '#224', paddingTop: 30, flex: 1}>
          {
            if @props.auth.authToken?
              <View style={
                flexDirection: 'column'
                justifyContent: 'flex-start'
                alignItems: 'center'
              }>
                {
                  <Image
                    source={uri: arisHTTPS @state.userPicture?.big_thumb_url}
                    resizeMode="cover"
                    style={
                      height: 130
                      width: 130
                      backgroundColor: '#ccd'
                      margin: 10
                      borderRadius: 65
                    }
                  />
                }
                <Text style={textAlign: 'center', color: 'white', fontSize: 18}>
                  {@props.auth.authToken.display_name}
                </Text>
                <TouchableOpacity onPress={@props.onLogout}>
                  <Text style={[styles.blueButton, margin: 10]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            else
              <LoginBox onLogin={@props.onLogin} />
          }
          {
            if @props.hasBrowserButton
              <TouchableOpacity onPress={@goBackToBrowser} style={
                flexDirection: 'column'
                justifyContent: 'flex-start'
                alignItems: 'center'
              }>
                <Text style={[styles.blueButton, margin: 10]}>
                  Back to Browser
                </Text>
              </TouchableOpacity>
          }
        </View>
      }
    >
      <View style={flex: 1, flexDirection: 'column'}>
        <StatusBar
          backgroundColor="#224"
          barStyle="light-content"
        />
        <View style={
          backgroundColor: '#224'
          flexDirection: 'row'
          alignItems: 'center'
          justifyContent: 'flex-start'
          paddingTop:
            if Platform.OS is 'ios' and @state.orientation is 'PORTRAIT'
              15 # 20?
            else
              undefined
        }>
          <TouchableOpacity
            onPress={=> @props.onMenuMove not @props.menuOpen}
            style={
              marginLeft: 10
            }
          >
            <Image source={require '../web/assets/img/menu.png'} />
          </TouchableOpacity>
          <Text style={
            color: 'white'
            margin: 10
          }>
            {
              if @props.online
                if @props.auth.authToken?
                  "Logged in as #{@props.auth.authToken.display_name}"
                else
                  "Log in"
              else
                if @props.auth.authToken?
                  "Logged in as #{@props.auth.authToken.display_name} (offline)"
                else
                  "Offline"
            }
          </Text>
        </View>
        {@props.children}
      </View>
    </SideMenu>
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

LoginBox = React.createClass
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

Loading = React.createClass
  # @ifdef NATIVE
  render: ->
    <View>
      <Text>Loading...</Text>
    </View>
  # @endif
  # @ifdef WEB
  render: ->
    <p>Loading...</p>
  # @endif

SiftrNative = React.createClass
  getInitialState: ->
    auth: null
    games: null
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
      @parseURL(url) if url
      @urlHandler = ({url}) => @parseURL(url)
      Linking.addEventListener 'url', @urlHandler
    @withReach = (reach) =>
      online = reach not in ['none', 'NONE']
      @setState {online}
      if online
        @login()
      else if not @state.auth?
        @state.auth = new Auth
    NetInfo.fetch().done @withReach
    NetInfo.addEventListener 'change', @withReach

  componentWillUnmount: ->
    NetInfo.removeEventListener 'change', @withReach
    Linking.removeEventListener 'url', @urlHandler

  parseURL: (url) ->
    mapping = {}
    for kv in parseUri(url).query.split('&')
      [k, v] = kv.split('=')
      mapping[k] = v
    siftr_id = parseInt(mapping.siftr_id)
    nomen_id = parseInt(mapping.nomen_id)
    species_id = decodeURIComponent((mapping.species_id+'').replace(/\+/g, '%20'))
    if siftr_id
      @launchByID {siftr_id, nomen_id, species_id}

  launchByID: ({siftr_id, nomen_id, species_id}) ->
    return if @state.game?.game_id is siftr_id
    (@state.auth ? new Auth).getGame
      game_id: siftr_id
    , withSuccess (game) =>
      @setState
        game: game
        nomenData: {nomen_id, species_id}

  clearNomenData: ->
    @setState nomenData: null
  # @endif

  updateGames: ->
    @state.auth.getGamesForUser {}, withSuccess (games) =>
      @setState games:
        game for game in games when game.is_siftr

  login: (username, password) ->
    return unless @state.online
    (@state.auth ? new Auth).login username, password, (newAuth, err) =>
      if username? and password? and not newAuth.authToken?
        console.warn err
      @setState
        auth: newAuth
        games: null
      if newAuth.authToken?
        @updateGames()
        @setState menuOpen: false

  logout: ->
    (@state.auth ? new Auth).logout (newAuth) =>
      @setState
        auth: newAuth
        menuOpen: false

  gameBelongsToUser: (game) ->
    @state.games?.some (userGame) => userGame.game_id is game.game_id

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
        {
          # @ifdef NATIVE
          <UploadQueue />
          # @endif
          # @ifdef WEB
          null
          # @endif
        }
      </AuthContainer>
    else
      <Loading />

exports.SiftrNative = SiftrNative
