React = {Component} = require 'react'
{ AppRegistry
, StyleSheet
, Text
, View
, TextInput
, TouchableOpacity
} = require 'react-native'
{ Auth
} = require './aris'

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
          ref="username"
          placeholder="Username"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={true}
          onChangeText={(username) => @username = username}
        />
        <TextInput
          ref="password"
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
          <input type="text" ref="username" onKeyDown={@handleEnter} />
        </p>
        <p>
          <input type="password" ref="password" onKeyDown={@handleEnter} />
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
          <Text>Logout</Text>
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

SiftrNative = React.createClass
  getInitialState: ->
    auth: new Auth

  componentWillMount: ->
    @login()

  login: (username, password) ->
    @state.auth.login username, password, (newAuth) =>
      @setState auth: newAuth

  logout: ->
    @setState auth: @state.auth.logout()

  render: ->
    if @state.auth.authToken?
      <LogoutBox onLogout={@logout} />
    else
      <LoginBox onLogin={@login} />

styles = StyleSheet?.create
  container:
    flex: 1
    justifyContent: 'center'
    alignItems: 'stretch'
    backgroundColor: '#F5FCFF'
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
