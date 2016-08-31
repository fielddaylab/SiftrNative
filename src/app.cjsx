'use strict'

React = {Component} = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ AppRegistry
, Text
, View
, TextInput
, TouchableOpacity
, ScrollView
} = require 'react-native'
MapView = require 'react-native-maps'
{styles} = require './styles'
# @endif

# @ifdef WEB
{default: GoogleMap} = require 'google-map-react'
# @endif

{fitBounds} = require 'google-map-react/utils'

{ Auth
, Game
} = require './aris'

MapThing = React.createClass
  render: ->
    <div className="mapThing">
      {@props.key2}
    </div>

SiftrView = React.createClass
  propTypes:
    game: T.instanceOf Game
    auth: T.instanceOf Auth

  getInitialState: ->
    center:
      lat: @props.game.latitude
      lng: @props.game.longitude
    delta:
      if window.isNative
        do =>
          delta =
            switch @props.game.zoom
              when 13 then 0.05
              else 0.05
          lat: delta
          lng: delta
      else
        null
    zoom: if window.isNative then null else @props.game.zoom
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
          # TODO do this better
          fitBounds(@state.bounds, {width: 750, height: 750}).zoom
        else
          @state.zoom
    , ({data: results, returnCode}) =>
      if results? and returnCode is 0
        @setState {results}

  moveMapNative: ({latitude, longitude, latitudeDelta, longitudeDelta}) ->
    @setState
      center:
        lat: latitude
        lng: longitude
      delta:
        lat: latitudeDelta
        lng: longitudeDelta
      bounds:
        nw:
          lat: latitude + latitudeDelta
          lng: longitude - longitudeDelta
        se:
          lat: latitude - latitudeDelta
          lng: longitude + longitudeDelta
    , => @loadResults()

  moveMapWeb: ({center: {lat, lng}, zoom, bounds: {nw, se}}) ->
    @setState
      center: {lat, lng}
      zoom: zoom
      bounds: {nw, se}
    , => @loadResults()

  render: ->
    if window.isNative
      <MapView
        style={styles.theMap}
        region={
          latitude: @state.center.lat
          longitude: @state.center.lng
          latitudeDelta: @state.delta.lat
          longitudeDelta: @state.delta.lng
        }
        onRegionChange={@moveMapNative}
      >
      {
        @state.results?.map_notes?.map (map_note) =>
          <MapView.Marker
            key={map_note.note_id}
            coordinate={
              latitude: map_note.latitude
              longitude: map_note.longitude
            }
            title="Note"
            description={map_note.description}
          />
      }
      {
        @state.results?.map_clusters?.map (map_cluster, i) =>
          <MapView.Marker
            key={i}
            coordinate={
              latitude: (map_cluster.min_latitude + map_cluster.max_latitude) / 2
              longitude: (map_cluster.min_longitude + map_cluster.max_longitude) / 2
            }
            title="Cluster"
            description="Tap to see the notes inside."
          />
      }
      </MapView>
    else
      <div className="theMap">
        <GoogleMap
          center={@state.center}
          zoom={@state.zoom}
          bootstrapURLKeys={
            key: 'AIzaSyDlMWLh8Ho805A5LxA_8FgPOmnHI0AL9vw'
          }
          onChange={@moveMapWeb}
        >
        {
          @state.results?.map_notes?.map (map_note) =>
            <MapThing
              key={map_note.note_id}
              key2={map_note.note_id}
              lat={map_note.latitude}
              lng={map_note.longitude}
            />
        }
        {
          @state.results?.map_clusters?.map (map_cluster, i) =>
            <MapThing
              key={i}
              key2={i}
              lat={(map_cluster.min_latitude + map_cluster.max_latitude) / 2}
              lng={(map_cluster.min_longitude + map_cluster.max_longitude) / 2}
            />
        }
        </GoogleMap>
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

  render: ->
    if window.isNative
      if @props.games?
        <ScrollView>
          {
            for game in @props.games
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
              <li key={game.game_id}>
                {game.name}
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
          <GameList games={@state.games} />
          {
            if (@state.games?.length ? 0) > 0
              <SiftrView game={@state.games[0]} auth={@state.auth} />
          }
        </LoggedInContainer>
      else
        <LoginBox onLogin={@login} />
    else
      <Loading />

exports.SiftrNative = SiftrNative
