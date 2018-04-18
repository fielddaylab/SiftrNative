'use strict'

React = require 'react'
T = require 'prop-types'
update = require 'immutability-helper'
createClass = require 'create-react-class'

# @ifdef NATIVE
{ View
, TextInput
, TouchableOpacity
, Image
, BackHandler
, Modal
, ScrollView
, TouchableWithoutFeedback
, Keyboard
, Platform
} = require 'react-native'
RNFS = require 'react-native-fs'
import {styles, Text} from './styles'
import {StatusSpace} from './status-space'
{KeyboardAwareView} = require 'react-native-keyboard-aware-view'
{default: SideMenu} = require 'react-native-side-menu'
{default: Markdown} = require 'react-native-simple-markdown'
import firebase from 'react-native-firebase'
# @endif

{fitBounds} = require 'google-map-react/utils'

{ Auth
, Game
, Tag
, Note
, FieldData
, Colors
, Field
, deserializeNote
} = require './aris'

{timeToARIS} = require './time-slider'

{SearchNotes} = require './search-notes'
{SiftrMap, makeClusters} = require './map'
{SiftrThumbnails} = require './thumbnails'
{SiftrNoteView} = require './note-view'
{CreateStep1, CreateStep2, CreateStep3, CreateStep4, CreateStep5, CreateData, Blackout} = require './create-note'

{clicker, withSuccess} = require './utils'

fixLongitude = (longitude) ->
  longitude %%= 360
  longitude -= 360 if longitude > 180
  longitude

