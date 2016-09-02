'use strict'

React = {Component} = require 'react'
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

{fitBounds} = require 'google-map-react/utils'

{ Auth
, Game
} = require './aris'

{SiftrMap} = require './map'

SiftrView = React.createClass
  propTypes:
    game: T.instanceOf Game
    auth: T.instanceOf Auth

  getInitialState: ->
    center:
      lat: @props.game.latitude
      lng: @props.game.longitude
    # @ifdef NATIVE
    delta: do =>
      delta =
        switch @props.game.zoom
          when 13 then 0.05
          else 0.05
      lat: delta
      lng: delta
    # @endif
    # @ifdef WEB
    zoom: @props.game.zoom
    # @endif
    results: null

  loadResults: ->
    @props.auth.siftrSearch
      game_id: @props.game.game_id
      min_latitude: @state.bounds.se.lat
      max_latitude: @state.bounds.nw.lat
      min_longitude: @state.bounds.nw.lng
      max_longitude: @state.bounds.se.lng
      limit: 50
      zoom:
        if window.isNative
          w = (@layout?.width ? 400) * 2
          h = (@layout?.height ? 400) * 2
          fitBounds(@state.bounds, {width: w, height: h}).zoom
        else
          @state.zoom
    , withSuccess (results) => @setState {results}

  moveMap: (obj) ->
    @setState obj, => @loadResults()

  render: ->
    map = =>
      <SiftrMap
        map_notes={@state.results?.map_notes}
        map_clusters={@state.results?.map_clusters}
        onMove={@moveMap}
        onLayout={(event) =>
          @layout = event.nativeEvent.layout
        }
        center={@state.center}
        zoom={@state.zoom}
        delta={@state.delta}
      />
    if window.isNative
      <View>
        <TouchableOpacity onPress={@props.onExit}>
          <Text>Back to Siftrs</Text>
        </TouchableOpacity>
        {map()}
      </View>
    else
      <div>
        <p>
          <a href="#" onClick={@props.onExit}>
            Back to Siftrs
          </a>
        </p>
        {map()}
      </div>

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
          <button type="button" onClick={@props.onLogout}>Logout</button>
        </p>
        {@props.children}
      </div>

GameList = React.createClass
  propTypes:
    games: T.arrayOf T.instanceOf Game

  gameClicked: (game) ->
    (@props.onSelect ? (->))(game)

  render: ->
    if window.isNative
      if @props.games?
        <ScrollView>
          {
            @props.games.map (game) =>
              <TouchableOpacity key={game.game_id} onPress={=> @gameClicked game}>
                <Text>
                  {game.name}
                </Text>
              </TouchableOpacity>
          }
        </ScrollView>
      else
        <Text>Loading games...</Text>
    else
      if @props.games?
        <ul>
          {
            @props.games.map (game) =>
              <li key={game.game_id}>
                <a href="#" onClick={=> @gameClicked game}>
                  {game.name}
                </a>
              </li>
          }
        </ul>
      else
        <p>Loading games...</p>

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
          <button type="button" onClick={@doLogin}>Login</button>
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

withSuccess = (cb) -> (obj) ->
  if obj.data? and obj.returnCode is 0
    cb obj.data
  else
    console.warn JSON.stringify obj

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

  render: ->
    if @state.auth?
      if @state.auth.authToken?
        <LoggedInContainer onLogout={@logout} name={@state.auth.authToken.display_name}>
          {
            if @state.game?
              <SiftrView game={@state.game} auth={@state.auth} onExit={=> @setState game: null} />
            else
              <GameList games={@state.games} onSelect={(game) => @setState {game}} />
          }
        </LoggedInContainer>
      else
        <LoginBox onLogin={@login} />
    else
      <Loading />

exports.SiftrNative = SiftrNative
