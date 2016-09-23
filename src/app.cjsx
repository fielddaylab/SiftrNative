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

LoggedInContainer = React.createClass
  propTypes:
    name: T.string
    onLogout: T.func

  render: ->
    if window.isNative
      <View style={styles.container}>
        <Text>
          Logged in as {@props.name}
        </Text>
        <TouchableOpacity onPress={@props.onLogout}>
          <Text>Logout</Text>
        </TouchableOpacity>
        {@props.children}
      </View>
    else
      <div>
        <p>
          Logged in as {@props.name}
        </p>
        <p>
          <button type="button" onClick={clicker @props.onLogout}>Logout</button>
        </p>
        {@props.children}
      </div>

LoggedOutContainer = React.createClass
  propTypes:
    onLogin: T.func

  render: ->
    <DIV>
      <LoginBox onLogin={@props.onLogin} />
      {@props.children}
    </DIV>

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
      <ScrollView>
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

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  findSiftr: ->
    url = @refs.inputText.value
    return unless url?
    @props.auth.searchSiftrs
      siftr_url: url
    , withSuccess (games) =>
      if games.length is 1
        @props.onSelect games[0]

  handleEnter: (e) ->
    @findSiftr() if e.keyCode is 13

  render: ->
    <p>
      <input
        ref="inputText"
        type="text"
        onKeyDown={@handleEnter}
        placeholder="Enter a Siftr URL"
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
      if window.isNative
        @props.onLogin @username, @password
      else
        @props.onLogin @refs.username.value, @refs.password.value

  handleEnter: (e) ->
    @doLogin() if e.keyCode is 13

  render: ->
    if window.isNative
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
    else
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

Loading = React.createClass
  render: ->
    if window.isNative
      <View style={styles.container}>
        <Text style={styles.welcome}>Loading...</Text>
      </View>
    else
      <p>Loading...</p>

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
      if @state.auth.authToken?
        <LoggedInContainer onLogout={@logout} name={@state.auth.authToken.display_name}>
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
                <GameList games={@state.games} onSelect={(game) => @setState {game}} />
                <SiftrURL auth={@state.auth} onSelect={(game) => @setState {game}} />
              </DIV>
          }
        </LoggedInContainer>
      else
        <LoggedOutContainer onLogin={@login}>
          {
            if @state.game?
              <SiftrView
                game={@state.game}
                auth={@state.auth}
                onExit={=> @setState game: null}
                isAdmin={false}
              />
            else
              <SiftrURL auth={@state.auth} onSelect={(game) => @setState {game}} />
          }
        </LoggedOutContainer>
    else
      <Loading />

exports.SiftrNative = SiftrNative
