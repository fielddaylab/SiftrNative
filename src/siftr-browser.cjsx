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

{clicker, withSuccess, P, BUTTON} = require './utils'

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
      } contentContainerStyle={
        alignItems: 'stretch'
      }>
        {
          @props.games.map (game) =>
            <TouchableOpacity key={game.game_id} onPress={=> @props.onSelect game}>
              <View style={
                borderColor: 'black'
                borderWidth: 1
                alignItems: 'flex-start'
                flexDirection: 'column'
                padding: 5
                backgroundColor: '#eee'
              }>
                <Text style={margin: 5}>
                  {game.name}
                </Text>
              </View>
            </TouchableOpacity>
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
