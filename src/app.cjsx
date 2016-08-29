'use strict'

React = {Component} = require 'react'
{ AppRegistry
, StyleSheet
, Text
, View
, TextInput
, TouchableOpacity
, ScrollView
} = require 'react-native'
{ Auth
} = require './aris'

LoggedInContainer = React.createClass
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
          <button type="button" onClick={@props.onLogout}>Logout</button>
        </p>
        {@props.children}
      </div>

GameList = React.createClass
  render: ->
    if window.isNative
      if @props.games?
        <ScrollView>
          {
            for game in @props.games
              continue unless game.is_siftr
              <Text key={game.game_id}>
                {game.name}
              </Text>
          }
        </ScrollView>
      else
        <Text>Loading games...</Text>
    else
      if @props.games?
        <ul>
          {
            for game in @props.games
              continue unless game.is_siftr
              <li key={game.game_id}>
                {game.name}
              </li>
          }
        </ul>
      else
        <p>Loading games...</p>

LoginBox = React.createClass
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
          <button type="button" onClick={@doLogin}>Login</button>
        </p>
      </form>

LogoutBox = React.createClass
  render: ->
    if window.isNative
      <View style={styles.container}>
        <Text style={styles.welcome}>
          You're logged in!
        </Text>
        <TouchableOpacity onPress={@props.onLogout}>
          <Text style={styles.instructions}>Logout</Text>
        </TouchableOpacity>
      </View>
    else
      <div>
        <p>
          You're logged in!
        </p>
        <p>
          <button type="button" onClick={@props.onLogout}>Logout</button>
        </p>
      </div>

Loading = React.createClass
  render: ->
    if window.isNative
      <View style={styles.container}>
        <Text style={styles.welcome}>Loading...</Text>
      </View>
    else
      <p>Loading...</p>

withSuccess = (cb) -> (obj) ->
  if obj.data? and obj.returnCode is 0
    cb obj.data
  else
    console.warn JSON.stringify obj

SiftrNative = React.createClass
  getInitialState: ->
    auth: null
    games: null

  componentWillMount: ->
    @login()

  updateGames: ->
    @state.auth.getGamesForUser {}, withSuccess (games) =>
      @setState {games}

  login: (username, password) ->
    (@state.auth ? new Auth).login username, password, (newAuth) =>
      @setState
        auth: newAuth
        games: null
      @updateGames() if newAuth.authToken?

  logout: ->
    (@state.auth ? new Auth).logout (newAuth) =>
      @setState auth: newAuth

  render: ->
    if @state.auth?
      if @state.auth.authToken?
        <LoggedInContainer onLogout={@logout} name={@state.auth.authToken.display_name}>
          <GameList games={@state.games} />
        </LoggedInContainer>
      else
        <LoginBox onLogin={@login} />
    else
      <Loading />

styles = StyleSheet?.create
  container:
    flex: 1
    justifyContent: 'center'
    alignItems: 'stretch'
    backgroundColor: '#F5FCFF'
    padding: 10
  welcome:
    fontSize: 20
    textAlign: 'center'
    margin: 10
  instructions:
    textAlign: 'center'
    color: '#333333'
    marginBottom: 5
  input:
    height: 50

exports.SiftrNative = SiftrNative