# @ifdef NATIVE
export SiftrInfo = createClass
  displayName: 'SiftrInfo'
  propTypes: ->
    game: T.instanceOf Game
    tags: T.arrayOf T.instanceOf Tag
    notes: T.arrayOf T.instanceOf Note
    isOpen: T.bool
    onChange: T.func
    getColor: T.func
    followed: T.arrayOf T.instanceOf Game
    followGame: T.func
    unfollowGame: T.func

  getDefaultProps: ->
    onChange: (->)
    isOpen: false
    notes: null
    followed: []
    followGame: (->)
    unfollowGame: (->)

  render: ->
    isFollowing =
      if @props.game?
        @props.followed?.some (game) => game.game_id is @props.game.game_id
      else
        false

    <SideMenu
      menu={
        <View style={
          flex: 1
        }>
          <View style={
            backgroundColor: 'rgb(249,249,249)'
          }>
            <StatusSpace leaveBar={true} backgroundColor="rgba(0,0,0,0)" />
            <Text style={margin: 10, textAlign: 'center'}>
              {@props.game?.name}
            </Text>
            <View style={alignItems: 'center'}>
              <TouchableOpacity onPress={
                if isFollowing then @props.unfollowGame else @props.followGame
              } style={
                paddingHorizontal: 14
                paddingVertical: 4
                borderColor: 'black'
                borderRadius: 20
                borderWidth: 2
                marginBottom: 10
              }>
                <Text>
                  {if not isFollowing? then '...' else if isFollowing then 'Followed' else 'Follow this Siftr'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={flex: 1} contentContainerStyle={
            backgroundColor: 'white'
          }>
            <Text style={margin: 10, fontWeight: 'bold'}>
              Instructions:
            </Text>
            <View style={margin: 10}>
              <Markdown>
                {@props.game?.description}
              </Markdown>
            </View>
            {
              if @props.tags?.length
                <Text style={margin: 10, fontWeight: 'bold'}>
                  Tags:
                </Text>
            }
            {
              for tag in @props.tags ? []
                <View key={tag.tag_id} style={
                  justifyContent: 'space-between'
                  flexDirection: 'row'
                  alignItems: 'center'
                }>
                  <Text style={margin: 10, color: 'rgb(182,182,182)'}>
                    {tag.tag}
                  </Text>
                  <View style={margin: 10, backgroundColor: @props.getColor(tag), padding: 3, borderRadius: 999}>
                    <Text style={color: 'white'}>
                      {
                        if @props.notes?
                          matches =
                            for note in @props.notes
                              continue unless note.tag_id is tag.tag_id
                              note
                          matches.length
                        else
                          '…'
                      }
                    </Text>
                  </View>
                </View>
            }
            {
              if false
                <Text style={margin: 10, fontWeight: 'bold'}>
                  Integrations:
                </Text>
            }
          </ScrollView>
        </View>
      }
      menuPosition="right"
      isOpen={@props.isOpen}
      onChange={@props.onChange}
      disableGestures={not @props.isOpen}
    >
      {@props.children}
    </SideMenu>
# @endif

export SiftrView = createClass
  displayName: 'SiftrView'
  propTypes:
    game: T.instanceOf(Game).isRequired
    auth: T.instanceOf(Auth).isRequired
    isAdmin: T.bool
    onExit: T.func
    onPromptLogin: T.func
    following: T.arrayOf T.instanceOf Game
    followGame: T.func
    unfollowGame: T.func
    # nomenData
    clearNomenData: T.func
    online: T.bool
    # @ifdef NATIVE
    aris: T.bool
    # @endif

  getDefaultProps: ->
    isAdmin: false
    onExit: (->)
    onPromptLogin: (->)
    nomenData: null
    clearNomenData: (->)
    following: null
    followGame: (->)
    unfollowGame: (->)
    onViolaIdentify: (->)

  getInitialState: ->
    fitted = null
    # @ifdef WEB
    if @props.bounds?
      w = window.innerWidth or document.documentElement.clientWidth or document.body.clientWidth
      h = window.innerHeight or document.documentElement.clientHeight or document.body.clientHeight
      h -= 150
      corners =
        nw:
          lat: parseFloat @props.bounds.max_latitude
          lng: parseFloat @props.bounds.min_longitude
        se:
          lat: parseFloat @props.bounds.min_latitude
          lng: parseFloat @props.bounds.max_longitude
      fitted = fitBounds(corners, {width: w, height: h})
    # @endif

    center:
      lat: fitted?.center?.lat ? @props.game.latitude
      lng: fitted?.center?.lng ? @props.game.longitude
    # @ifdef NATIVE
    delta: do =>
      # more research needed, this is a hack
      delta = 26 / (2 ** (@props.game.zoom - 4))
      delta = Math.min(90, delta)
      lat: delta
      lng: delta
    # @endif
    # @ifdef WEB
    zoom: fitted?.zoom ? @props.game.zoom
    # @endif
    map_notes: []
    map_clusters: []
    notes: []
    allNotes: null
    loadedAll: true
    tags: null
    colors: null
    viewingNote: null
    createNote: null
    searchParams:
      sort: 'recent'
    searchOpen: false
    mainView: 'hybrid' # 'hybrid', 'map', 'thumbs'
    fields: null
    infoOpen: false
    primaryMenuOpen: false

  componentWillMount: ->
    @isMounted = true
    # @ifdef NATIVE
    firebase.analytics().logEvent 'view_siftr',
      game_id: @props.game.game_id
    siftrDir = "#{RNFS.DocumentDirectoryPath}/siftrs/#{@props.game.game_id}"
    RNFS.mkdir siftrDir, NSURLIsExcludedFromBackupKey: true
    RNFS.writeFile "#{siftrDir}/game.txt", JSON.stringify @props.game
    if @props.online
      @props.auth.getTagsForGame
        game_id: @props.game.game_id
      , withSuccess (tags) =>
        return unless @isMounted
        @setState {tags}
        RNFS.writeFile "#{siftrDir}/tags.txt", JSON.stringify tags
      @props.auth.getColors
        colors_id: @props.game.colors_id ? 1
      , withSuccess (colors) =>
        return unless @isMounted
        @setState {colors}
        RNFS.writeFile "#{siftrDir}/colors.txt", JSON.stringify colors
      @props.auth.getFieldsForGame
        game_id: @props.game.game_id
      , withSuccess (fields) =>
        return unless @isMounted
        @setState {fields}
        RNFS.writeFile "#{siftrDir}/fields.txt", JSON.stringify fields
      @props.auth.searchNotes
        game_id: @props.game.game_id
        order_by: 'recent'
      , withSuccess (notes) =>
        return unless @isMounted
        @setState allNotes: notes
        RNFS.writeFile "#{siftrDir}/notes.txt", JSON.stringify notes
    else
      RNFS.readFile("#{siftrDir}/tags.txt").then (tags) =>
        return unless @isMounted
        @setState tags:
          for tag in JSON.parse tags
            Object.assign(new Tag, tag)
      RNFS.readFile("#{siftrDir}/colors.txt").then (colors) =>
        return unless @isMounted
        @setState colors: Object.assign(new Colors, JSON.parse colors)
      RNFS.readFile("#{siftrDir}/fields.txt").then (fields) =>
        return unless @isMounted
        @setState fields:
          for field in JSON.parse fields
            Object.assign(new Field, field)
      RNFS.readFile("#{siftrDir}/notes.txt").then (notes) =>
        return unless @isMounted
        @setState({
          allNotes:
            deserializeNote(note) for note in JSON.parse notes
        }, => @loadResults())
    @hardwareBack = =>
      if @state.searchOpen
        if @isMounted then @setState searchOpen: false
      else
        @props.onExit()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack
    @keyboardShow = =>
      @setState keyboardUp: true
    @keyboardHide = =>
      @setState keyboardUp: false
    Keyboard.addListener 'keyboardWillShow', @keyboardShow
    Keyboard.addListener 'keyboardWillHide', @keyboardHide
    # @endif
    # @ifdef WEB
    @props.auth.getTagsForGame
      game_id: @props.game.game_id
    , withSuccess (tags) => if @isMounted then @setState {tags}
    @props.auth.getColors
      colors_id: @props.game.colors_id ? 1
    , withSuccess (colors) => if @isMounted then @setState {colors}
    @props.auth.getFieldsForGame
      game_id: @props.game.game_id
    , withSuccess (fields) => if @isMounted then @setState {fields}
    @handleHistory = (event) =>
      if typeof event.state is 'number'
        @loadNoteByID(event.state, true)
      else
        @setState viewingNote: null
    window.addEventListener 'popstate', @handleHistory
    hash = window.location.hash
    if hash[0] is '#'
      n = parseInt hash[1..]
      if n
        @loadNoteByID(n, true)
    @props.auth.searchNotes
      game_id: @props.game.game_id
      order_by: 'recent'
    , withSuccess (notes) =>
      return unless @isMounted
      @setState allNotes: notes
    # @endif
    if @props.nomenData?
      @applyNomenData
        nomenData: @props.nomenData
        saved_note: @props.saved_note

  componentDidMount: ->
    @nomenTimer = setInterval =>
      @checkNomenFieldData()
    , 1000

  componentWillUnmount: ->
    @isMounted = false
    clearInterval @nomenTimer
    # @ifdef NATIVE
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack
    Keyboard.removeListener 'keyboardWillShow', @keyboardShow
    Keyboard.removeListener 'keyboardWillHide', @keyboardHide
    # @endif
    # @ifdef WEB
    window.removeEventListener 'popstate', @handleHistory
    # @endif

  componentWillReceiveProps: (nextProps) ->
    newAuth = null
    newGame = null
    if @props.auth.authToken?.user_id isnt nextProps.auth.authToken?.user_id
      # if we log in or out, reload the note search
      newAuth = nextProps.auth
      if @state.viewingNote? and @props.auth.authToken?
        # if we were logged in, close the open note
        if @isMounted
          @setState viewingNote: null
          history.pushState(null, '', '#')
      if not nextProps.auth.authToken?
        # cancel note creation on logout
        if @isMounted then @setState createNote: null
    if not @props.nomenData? and nextProps.nomenData?
      @applyNomenData
        nomenData: nextProps.nomenData
        saved_note: nextProps.saved_note
    if @props.game.game_id isnt nextProps.game.game_id
      newGame = nextProps.game
      # TODO: should also reset map position, tags, basically everything
      @setState
        map_notes: []
        map_clusters: []
        notes: []
    if newAuth? or newGame?
      @loadResults({auth: newAuth ? undefined, game: newGame ? undefined})

  applyNomenData: ({nomenData, saved_note}) ->
    if @state.createNote?
      # continue note filling in data
      if @isMounted then @setState {nomenData}
    else
      @startCreate {nomenData, saved_note}
    @props.clearNomenData()

  checkNomenFieldData: ->
    # check if there is nomenData to make into field_data
    if @state.nomenData?
      if @state.createNote?
        if @state.createNote.field_data?
          matchingFields =
            field for field in @state.fields when field.field_type is 'NOMEN' and parseInt(field.label) is @state.nomenData.nomen_id
          return if matchingFields.length is 0
          field = matchingFields[0]
          field_data = @state.createNote.field_data.filter (fieldData) => fieldData.field_id isnt field.field_id
          field_data.push new FieldData {
            field_id: field.field_id
            field_data: @state.nomenData.species_id
          }
          if @isMounted then @setState
            nomenData: null
            createNote: update @state.createNote,
              field_data: $set: field_data
      else
        if @isMounted then @setState nomenData: null

  getColor: (x) ->
    return 'white' unless @state.tags? and @state.colors? and x?
    if x instanceof Tag
      tag = x
    else if x.tag_id?
      tag = (tag for tag in @state.tags when tag.tag_id is parseInt(x.tag_id))[0]
    else if typeof x in ['number', 'string']
      tag = (tag for tag in @state.tags when tag.tag_id is parseInt x)[0]
    else
      return 'white'
    @state.colors["tag_#{@state.tags.indexOf(tag) % 8 + 1}"] ? 'white'

  # @ifdef NATIVE
  getGoogleZoom: ->
    return 1 unless @state.bounds?
    w = (@layout?.width  ? 400) * 2
    h = (@layout?.height ? 400) * 2
    fitBounds(@state.bounds, {width: w, height: h}).zoom
  # @endif

  # @ifdef WEB
  getGoogleZoom: ->
    @state.zoom
  # @endif

  commonSearchParams: (filterByMap = true, {auth = @props.auth, game = @props.game} = {}) ->
    o =
      game_id: game.game_id
      search: @state.searchParams.text ? ''
      order: @state.searchParams.sort ? 'recent'
      filter: if auth.authToken? and @state.searchParams.mine then 'mine' else undefined
      tag_ids: @state.searchParams.tags ? undefined
      min_time: timeToARIS @state.searchParams.min_time
      max_time: timeToARIS @state.searchParams.max_time
      zoom: @getGoogleZoom()
    if filterByMap
      o.min_latitude = @state.bounds?.se?.lat
      o.max_latitude = @state.bounds?.nw?.lat
      o.min_longitude = @state.bounds?.nw?.lng
      o.max_longitude = @state.bounds?.se?.lng
    o

  loadResults: (authGame) ->
    @loadResultsSingle(true, authGame)
    @loadResultsSingle(false, authGame)

  loadResultsSingle: (filterByMap, {auth = @props.auth, game = @props.game} = {}) ->
    notesKey = if filterByMap then 'notes' else 'notesEverywhere'
    loadedAllKey = if filterByMap then 'loadedAll' else 'loadedAllEverywhere'
    xhrKey = if filterByMap then 'lastResultsXHR' else 'lastResultsXHREverywhere'
    loadingKey = if filterByMap then 'loading' else 'loadingEverywhere'
    unless @props.online
      if @state.allNotes?
        words = (@state.searchParams.text ? '').split(/\s+/).filter((w) => w.length).map((w) => w.toLowerCase())
        filteredNotes =
          for note in @state.allNotes
            if filterByMap
              # filter by map
              if (min_latitude = @state.bounds?.se?.lat)? and (max_latitude = @state.bounds?.nw?.lat)?
                continue unless min_latitude <= note.latitude <= max_latitude
              if (min_longitude = @state.bounds?.nw?.lng)? and (max_longitude = @state.bounds?.se?.lng)?
                if min_longitude <= max_longitude
                  continue unless min_longitude <= note.longitude <= max_longitude
                else
                  # the international date line is inside the 2 longitudes
                  continue unless min_longitude <= note.longitude or note.longitude <= max_longitude
            # filter by text
            searchMatched = true
            for word in words
              unless note.description.toLowerCase().indexOf(word) isnt -1 or note.user.display_name.toLowerCase().indexOf(word) isnt -1
                searchMatched = false
                break
            continue unless searchMatched
            # filter by mine
            if @state.searchParams.mine
              continue unless note.user.user_id is auth.authToken.user_id
            # filter by tag
            continue unless note.tag_id
            if (tags = @state.searchParams.tags)?
              continue unless tags.length is 0 or note.tag_id in tags
            # filter by time
            continue if @state.searchParams.min_time? and @state.searchParams.min_time > note.created.getTime()
            continue if @state.searchParams.max_time? and @state.searchParams.max_time < note.created.getTime()
            note
        {map_notes, map_clusters} = makeClusters(filteredNotes, 35, @getGoogleZoom())
        @setState
          map_notes: map_notes
          map_clusters:
            for cluster in map_clusters
              lats = (note.latitude for note in cluster)
              lons = (note.longitude for note in cluster)
              tags = {}
              for note in cluster
                tags[note.tag_id] ?= 0
                tags[note.tag_id] += 1
              min_latitude: Math.min.apply(Math, lats)
              max_latitude: Math.max.apply(Math, lats)
              min_longitude: Math.min.apply(Math, lons)
              max_longitude: Math.max.apply(Math, lons)
              note_count: cluster.length
              tags: tags
              note_ids: (note.note_id for note in cluster)
          "#{notesKey}": filteredNotes
      # otherwise, need to wait for notes to be deserialized
      return
    @[loadingKey] = true
    @[xhrKey]?.abort()
    params = update @commonSearchParams(filterByMap, {auth, game}),
      limit: $set: 50
    @[xhrKey] = auth.siftrSearch params
    , withSuccess ({map_notes, map_clusters, notes}) =>
      @[xhrKey] = null
      @refs.thumbs?.scrollTop()
      @[loadingKey] = false
      if @isMounted then @setState
        map_notes: map_notes
        map_clusters: map_clusters
        "#{notesKey}": notes
        "#{loadedAllKey}": false

  loadMoreResults: ->
    @loadMoreResultsSingle(true)
    @loadMoreResultsSingle(false)

  loadMoreResultsSingle: (filterByMap) ->
    notesKey = if filterByMap then 'notes' else 'notesEverywhere'
    loadedAllKey = if filterByMap then 'loadedAll' else 'loadedAllEverywhere'
    xhrKey = if filterByMap then 'lastResultsXHR' else 'lastResultsXHREverywhere'
    loadingKey = if filterByMap then 'loading' else 'loadingEverywhere'
    return unless @props.online
    currentNotes = @state[notesKey]
    return if @[loadingKey] or @state[loadedAllKey] or not currentNotes?
    @[loadingKey] = true
    @[xhrKey]?.abort()
    params = update @commonSearchParams(filterByMap),
      offset: $set: currentNotes.length
      map_data: $set: false
      limit: $set: 50
    @[xhrKey] = @props.auth.siftrSearch params
    , withSuccess ({notes}) =>
      @[xhrKey] = null
      @[loadingKey] = false
      if @isMounted then @setState
        "#{notesKey}": currentNotes.concat notes
        "#{loadedAllKey}": notes.length < 50

  moveMap: (obj) ->
    if @isMounted then @setState obj, => @loadResults()

  loadNoteByID: (note_id, from_history = false) ->
    @props.auth.searchNotes
      game_id: @props.game.game_id
      note_id: note_id
    , withSuccess (data) =>
      return unless @isMounted
      @setState {
        viewingNote: data[0]
        createNote: null
      }, =>
        # @ifdef WEB
        unless from_history
          history.pushState(note_id, '', '#' + note_id)
        # @endif
        # @ifdef NATIVE
        null
        # @endif

  selectNote: (note) ->
    return if note.note_id is 0
    if @props.online
      @loadNoteByID note.note_id
      @setState
        searchOpen: false
        createNote: null
    else if @isMounted
      @setState
        viewingNote: note
        searchOpen: false
        createNote: null

  deleteNote: (note) ->
    @props.auth.call 'notes.deleteNote',
      note_id: note.note_id
    , withSuccess =>
      return unless @isMounted
      @setState viewingNote: null
      @loadResults()

  flagNote: (note) ->
    @props.auth.call 'notes.flagNote',
      note_id: note.note_id
    , withSuccess =>
      return unless @isMounted
      @setState viewingNote: null
      @loadResults()

  renderSearch: ->
    <SearchNotes
      auth={@props.auth}
      game={@props.game}
      tags={@state.tags ? []}
      searchParams={@state.searchParams}
      onSearch={(searchParams) =>
        return unless @isMounted
        @setState {searchParams}, => @loadResults()
      }
      getColor={@getColor}
      allNotes={@state.allNotes}
    />

  closeNote: ->
    if @isMounted
      @setState viewingNote: null
      # @ifdef WEB
      history.pushState null, '', '#'
      # @endif

  renderNoteView: ->
    if @state.viewingNote?
      <SiftrNoteView
        ref={(noteView) => @noteView = noteView}
        note={@state.viewingNote}
        onClose={=> @closeNote()}
        auth={@props.auth}
        onDelete={@deleteNote}
        onFlag={@flagNote}
        onEdit={@startEdit}
        onReload={(note) => @loadNoteByID note.note_id}
        isAdmin={@props.isAdmin}
        onPromptLogin={@props.onPromptLogin}
        getColor={@getColor}
        fields={@state.fields}
        tag={do =>
          for tag in (@state.tags ? [])
            if tag.tag_id is @state.viewingNote.tag_id
              return tag
        }
      />

  renderMap: ->
    createStep3 = @state.createNote?.caption?
    createStep4 = @state.createNote?.location?
    <SiftrMap
      map_notes={
        # @ifdef WEB
        if createStep4
          pin = new Note
          pin.note_id = 0
          pin.latitude = @state.createNote.location.lat
          pin.longitude = @state.createNote.location.lng
          pin.description = @state.createNote.caption
          pin.tag_id = @state.createNote.category.tag_id
          [pin]
        else if createStep3
          [] # pin gets shown by CreateStep3 instead
        # @endif
        # @ifdef NATIVE
        if @state.createNote?.category?
          pin = new Note
          pin.note_id = 0
          pin.latitude = @state.center.lat
          pin.longitude = @state.center.lng
          pin.description = @state.createNote.caption
          pin.tag_id = @state.createNote.category.tag_id
          [pin]
        # @endif
        else
          @state.map_notes
      }
      map_clusters={
        if createStep3
          []
        else
          @state.map_clusters
      }
      onMove={@moveMap}
      onLayout={(event) =>
        @layout = event.nativeEvent.layout
      }
      center={@state.center}
      zoom={@state.zoom}
      delta={@state.delta}
      getColor={@getColor}
      colors={@state.colors}
      onSelectNote={@selectNote}
      key={1}
      ref="theSiftrMap"
      onMouseEnter={(obj) =>
        @setState mapHover: obj
      }
      onMouseLeave={(obj) =>
        if @state.mapHover is obj
          @setState mapHover: null
      }
      thumbHover={@state.thumbHover?.note_id}
      tags={@state.tags}
    />

  renderThumbnails: ->
    filterByMap = @state.mainView is 'hybrid'
    notesKey = if filterByMap then 'notes' else 'notesEverywhere'
    loadedAllKey = if filterByMap then 'loadedAll' else 'loadedAllEverywhere'
    <SiftrThumbnails
      ref="thumbs"
      notes={@state[notesKey]}
      getColor={@getColor}
      onSelectNote={@selectNote}
      key={2}
      hasMore={not @state[loadedAllKey]}
      loadMore={@loadMoreResults}
      onMouseEnter={(note) =>
        @setState thumbHover: note
      }
      onMouseLeave={(note) =>
        if @state.thumbHover is note
          @setState thumbHover: null
      }
      mapHover={
        if (note_id = @state.mapHover?.note_id)?
          [note_id]
        else if (note_ids = @state.mapHover?.note_ids)?
          note_ids.map (x) => parseInt(x)
        else
          []
      }
    />

  startLocatingNote: ({exif}) ->
    return unless @isMounted
    goToCenter = (center) =>
      @setState {center}
      # @ifdef NATIVE
      @refs.theSiftrMap?.moveToPoint center
      # @endif
    # first use existing center
    if (center = @state.createNote.location)?
      goToCenter center
      return
    # then get location from exif
    lat = exif?.GPSLatitude
    lng = exif?.GPSLongitude
    if lat? and lng?
      readRat = (rat) -> rat.numerator / rat.denominator
      readGPS = ([deg, min, sec]) ->
        readRat(deg) + readRat(min) / 60 + readRat(sec) / 3600
      lat = readGPS lat
      lat *= -1 if exif.GPSLatitudeRef is 'S'
      lng = readGPS lng
      lng *= -1 if exif.GPSLongitudeRef is 'W'
      goToCenter {lat, lng}
      return
    # then, use game's location, but try to override from browser
    @setState
      center:
        lat: @props.game.latitude
        lng: @props.game.longitude
    , =>
      navigator.geolocation?.getCurrentPosition (posn) =>
        return unless @isMounted
        goToCenter
          lat: posn.coords.latitude
          lng: posn.coords.longitude

  startCreate: ({nomenData, saved_note} = {}) ->
    return if @state.createNote?
    if @props.auth.authToken? or not @props.online
      obj =
        createNote: {}
        createStep: 1
        searchOpen: false
        viewingNote: null
        primaryMenuOpen: false
        nomenData: nomenData
      if (note = saved_note?.note)?
        obj.createNote = note
      if (loc = saved_note?.location)?
        obj.resumedNote = true
        obj.center = loc
        setTimeout =>
          @refs.theSiftrMap?.moveToPoint loc
        , 1000
      else
        obj.resumedNote = false
      @setState obj
      @closeNote()
    else
      @props.onPromptLogin()

  startEdit: (note) ->
    if @props.auth.authToken? or not @props.online
      obj =
        createNote:
          note_id: note.note_id
          caption: note.description
          category: do =>
            for tag in @state.tags
              return tag if tag.tag_id is note.tag_id
          location:
            lat: note.latitude
            lng: note.longitude
        createStep: 2
        searchOpen: false
        viewingNote: null
        primaryMenuOpen: false
      @setState obj
      # @ifdef WEB
      history.pushState null, '', '#'
      # @endif
    else
      @props.onPromptLogin()

  renderCreateNote: ->
    # @ifdef NATIVE
    unless @state.createNote?
      null
    else if @state.createStep is 1
      <CreateStep1
        auth={@props.auth}
        game={@props.game}
        onCancel={=> @setState createNote: null}
        onStoreMedia={({files}) => @setState
          createNote:
            files: files
            caption: ''
            location: @state.center
            category: @state.tags[0]
            field_data: []
            online: false
          createStep: 2
        }
        fields={@state.fields ? []}
      />
    else
      <CreateData
        createNote={@state.createNote}
        onUpdateNote={(createNote) => @setState {createNote}}
        onStartLocation={=> @startLocatingNote exif: @state.createNote.exif}
        getLocation={=> @state.center}
        categories={@state.tags ? []}
        fields={@state.fields ? []}
        onFinish={@finishNoteCreation}
        onCancel={=> @setState createNote: null}
        onBack={=> @setState
          createNote: {}
          createStep: 1
        }
        getColor={@getColor}
        progress={@state.progress}
        onViolaIdentify={@props.onViolaIdentify}
        resumedNote={@state.resumedNote}
      />
    # @endif
    # @ifdef WEB
    unless @state.createNote?
      null
    else if @state.createStep is 1
      <CreateStep1
        auth={@props.auth}
        game={@props.game}
        onCancel={=> @setState createNote: null}
        onStartUpload={=> @setState
          createNote:
            uploading: true
          createStep: 2
        }
        onProgress={(n) =>
          return unless @isMounted and @state.createNote?
          t = Date.now()
          if not @state.progressTime? or t - @state.progressTime > 300
            @setState
              progress: n
              progressTime: t
        }
        onCreateMedia={({media, exif}, fieldMedia) =>
          return unless @isMounted and @state.createNote?
          @setState createNote: {
            media: media
            exif: exif
            caption: @state.createNote?.caption
            location: @state.createNote?.location
            category: @state.createNote?.category
            field_media: fieldMedia
            field_data: @state.createNote?.field_data
          }
        }
        fields={@state.fields ? []}
      />
    else if @state.createStep is 2
      <CreateStep2
        categories={@state.tags ? []}
        note={@state.createNote}
        onEnterCaption={({text, category}) =>
          @setState
            createNote:
              update @state.createNote,
                caption:
                  $set: text
                category:
                  $set: category
            createStep: 3
          , => @startLocatingNote exif: @state.createNote.exif
        }
        onCancel={=> @setState createNote: null}
        onBack={=> @setState
          createNote: {}
          createStep: 1
        }
        getColor={@getColor}
        progress={if @state.createNote.media? then null else @state.progress}
      />
    else if @state.createStep is 3
      <CreateStep3
        onPickLocation={(caption) => @setState
          createNote:
            update @state.createNote,
              caption:
                $set: caption
          createStep: 5
        }
        onCancel={=> @setState createNote: null}
        onBack={=> @setState createStep: 2}
        progress={if @state.createNote.media? then null else @state.progress}
      />
    else
      <CreateStep5
        onChangeData={(field_data) =>
          @setState createNote: update @state.createNote,
            field_data: $set: field_data
        }
        onFinish={@finishNoteCreation}
        onCancel={=> @setState createNote: null}
        onBack={=>
          @setState
            center: @state.createNote.location
            createStep: 3
        }
        fields={@state.fields}
        field_data={@state.createNote.field_data}
        progress={if @state.createNote.media? then null else @state.progress}
      />
    # @endif

  finishNoteCreation: (field_data = @state.createNote?.field_data ? []) ->
    {media, files, caption, category, field_media} = @state.createNote
    field_media ?= []
    location = @state.center
    createArgs =
      game_id: @props.game.game_id
      description: caption
      trigger:
        latitude: location.lat
        longitude: fixLongitude location.lng
      tag_id: category.tag_id
      field_data: field_data.concat(field_media)
    if media?
      # we've already uploaded media, now create note
      createArgs.media_id = media.media_id
      @props.auth.call 'notes.createNote', createArgs, withSuccess (note) =>
        @setState createNote: null
        @loadResults()
        @loadNoteByID note.note_id
    else
      # save note for later upload queue
      queueDir = "#{RNFS.DocumentDirectoryPath}/siftrqueue/#{Date.now()}"
      filesToCopy = []
      for f in files
        continue unless f.file?
        name = f.file.name
        if f.field_id?
          name = "#{f.field_id}.#{name.split('.').pop()}"
        createArgs.files ?= []
        createArgs.files.push
          field_id: f.field_id
          filename: name
          mimetype: f.file.type
          game_id: @props.game.game_id
        filesToCopy.push
          copyFrom: f.file.uri
          copyTo: "#{queueDir}/#{name}"
      RNFS.mkdir(queueDir)
      .then => RNFS.writeFile("#{queueDir}/createNote.json", JSON.stringify(createArgs))
      .then =>
        Promise.all(
          for fileToCopy in filesToCopy
            if fileToCopy.copyFrom.match(/^assets-library/)
              RNFS.copyAssetsFileIOS(fileToCopy.copyFrom, fileToCopy.copyTo, 0, 0)
            else
              RNFS.copyFile(fileToCopy.copyFrom, fileToCopy.copyTo)
        )
      .then =>
        @setState createNote: null
      .catch (err) =>
        console.warn JSON.stringify err

  # @ifdef NATIVE
  render: ->
    <KeyboardAwareView style={
      flexDirection: 'column'
      flex: 1
      backgroundColor: 'white'
    }>
      <SiftrInfo
        game={@props.game}
        isOpen={@state.infoOpen}
        onChange={(b) => @setState infoOpen: b}
        tags={@state.tags}
        getColor={@getColor}
        notes={@state.allNotes}
        followed={@props.followed}
        followGame={=> @props.followGame @props.game}
        unfollowGame={=> @props.unfollowGame @props.game}
      >
        <StatusSpace />
        <Blackout isFocused={false} keyboardUp={@state.keyboardUp}>
          <View style={
            flexDirection: 'row'
            justifyContent: 'space-between'
            alignItems: 'center'
            backgroundColor: 'white'
          }>
            <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={
              if @state.viewingNote?
                => @closeNote()
              else if @state.createNote?
                => @setState createNote: null
              else if @state.searchOpen
                => @setState searchOpen: false
              else
                @props.onExit
            }>
              {
                <Image
                  style={
                    margin: 10
                    resizeMode: 'contain'
                    height: 18
                    opacity:
                      if Platform.OS is 'ios' and @props.aris and not @state.viewingNote? and not @state.createNote? and not @state.searchOpen
                        0
                      else
                        1
                  }
                  source={require('../web/assets/img/icon-back.png')}
                />
              }
            </TouchableOpacity>
            <View style={flex: 4, alignItems: 'center'}>
              <Text>{
                if @state.viewingNote?
                  @state.viewingNote.user.display_name
                else if @state.createNote?
                  "Posting to: #{@props.game.name}"
                else
                  @props.game.name
              }</Text>
            </View>
            {
              if @state.viewingNote?
                hasOptions = false
                hasOptions or= @state.viewingNote.user.user_id is @props.auth.authToken?.user_id
                hasOptions or= @state.viewingNote.published is 'AUTO' and @props.auth.authToken?.user_id isnt @state.viewingNote.user.user_id
                hasOptions or= @state.viewingNote.user.user_id is @props.auth.authToken?.user_id or @props.isAdmin
                if hasOptions
                  <TouchableOpacity style={flex: 1, alignItems: 'flex-end'} onPress={=> @noteView?.openNoteOptions()}>
                    <Image style={resizeMode: 'contain', height: 5, margin: 10} source={require('../web/assets/img/icon-3dots.png')} />
                  </TouchableOpacity>
                else
                  <View style={flex: 1, opacity: 0}>
                    <Image style={resizeMode: 'contain', height: 5, margin: 10} source={require('../web/assets/img/icon-3dots.png')} />
                  </View>
              else
                <TouchableOpacity style={flex: 1, alignItems: 'flex-end'} onPress={=> @setState infoOpen: not @state.infoOpen}>
                  <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-4dots.png')} />
                </TouchableOpacity>
            }
          </View>
        </Blackout>
        {
          if @props.queueMessage?
            <View style={
              backgroundColor: 'rgb(233,240,240)'
              padding: 4
              alignSelf: 'stretch'
            }>
              <Text>
                {@props.queueMessage}
              </Text>
            </View>
        }
        <View style={
          flex: 1
        }>
          {
            if @state.createNote? and not (@state.createNote.media? or @state.createNote.files? or @state.createNote.uploading)
              undefined
            else if @state.mainView is 'thumbs'
              [@renderMap(), @renderThumbnails()]
            else
              [@renderThumbnails(), @renderMap()]
          }
          {@renderNoteView()}
          {@renderCreateNote()}
          {@renderSearch() if @state.searchOpen}
        </View>
        {
          unless @state.createNote? or @state.viewingNote?
            <View style={
              flexDirection: 'row'
              justifyContent: 'space-between'
              alignItems: 'center'
              backgroundColor: 'white'
            }>
              <TouchableOpacity style={padding: 10} onPress={=>
                @setState mainView: if @state.mainView is 'thumbs' then 'map' else 'thumbs'
              }>
                <Image style={resizeMode: 'contain', height: 30} source={
                  if @state.mainView is 'thumbs'
                    require('../web/assets/img/icon-grid.png')
                  else
                    require('../web/assets/img/icon-map.png')
                } />
              </TouchableOpacity>
              <TouchableOpacity style={padding: 10} onPress={@startCreate}>
                <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-add.png')} />
              </TouchableOpacity>
              <TouchableOpacity style={padding: 10} onPress={=>
                @setState searchOpen: not @state.searchOpen
              }>
                <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-filter.png')} />
              </TouchableOpacity>
            </View>
        }
      </SiftrInfo>
    </KeyboardAwareView>
  # @endif

  # @ifdef WEB
  render: ->
    classes = [
      'siftr-view'
      if @state.searchOpen then 'search-open' else 'search-closed'
      "main-view-#{if @state.createNote? then 'map' else @state.mainView}"
    ]
    isFollowing =
      @props.followed?.some (game) => game.game_id is @props.game.game_id
    on_off = (b) -> if b then 'on' else 'off'
    <div className={classes.join(' ')}>
      <div className="siftr-view-nav">
        <div className="siftr-view-nav-section">
          <div className="siftr-view-nav-vertical">
            <h2>
              {@props.game.name}
            </h2>
            {
              if @props.auth.authToken?
                <p className="siftr-view-nav-follow">
                  <a href="#" onClick={clicker =>
                    if isFollowing
                      @props.unfollowGame @props.game
                    else
                      @props.followGame @props.game
                  }>
                    {
                      if isFollowing
                        'Followed'
                      else
                        'Follow this Siftr'
                    }
                  </a>
                </p>
            }
          </div>
        </div>
        <div className="siftr-view-nav-section">
          <a href="#" className="main-view-option option-#{on_off(@state.mainView is 'hybrid' and not @state.createNote?)}" onClick={clicker => @setState mainView: 'hybrid'}>
            <img src={"assets/img/main-view-hybrid-on.png"} />
          </a>
          <a href="#" className="main-view-option option-#{on_off(@state.mainView is 'map' and not @state.createNote?)}" onClick={clicker => @setState mainView: 'map'}>
            <img src={"assets/img/main-view-map-on.png"} />
          </a>
          <a href="#" className="main-view-option option-#{on_off(@state.mainView is 'thumbs' and not @state.createNote?)}" onClick={clicker => @setState mainView: 'thumbs'}>
            <img src={"assets/img/main-view-thumbs-on.png"} />
          </a>
          <span className="main-view-option-separator" />
          <a href="#" className="main-view-option" onClick={clicker => @setState searchOpen: not @state.searchOpen}>
            <img src={"assets/img/#{if @state.searchOpen then 'icon-x-black' else 'icon-filter'}.png"} />
          </a>
        </div>
      </div>
      <div className="siftr-view-content">
        {@renderMap()}
        {@renderThumbnails()}
        {@renderNoteView()}
        <div className="create-step-box">
          {@renderCreateNote()}
        </div>
        {@renderSearch()}
        <a className={
          if @state.createNote?
            "start-create-plus cancel-button"
          else
            "start-create-plus"
        } href="#" onClick={clicker =>
          if @state.createNote?
            @setState createNote: null
          else
            @startCreate()
        }>
          <img src="assets/img/mobile-plus.png" />
        </a>
      </div>
    </div>
  # @endif
