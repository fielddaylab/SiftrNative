'use strict'

React = require 'react'
T = require 'prop-types'
createClass = require 'create-react-class'
update = require 'immutability-helper'

# @ifdef NATIVE
{ View
, TextInput
, TouchableOpacity
, ScrollView
, Linking
, NetInfo
, BackHandler
, Platform
, AppState
} = require 'react-native'
import {UploadQueue} from './upload-queue'
import {styles, Text} from './styles'
import {StatusSpace} from './status-space'
import {CacheMedia} from './media'
import {Terms} from './native-terms'
import RNFS from 'react-native-fs'
import firebase from 'react-native-firebase'
import {NativeLogin} from './native-login'
import {NativeHome, Loading} from './native-home'
# @endif

{ Auth
, Game
, arisHTTPS
, deserializeGame
, deserializeNote
, displayError
} = require './aris'

{SiftrView, SiftrInfo} = require './siftr-view'
Photos = require './photos'
# @ifdef WEB
{WebNav} = require './web-nav'
# @endif

{clicker, withSuccess} = require './utils'

{parseUri} = require './parse-uri'

export SiftrNative = createClass
  displayName: 'SiftrNative'
  getInitialState: ->
    auth: null
    games: null
    followed: null
    game: null
    menuOpen: false
    online: true

  getDefaultProps: ->
    viola: false

  # @ifdef WEB
  componentWillMount: ->
    @login()
  # @endif

  # @ifdef NATIVE
  componentDidMount: ->
    Linking.getInitialURL().then (url) =>
      @parseURL url
      @urlHandler = ({url}) => @parseURL(url)
      Linking.addEventListener 'url', @urlHandler
    @withInfo = (connectionInfo) =>
      online = connectionInfo.type not in ['none', 'NONE']
      @setState {online}, =>
        if online
          @login()
        else if not @state.auth?
          new Auth().loadSavedAuth (authToken) =>
            @setState auth: Object.assign new Auth, {authToken}
    NetInfo.getConnectionInfo().then @withInfo
    NetInfo.addEventListener 'connectionChange', @withInfo
    @withAppState = (appState) =>
      if appState isnt 'active'
        @setState aris: false
    AppState.addEventListener 'change', @withAppState
    if @props.viola
      @hardwareBack = =>
        @props.backToViola()
        true
      BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    NetInfo.removeEventListener 'connectionChange', @withInfo
    Linking.removeEventListener 'url', @urlHandler
    AppState.removeEventListener 'change', @withAppState
    if @hardwareBack?
      BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  parseURL: (url) ->
    unless url
      @setState
        aris: false
      return
    mapping = {}
    parsed = parseUri(url)
    if parsed.protocol is 'siftr'

      for kv in parsed.query.split('&')
        [k, v] = kv.split('=')
        mapping[k] = v
      siftr_id = parseInt(mapping.siftr_id)
      if siftr_id
        @launchByID
          aris: if parseInt(mapping.aris) then true else false
          siftr_id: siftr_id
          nomen_id: parseInt(mapping.nomen_id)
          species_id: decodeURIComponent((mapping.species_id+'').replace(/\+/g, '%20'))

    else if parsed.host is 'siftr.org'

      siftr_id = 0
      siftr_url = parsed.query
      if siftr_url.length is 0 or siftr_url.match(/aris=1/)
        siftr_url = parsed.path.replace(/\//g, '')
      unless siftr_url.match(/[^0-9]/)
        siftr_id = parseInt siftr_url
        siftr_url = null

      auth = (@state.auth ? new Auth)
      if siftr_url?
        auth.searchSiftrs
          siftr_url: siftr_url
        , withSuccess (games) =>
          if games.length is 1
            @setState game: games[0]
      else if siftr_id
        auth.getGame
          game_id: siftr_id
        , withSuccess (game) =>
          if game?
            @setState game: games[0]

  launchByID: ({aris, siftr_id, nomen_id, species_id, saved_note}) ->
    return if @state.game?.game_id is siftr_id
    (@state.auth ? new Auth).getGame
      game_id: siftr_id
    , withSuccess (game) =>
      @setState
        game: game
        aris: aris
        saved_note: saved_note
        nomenData:
          if nomen_id
            {nomen_id, species_id}

  clearNomenData: ->
    @setState
      nomenData: null
      saved_note: null
  # @endif

  updateGames: ->
    @state.auth.getGamesForUser {}, withSuccess (games) =>
      @setState games:
        game for game in games when game.is_siftr

  updateFollowed: ->
    @state.auth.getFollowedGamesForUser {}, withSuccess (games) =>
      @setState followed:
        game for game in games when game.is_siftr

  followGame: (game) ->
    @state.auth.call 'games.followGame',
      game_id: game.game_id
    , withSuccess => @updateFollowed()

  unfollowGame: (game) ->
    @state.auth.call 'games.unfollowGame',
      game_id: game.game_id
    , withSuccess => @updateFollowed()

  # @ifdef WEB
  tryLoadGame: (auth, game, password = auth.password ? game.password) ->
    auth.searchNotes
      game_id: game.game_id
      note_count: 1
      password: password
    , (result) =>
      if result.returnCode is 0
        @setState
          auth: update auth, password: $set: password
        , => @loadGamePosition game
      else
        newPassword = prompt(
          if password?
            'Incorrect password.'
          else
            'This Siftr requires a password to access.'
        )
        if newPassword?
          @tryLoadGame auth, game, newPassword
  # @endif

  loadGamePosition: (game) ->
    if game.type is 'ANYWHERE' and @state.online
      @state.auth.call 'notes.siftrBounds',
        game_id: game.game_id
      , withSuccess (bounds) =>
        if bounds.max_latitude? and bounds.min_longitude? and bounds.min_latitude? and bounds.max_longitude?
          bounds.max_latitude  = parseFloat(bounds.max_latitude)
          bounds.min_longitude = parseFloat(bounds.min_longitude)
          bounds.min_latitude  = parseFloat(bounds.min_latitude)
          bounds.max_longitude = parseFloat(bounds.max_longitude)
          @setState {game, bounds}
        else
          @setState {game, bounds: null}
    else
      @setState {game, bounds: null}

  login: (username, password) ->
    unless @state.online
      displayError
        error: "Couldn't connect to Siftr."
      return
    (@state.auth ? new Auth).login username, password, (newAuth, err) =>
      if username? and password? and not newAuth.authToken?
        displayError(err)
      @setState
        auth: newAuth
        games: null
        followed: null
      # @ifdef WEB
      siftr_id = 0
      siftr_url = window.location.search.replace('?', '')
      if siftr_url.length is 0 or siftr_url.match(/aris=1/)
        siftr_url = window.location.pathname.replace(/\//g, '')
      unless siftr_url.match(/[^0-9]/)
        siftr_id = parseInt siftr_url
        siftr_url = null

      if siftr_url?
        newAuth.searchSiftrs
          siftr_url: siftr_url
        , withSuccess (games) =>
          if games.length is 1
            @tryLoadGame newAuth, games[0]
      else if siftr_id
        newAuth.getGame
          game_id: siftr_id
        , withSuccess (game) =>
          if game?
            @tryLoadGame newAuth, game
      # @endif
      if newAuth.authToken?
        # @ifdef NATIVE
        firebase.analytics().logEvent 'login',
          username: newAuth.authToken.username
          user_id: newAuth.authToken.user_id
        # @endif
        if @state.online
          @updateGames()
          @updateFollowed()
          if @props.viola
            {nomen_id, species_id, saved_note} = @props.getViolaInfo();
            @launchByID
              siftr_id: @props.siftr_id
              nomen_id: nomen_id
              species_id: species_id
              saved_note: saved_note
        @setState menuOpen: false

  showTerms: (username, password, email) ->
    @registerInfo = {username, password, email}
    @setState showingTerms: true

  registerNow: (username, password, email) ->
    @registerInfo = {username, password, email}
    @register()

  register: ->
    unless @state.online
      displayError
        error: "Couldn't connect to Siftr."
        errorMore: "You need to be connected to the internet to create an account."
      return
    {username, password, email} = @registerInfo
    (@state.auth ? new Auth).register username, password, email, (newAuth, err) =>
      unless newAuth.authToken?
        displayError(err)
      @setState
        showingTerms: false
        auth: newAuth
        games: null
        followed: null
      if newAuth.authToken?
        if @state.online
          @updateGames()
          @updateFollowed()
        @setState menuOpen: false

  logout: ->
    (@state.auth ? new Auth).logout (newAuth) =>
      @setState
        auth: newAuth
        menuOpen: false

  gameBelongsToUser: (game) ->
    @state.games?.some (userGame) => userGame.game_id is game.game_id

  changePassword: (args, cb) ->
    if @state.online
      (@state.auth ? new Auth).changePassword args, (newAuth, err) =>
        if newAuth.authToken
          @setState auth: newAuth
          cb true
        else
          cb false
    else
      cb false

  editProfile: (args, progress, cb) ->
    if @state.online
      (@state.auth ? new Auth).editProfile args, progress, (newAuth, err) =>
        if newAuth.authToken
          @setState auth: newAuth
          cb true
        else
          cb false
    else
      cb false

  # @ifdef NATIVE
  render: ->
    if @state.auth?
      <UploadQueue
        auth={@state.auth}
        online={@state.online}
        onMessage={(queueMessage) => @setState {queueMessage}}
        withPendingNotes={(pendingNotes) => @setState {pendingNotes}}
        onUpload={=> @siftrView?.loadResults()}
      >
        {
          if @state.auth.authToken?
            if @state.game?
              <SiftrView
                game={@state.game}
                bounds={@state.bounds}
                auth={@state.auth}
                isAdmin={@gameBelongsToUser @state.game}
                aris={@state.aris}
                onExit={=>
                  if @state.aris
                    if Platform.OS is 'android'
                      BackHandler.exitApp()
                    else
                      return # Linking.openURL "ARIS://"
                  else if @props.viola
                    @props.backToViola()
                  else
                    @setState
                      game: null
                      aris: false
                }
                onPromptLogin={=> @setState menuOpen: true}
                nomenData={@state.nomenData}
                clearNomenData={@clearNomenData}
                online={@state.online}
                followed={@state.followed}
                followGame={@followGame}
                unfollowGame={@unfollowGame}
                queueMessage={@state.queueMessage}
                viola={@props.viola}
                onViolaIdentify={@props.onViolaIdentify}
                onLogout={@logout}
                onChangePassword={@changePassword}
                onEditProfile={@editProfile}
                saved_note={@state.saved_note}
                pendingNotes={@state.pendingNotes}
                ref={(ref) => @siftrView = ref}
              />
            else
              <NativeHome
                auth={@state.auth}
                onLogout={@logout}
                onSelect={(game) => @loadGamePosition(game)}
                online={@state.online}
                mine={@state.games}
                followed={@state.followed}
                followGame={@followGame}
                unfollowGame={@unfollowGame}
                onChangePassword={@changePassword}
                onEditProfile={@editProfile}
                queueMessage={@state.queueMessage}
                setScreen={(o) => @setState o}
                discoverPage={@state.discoverPage}
                settings={@state.settings}
              />
          else if @state.showingTerms
            <Terms
              onAccept={=> @register()}
              onCancel={=> @setState showingTerms: false}
            />
          else
            <NativeLogin
              onLogin={@login}
              onRegister={@showTerms}
              viola={@props.viola}
              backToViola={@props.backToViola}
            />
        }
      </UploadQueue>
    else
      <Loading />
  # @endif

  # @ifdef WEB
  render: ->
    if @state.auth?
      <WebNav
        auth={@state.auth}
        onLogin={@login}
        onRegister={@registerNow}
        onLogout={@logout}
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
              onExit={=> @setState game: null, password: null}
              onPromptLogin={=> @setState menuOpen: true}
              nomenData={@state.nomenData}
              clearNomenData={@clearNomenData}
              online={@state.online}
              followed={@state.followed}
              followGame={@followGame}
              unfollowGame={@unfollowGame}
              bounds={@state.bounds}
            />
        }
      </WebNav>
    else
      <p>Loading...</p>
  # @endif
