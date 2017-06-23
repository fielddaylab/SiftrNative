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
RNFS = require 'react-native-fs'
{styles} = require './styles'
# @endif

{ Auth
, Game
, deserializeGame
} = require './aris'

{clicker, withSuccess, P, BUTTON} = require './utils'

GameList = React.createClass
  propTypes:
    games: T.arrayOf T.instanceOf Game
    onSelect: T.func
    online: T.bool

  getDefaultProps: ->
    games: null
    onSelect: (->)
    online: true

  getInitialState: ->
    downloadedGames: null

  # @ifdef NATIVE
  componentWillMount: ->
    siftrsDir = "#{RNFS.DocumentDirectoryPath}/siftrs"
    RNFS.exists(siftrsDir).then (dirExists) =>
      if dirExists
        RNFS.readDir(siftrsDir).then (files) =>
          proms = for f in files
            game_id = parseInt f.name
            continue unless game_id and f.isDirectory()
            RNFS.readFile "#{siftrsDir}/#{game_id}/game.txt"
          Promise.all(proms).then (games) =>
            @setState downloadedGames:
              deserializeGame(JSON.parse game) for game in games
      else
        @setState downloadedGames: []

  render: ->
    if @props.games?
      <ScrollView style={
        backgroundColor: 'white'
        flex: 1
      } contentContainerStyle={
        alignItems: 'stretch'
      }>
        <Text>My Siftrs</Text>
        {
          if @props.games?
            @props.games.map (game) =>
              <TouchableOpacity key={game.game_id} onPress={=> @props.onSelect game}>
                <View style={styles.openSiftrButton}>
                  <Text style={margin: 5}>
                    {game.name}
                  </Text>
                </View>
              </TouchableOpacity>
          else
            <Text>Loading...</Text>
        }
        <Text>Downloaded Siftrs</Text>
        {
          if @state.downloadedGames?
            @state.downloadedGames.map (game) =>
              <TouchableOpacity key={game.game_id} onPress={=>
                @props.onSelect game
              }>
                <View style={styles.openSiftrButton}>
                  <Text style={margin: 5}>
                    {game.name}
                  </Text>
                </View>
              </TouchableOpacity>
          else
            <Text>Loading...</Text>
        }
      </ScrollView>
    else
      <Text style={[styles.whiteBG, flex: 1]}>Loading games...</Text>
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
    <View style={
      backgroundColor: 'white'
    }>
      <TextInput
        placeholder="Enter a Siftr URL"
        value={@state.url}
        onChangeText={(url) => @setState {url}}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
      <TouchableOpacity onPress={@findSiftr}>
        <Text style={[styles.blueButton, margin: 10]}>Submit</Text>
      </TouchableOpacity>
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

exports.GameList = GameList
exports.SiftrURL = SiftrURL
