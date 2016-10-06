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
} = require 'react-native'
{styles} = require './styles'
SideMenu = require 'react-native-side-menu'
Orientation = require 'react-native-orientation'
# @endif

{ Auth
, Game
} = require './aris'

{SiftrView} = require './siftr-view'

{clicker, withSuccess, DIV, P, BUTTON} = require './utils'

AuthContainer = React.createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    onLogin: T.func
    onLogout: T.func
    hasBrowserButton: T.bool
    onBrowserButton: T.func
    menuOpen: T.bool
    onMenuMove: T.func

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

  goBackToBrowser: ->
    @props.onMenuMove false
    @props.onBrowserButton()

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
        <View>
          {
            if @props.auth.authToken?
              <View>
                <Text>
                  Logged in as {@props.auth.authToken.display_name}
                </Text>
                <TouchableOpacity onPress={@props.onLogout}>
                  <Text>Logout</Text>
                </TouchableOpacity>
              </View>
            else
              <LoginBox onLogin={@props.onLogin} />
          }
          {
            if @props.hasBrowserButton
              <BUTTON onClick={@goBackToBrowser}><P>Back to Browser</P></BUTTON>
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
              if @props.auth.authToken?
                "Logged in as #{@props.auth.authToken.display_name}"
              else
                "Log in"
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
              <p>
                Logged in as {@props.auth.authToken.display_name}
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

GameList = React.createClass
  propTypes:
    games: T.arrayOf T.instanceOf Game
    onSelect: T.func

  getDefaultProps: ->
    games: null
    onSelect: (->)

  # @ifdef NATIVE
  render: ->
    if @props.games?
      <ScrollView style={
        backgroundColor: 'white'
        flex: 1
      }>
        {
          @props.games.map (game) =>
            <TouchableOpacity key={game.game_id} onPress={=> @props.onSelect game}>
              <Text>
                {game.name}
              </Text>
            </TouchableOpacity>
        }
      </ScrollView>
    else
      <Text style={styles.whiteBG}>Loading games...</Text>
  # @endif

  # @ifdef WEB
  render: ->
    if @props.games?
      <ul>
        {
          @props.games.map (game) =>
            <li key={game.game_id}>
              <a href="#" onClick={clicker => @props.onSelect game}>
                {game.name}
              </a>
            </li>
        }
      </ul>
    else
      <p>Loading games...</p>
  # @endif

SiftrURL = React.createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    onSelect: T.func

  getDefaultProps: ->
    onSelect: (->)

  getInitialState: ->
    url: ''

  findSiftr: ->
    @props.auth.searchSiftrs
      siftr_url: @state.url
    , withSuccess (games) =>
      if games.length is 1
        @props.onSelect games[0]

  # @ifdef NATIVE
  render: ->
    <View>
      <TextInput
        placeholder="Enter a Siftr URL"
        value={@state.url}
        onChangeText={(url) => @setState {url}}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
      <BUTTON onClick={@findSiftr}><P>Submit</P></BUTTON>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <p>
      <input
        type="text"
        onKeyDown={(e) => @findSiftr() if e.keyCode is 13}
        placeholder="Enter a Siftr URL"
        value={@state.url}
        onChange={(e) => @setState url: e.target.value}
      />
      {' '}
      <BUTTON onClick={@findSiftr}>Submit</BUTTON>
    </p>
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
        <Text>Login</Text>
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
        />
      </p>
      <p>
        <input
          placeholder="Password"
          type="password"
          ref="password"
          onKeyDown={@handleEnter}
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

  componentWillMount: ->
    @login()

  updateGames: ->
    @state.auth.getGamesForUser {}, withSuccess (games) =>
      @setState games:
        game for game in games when game.is_siftr

  login: (username, password) ->
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
      >
        {
          if @state.game?
            <SiftrView
              game={@state.game}
              auth={@state.auth}
              isAdmin={@gameBelongsToUser @state.game}
              onExit={=> @setState game: null}
              onPromptLogin={=> @setState menuOpen: true}
            />
          else
            [
              if @state.auth.authToken?
                <GameList key={1} games={@state.games} onSelect={(game) => @setState {game}} />
              <SiftrURL key={2} auth={@state.auth} onSelect={(game) => @setState {game}} />
            ]
        }
      </AuthContainer>
    else
      <Loading />

exports.SiftrNative = SiftrNative
