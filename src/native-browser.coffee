'use strict'

import React from 'react'
import T from 'prop-types'
import createClass from 'create-react-class'
import {
  View
, TextInput
, TouchableOpacity
, ScrollView
, Image
, ActivityIndicator
} from 'react-native'
import {Text} from './styles'
import {CacheMedia} from './media'
import RNFS from 'react-native-fs'
import {deserializeGame} from './aris'
import {withSuccess} from './utils'

mapMaybe = (xs, f) =>
  xs.map(f).filter((x) => x?)

NativeCard = createClass
  getInitialState: ->
    contributors: null
    posts: null
    photos: null
    authors: null

  getDefaultProps: ->
    onSelect: (->)
    onInfo: (->)
    cardMode: 'full'

  componentWillMount: ->
    @isMounted = true
    @props.auth.getUsersForGame
      game_id: @props.game.game_id
    , withSuccess (authors) =>
      return unless @isMounted
      @setState authors: authors.map((author) => author.display_name)
    useNotes = (notes) =>
      return unless @isMounted
      @setState
        photos:
          mapMaybe notes.slice(0, 8), (note) =>
            if note.thumb_url?
              url: note.thumb_url
              note_id: note.note_id
            else
              null
        posts: notes.length
        contributors: do =>
          user_ids = {}
          for note in notes
            user_ids[note.user.user_id] = true
            for comment in note.comments
              user_ids[comment.user.user_id] = true
          Object.keys(user_ids).length
    if @props.online
      @props.auth.searchNotes
        game_id: @props.game.game_id
        order_by: 'recent'
      , withSuccess useNotes
    else
      siftrDir = "#{RNFS.DocumentDirectoryPath}/siftrs/#{@props.game.game_id}"
      RNFS.readFile("#{siftrDir}/notes.txt").then (json) =>
        notes = JSON.parse(json).map((note) => deserializeNote(note))
        useNotes notes

  componentWillUnmount: ->
    @isMounted = false

  shouldComponentUpdate: (nextProps, nextState) ->
    @props.cardMode isnt nextProps.cardMode or
    @props.game isnt nextProps.game or
    @state.authors isnt nextState.authors or
    @state.photos isnt nextState.photos or
    @state.contributors isnt nextState.contributors or
    @state.posts isnt nextState.posts

  render: ->
    switch @props.cardMode
      when 'full'
        <TouchableOpacity onPress={(args...) => @props.onSelect(args...)} style={
          backgroundColor: 'white'
          margin: 12
          marginBottom: 0
          borderRadius: 12
        }>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View style={flex: 1}>
              <Text>{@props.game.name}</Text>
              <Text>{@state.authors?.join(', ') ? '…'}</Text>
            </View>
          </View>
          <View style={flexDirection: 'row', overflow: 'hidden'}>
            {
              if @state.photos?
                @state.photos.map ({url, note_id}) =>
                  <CacheMedia
                    key={note_id}
                    url={url}
                    withURL={(url) =>
                      <Image
                        source={if url? then uri: url else undefined}
                        style={height: 100, width: 100}
                      />
                    }
                  />
              else
                <View style={height: 100, width: 100} />
            }
          </View>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View>
              <Text>{@state.contributors ? '…'} contributors</Text>
              <Text>{@state.posts ? '…'} posts</Text>
            </View>
            <TouchableOpacity style={padding: 10} onPress={(args...) => @props.onInfo(args...)}>
              <Image source={require('../web/assets/img/icon-4dots.png')} style={width: 38 * 0.7, height: 40 * 0.7, resizeMode: 'contain'} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      when 'compact'
        <TouchableOpacity onPress={(args...) => @props.onSelect(args...)} style={
          backgroundColor: 'white'
          margin: 12
          marginBottom: 0
          borderRadius: 12
        }>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View style={flex: 1}>
              <Text>{@props.game.name}</Text>
              <Text>{@state.authors?.join(', ') ? '…'}</Text>
            </View>
            <TouchableOpacity style={padding: 10} onPress={(args...) => @props.onInfo(args...)}>
              <Image source={require('../web/assets/img/icon-4dots.png')} style={width: 38 * 0.7, height: 40 * 0.7, resizeMode: 'contain'} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

