'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
, TextInput
, TouchableOpacity
, ScrollView
} = require 'react-native'
{styles} = require './styles'
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

  getInitialState: ->
    menuOpen: false

  # @ifdef NATIVE
  render: ->
    <ScrollView style={styles.container}>
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
      {@props.children}
    </ScrollView>
  # @endif

  # @ifdef WEB
  render: ->
    <div className={"auth-container #{if @state.menuOpen then 'auth-menu-open' else 'auth-menu-closed'}"}>
      <div className="auth-nav">
        <a href="#"
          onClick={clicker => @setState menuOpen: not @state.menuOpen}
          className="auth-nav-button"
        >☰</a>
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
                <button type="button" onClick={clicker @props.onLogout}>Logout</button>
              </p>
            </div>
          else
            <LoginBox onLogin={@props.onLogin} />
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
      <View>
        {
          @props.games.map (game) =>
            <TouchableOpacity key={game.game_id} onPress={=> @props.onSelect game}>
              <Text>
                {game.name}
              </Text>
            </TouchableOpacity>
        }
      </View>
    else
      <Text>Loading games...</Text>
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
    <View style={styles.container}>
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
        <Text style={styles.instructions}>Login</Text>
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
    <View style={styles.container}>
      <Text style={styles.welcome}>Loading...</Text>
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
      @updateGames() if newAuth.authToken?

  logout: ->
    (@state.auth ? new Auth).logout (newAuth) =>
      @setState auth: newAuth

  gameBelongsToUser: (game) ->
    @state.games?.some (userGame) => userGame.game_id is game.game_id

  render: ->
    if @state.auth?
      <AuthContainer auth={@state.auth} onLogin={@login} onLogout={@logout}>
        {
          if @state.game?
            <SiftrView
              game={@state.game}
              auth={@state.auth}
              onExit={=> @setState game: null}
              isAdmin={@gameBelongsToUser @state.game}
            />
          else
            <DIV>
              {
                if @state.auth.authToken?
                  <GameList games={@state.games} onSelect={(game) => @setState {game}} />
              }
              <SiftrURL auth={@state.auth} onSelect={(game) => @setState {game}} />
            </DIV>
        }
      </AuthContainer>
    else
      <Loading />

exports.SiftrNative = SiftrNative