BrowserList = createClass
  getDefaultProps: ->
    onSelect: (->)
    onInfo: (->)
    cardMode: 'full'

  shouldComponentUpdate: (nextProps, nextState) ->
    # onSelect and onInfo are function-wrapped
    @props.games isnt nextProps.games or
    @props.cardMode isnt nextProps.cardMode or
    @props.auth isnt nextProps.auth

  render: ->
    if @props.games?
      <ScrollView style={flex: 1, backgroundColor: 'rgb(233,240,240)'}>
        {
          @props.games.map (game) =>
            <NativeCard
              key={game.game_id}
              cardMode={@props.cardMode}
              game={game}
              onSelect={=> @props.onSelect game}
              auth={@props.auth}
              onInfo={=> @props.onInfo game}
              online={@props.online}
            />
        }
      </ScrollView>
    else
      <View style={flex: 1, alignItems: 'center', justifyContent: 'center'}>
        <ActivityIndicator size="large" />
      </View>

makeBrowser = (getGames) ->
  createClass
    getDefaultProps: ->
      onSelect: (->)
      onInfo: (->)
      cardMode: 'full'

    getInitialState: ->
      games: null

    componentWillMount: ->
      @_isMounted = true
      @updateGames()

    componentWillUnmount: ->
      @_isMounted = false

    updateGames: (props = @props) ->
      thisSearch = @lastSearch = Date.now()
      getGames props, (games) =>
        return unless @_isMounted
        return unless thisSearch is @lastSearch
        @setState {games}

    shouldComponentUpdate: (nextProps, nextState) ->
      # onSelect and onInfo are function-wrapped
      @props.auth isnt nextProps.auth or
      @state.games isnt nextState.games or
      @props.cardMode isnt nextProps.cardMode

    componentWillReceiveProps: (newProps) ->
      if not @props.auth? or ['auth', 'search', 'mine', 'followed'].some((x) => @props[x] isnt newProps[x])
        @updateGames newProps

    render: ->
      <BrowserList
        auth={@props.auth}
        games={@state.games}
        onSelect={(args...) => @props.onSelect(args...)}
        onInfo={(args...) => @props.onInfo(args...)}
        cardMode={@props.cardMode}
        online={@props.online}
      />

BrowserSearch = makeBrowser (props, cb) ->
  if props.search is ''
    cb []
  else
    props.auth.searchSiftrs
      search: props.search
      count: 10
    , withSuccess (games) ->
      props.auth.searchSiftrs
        siftr_url: props.search
      , withSuccess (url_games) ->
        if url_games.length > 0
          games = games.filter (game) =>
            game.game_id isnt url_games[0].game_id
        cb url_games.concat(games)

export BrowserSearchPane = createClass
  getInitialState: ->
    search: ''

  shouldComponentUpdate: (nextProps, nextState) ->
    # onSelect and onInfo are function-wrapped
    @props.auth isnt nextProps.auth or
    @state.search isnt nextState.search or
    @props.cardMode isnt nextProps.cardMode

  render: ->
    <View style={flex: 1}>
      <TextInput
        style={
          height: 40
          borderWidth: 2
          borderColor: 'gray'
          padding: 10
        }
        placeholder="Search…"
        autoCapitalize="none"
        autoCorrect={true}
        autoFocus={false}
        onChangeText={(search) => @setState search: search}
      />
      <BrowserSearch
        auth={@props.auth}
        onSelect={(args...) => @props.onSelect(args...)}
        onInfo={(args...) => @props.onInfo(args...)}
        search={@state.search}
        cardMode={@props.cardMode}
        online={@props.online}
      />
    </View>

export BrowserMine = makeBrowser (props, cb) ->
  cb props.mine

export BrowserFollowed = makeBrowser (props, cb) ->
  cb props.followed

export BrowserDownloaded = makeBrowser (props, cb) ->
  siftrsDir = "#{RNFS.DocumentDirectoryPath}/siftrs"
  RNFS.exists(siftrsDir).then (dirExists) ->
    if dirExists
      RNFS.readDir(siftrsDir).then (files) ->
        proms = mapMaybe files, (f) =>
          game_id = parseInt f.name
          if game_id and f.isDirectory()
            RNFS.readFile "#{siftrsDir}/#{game_id}/game.txt"
          else
            null
        Promise.all(proms).then (games) ->
          cb(games.map((game) => deserializeGame(JSON.parse(game))))
    else
      cb []

export BrowserFeatured = makeBrowser (props, cb) ->
  props.auth.getStaffPicks {}, withSuccess (games) ->
    cb(games.filter((game) => game.is_siftr))

export BrowserPopular = makeBrowser (props, cb) ->
  props.auth.searchSiftrs
    count: 20 # TODO infinite scroll
    offset: 0
    order_by: 'popular'
  , withSuccess cb

export BrowserNearMe = makeBrowser (props, cb) ->
  navigator.geolocation.getCurrentPosition (res) ->
    props.auth.getNearbyGamesForPlayer
      latitude: res.coords.latitude
      longitude: res.coords.longitude
      filter: 'siftr'
    , withSuccess cb
