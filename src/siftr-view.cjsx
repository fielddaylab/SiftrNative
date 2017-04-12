'use strict'

React = require 'react'
T = React.PropTypes
update = require 'immutability-helper'

# @ifdef NATIVE
{ Text
, View
, TextInput
, TouchableOpacity
, Image
} = require 'react-native'
{styles} = require './styles'
# @endif

{fitBounds} = require 'google-map-react/utils'

{ Auth
, Game
, Tag
, Note
} = require './aris'

{timeToARIS} = require './time-slider'

{SearchNotes} = require './search-notes'
{SiftrMap} = require './map'
{SiftrThumbnails} = require './thumbnails'
{SiftrNoteView} = require './note-view'
{CreateStep1, CreateStep2, CreateStep3, CreateStep4} = require './create-note'

{clicker, withSuccess, DIV, P, BUTTON} = require './utils'

fixLongitude = (longitude) ->
  longitude %%= 360
  longitude -= 360 if longitude > 180
  longitude

SiftrView = React.createClass
  propTypes:
    game: T.instanceOf(Game).isRequired
    auth: T.instanceOf(Auth).isRequired
    isAdmin: T.bool
    onExit: T.func
    onPromptLogin: T.func

  getDefaultProps: ->
    isAdmin: false
    onExit: (->)
    onPromptLogin: (->)

  getInitialState: ->
    center:
      lat: @props.game.latitude
      lng: @props.game.longitude
    # @ifdef NATIVE
    delta: do =>
      delta =
        switch @props.game.zoom
          when 13 then 0.05
          else 0.05 # TODO
      lat: delta
      lng: delta
    # @endif
    # @ifdef WEB
    zoom: @props.game.zoom
    # @endif
    map_notes: []
    map_clusters: []
    notes: []
    loadedAll: true
    tags: null
    colors: null
    viewingNote: null
    createNote: null
    searchParams: {}
    searchOpen: false
    primaryMap: true
    fields: null

  componentWillMount: ->
    @props.auth.getTagsForGame
      game_id: @props.game.game_id
    , withSuccess (tags) =>
      @setState {tags}
    @props.auth.getColors
      colors_id: @props.game.colors_id ? 1
    , withSuccess (colors) =>
      @setState {colors}
    @props.auth.getFieldsForGame
      game_id: @props.game.game_id
    , withSuccess (fields) =>
      @setState {fields}

  componentWillReceiveProps: (nextProps) ->
    if @props.auth.authToken?.user_id isnt nextProps.auth.authToken?.user_id
      # if we log in or out, reload the note search
      @loadResults nextProps.auth
      if @state.viewingNote? and @props.auth.authToken?
        # if we were logged in, close the open note
        @setState viewingNote: null
      if not nextProps.auth.authToken?
        # cancel note creation on logout
        @setState createNote: null

  # @ifdef WEB
  componentWillUpdate: (nextProps, nextState) ->
    # hack to force map to notice it has been resized
    if @state.primaryMap isnt nextState.primaryMap
      setTimeout =>
        window.dispatchEvent new Event 'resize'
      , 500
  # @endif

  getColor: (x) ->
    return 'white' unless @state.tags? and @state.colors?
    if x instanceof Tag
      tag = x
    else if x.tag_id?
      tag = (tag for tag in @state.tags when tag.tag_id is parseInt(x.tag_id))[0]
    else if typeof x in ['number', 'string']
      tag = (tag for tag in @state.tags when tag.tag_id is parseInt x)[0]
    else
      return 'white'
    @state.colors["tag_#{@state.tags.indexOf(tag) % 8 + 1}"] ? 'white'

  commonSearchParams: (auth) ->
    game_id: @props.game.game_id
    min_latitude: @state.bounds.se.lat
    max_latitude: @state.bounds.nw.lat
    min_longitude: @state.bounds.nw.lng
    max_longitude: @state.bounds.se.lng
    search: @state.searchParams.text ? ''
    order: @state.searchParams.sort ? 'recent'
    filter: if auth.authToken? and @state.searchParams.mine then 'mine' else undefined
    tag_ids: @state.searchParams.tags ? undefined
    min_time: timeToARIS @state.searchParams.min_time
    max_time: timeToARIS @state.searchParams.max_time
    zoom:
      # @ifdef NATIVE
      do =>
        w = (@layout?.width  ? 400) * 2
        h = (@layout?.height ? 400) * 2
        fitBounds(@state.bounds, {width: w, height: h}).zoom
      # @endif
      # @ifdef WEB
      @state.zoom
      # @endif

  loadResults: (auth = @props.auth) ->
    @loading = true
    @lastResultsXHR?.abort()
    params = update @commonSearchParams(auth),
      limit: $set: 50
    @lastResultsXHR = auth.siftrSearch params
    , withSuccess ({map_notes, map_clusters, notes}) =>
      @lastResultsXHR = null
      @refs.thumbs?.scrollTop()
      @loading = false
      @setState
        map_notes: map_notes
        map_clusters: map_clusters
        notes: notes
        loadedAll: false

  loadMoreResults: ->
    currentNotes = @state.notes
    return if @loading or @state.loadedAll or not currentNotes?
    @loading = true
    @lastResultsXHR?.abort()
    params = update @commonSearchParams(auth),
      offset: $set: currentNotes.length
      map_data: $set: false
      limit: $set: 50
    @lastResultsXHR = @props.auth.siftrSearch params
    , withSuccess ({notes}) =>
      @lastResultsXHR = null
      @loading = false
      @setState
        notes: currentNotes.concat notes
        loadedAll: notes.length < 50

  moveMap: (obj) ->
    @setState obj, => @loadResults()

  loadNoteByID: (note_id) ->
    @props.auth.searchNotes
      game_id: @props.game.game_id
      note_id: note_id
    , withSuccess (data) => @setState viewingNote: data[0]

  selectNote: (note) ->
    return if note.note_id is 0
    @loadNoteByID note.note_id
    @setState
      searchOpen: false
      createNote: null

  deleteNote: (note) ->
    @props.auth.call 'notes.deleteNote',
      note_id: note.note_id
    , withSuccess =>
      @setState viewingNote: null
      @loadResults()

  flagNote: (note) ->
    @props.auth.call 'notes.flagNote',
      note_id: note.note_id
    , withSuccess =>
      @setState viewingNote: null
      @loadResults()

  renderSearch: ->
    <SearchNotes
      auth={@props.auth}
      game={@props.game}
      tags={@state.tags ? []}
      searchParams={@state.searchParams}
      onSearch={(searchParams) =>
        @setState {searchParams}, => @loadResults()
      }
      getColor={@getColor}
    />

  renderNoteView: ->
    if @state.viewingNote?
      <SiftrNoteView
        note={@state.viewingNote}
        onClose={=> @setState viewingNote: null}
        auth={@props.auth}
        onDelete={@deleteNote}
        onFlag={@flagNote}
        onReload={(note) => @loadNoteByID note.note_id}
        isAdmin={@props.isAdmin}
        onPromptLogin={@props.onPromptLogin}
        getColor={@getColor}
        fields={@state.fields}
      />

  renderMap: ->
    createStep3 = @state.createNote?.caption?
    createStep4 = @state.createNote?.location?
    <SiftrMap
      map_notes={
        if createStep4
          pin = new Note
          pin.note_id = 0
          pin.latitude = @state.createNote.location.lat
          pin.longitude = @state.createNote.location.lng
          pin.description = @state.createNote.caption
          pin.tag_id = @state.createNote.category.tag_id
          [pin]
        else if createStep3
          []
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
    />

  renderThumbnails: ->
    <SiftrThumbnails
      ref="thumbs"
      notes={@state.notes}
      getColor={@getColor}
      onSelectNote={@selectNote}
      key={2}
      hasMore={not @state.loadedAll}
      loadMore={@loadMoreResults}
    />

  startLocatingNote: ({exif, center}) ->
    # first use provided center
    if center?
      @setState center: center
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
      @setState center: {lat, lng}
      return
    # then, use game's location, but try to override from browser
    @setState
      center:
        lat: @props.game.latitude
        lng: @props.game.longitude
    , =>
      navigator.geolocation?.getCurrentPosition (posn) =>
        @setState center:
          lat: posn.coords.latitude
          lng: posn.coords.longitude

  startCreate: ->
    return if @state.createNote?
    if @props.auth.authToken?
      @setState
        createNote: {}
        searchOpen: false
        viewingNote: null
    else
      @props.onPromptLogin()

  renderCreateNote: ->
    unless @state.createNote?
      null
    else unless @state.createNote.media?
      <CreateStep1
        auth={@props.auth}
        game={@props.game}
        onCancel={=> @setState createNote: null}
        onCreateMedia={({media, exif}) => @setState createNote: {media, exif}}
      />
    else unless @state.createNote.caption?
      <CreateStep2
        onEnterCaption={(caption) =>
          @setState
            createNote:
              media: @state.createNote.media
              exif: @state.createNote.exif
              caption: caption
          , => @startLocatingNote exif: @state.createNote.exif
        }
        onCancel={=> @setState createNote: null}
        onBack={=> @setState createNote: {}}
        defaultCaption={@state.createNote.defaultCaption}
      />
    else unless @state.createNote.location?
      <CreateStep3
        onPickLocation={(caption) => @setState createNote:
          media: @state.createNote.media
          exif: @state.createNote.exif
          caption: @state.createNote.caption
          location: @state.center
          category: @state.tags[0] # TODO handle empty case better
        }
        onCancel={=> @setState createNote: null}
        onBack={=> @setState createNote:
          media: @state.createNote.media
          exif: @state.createNote.exif
          defaultCaption: @state.createNote.caption
        }
      />
    else
      <CreateStep4
        categories={@state.tags ? []}
        category={@state.createNote.category}
        onPickCategory={(category) =>
          @setState createNote: update @state.createNote,
            category: $set: category
        }
        onFinish={@finishNoteCreation}
        onCancel={=> @setState createNote: null}
        onBack={=>
          @setState
            createNote:
              media: @state.createNote.media
              caption: @state.createNote.caption
          , => @startLocatingNote center: @state.createNote.location
        }
        getColor={@getColor}
      />

  finishNoteCreation: (category) ->
    {media, caption, location} = @state.createNote
    @props.auth.call 'notes.createNote',
      game_id: @props.game.game_id
      description: caption
      media_id: media.media_id
      trigger:
        latitude: location.lat
        longitude: fixLongitude location.lng
      tag_id: category.tag_id
    , withSuccess (note) =>
      @setState createNote: null
      @loadResults()
      @loadNoteByID note.note_id

  # @ifdef NATIVE
  render: ->
    <View style={
      backgroundColor: 'white'
      flex: 1
      flexDirection: 'column'
    }>
      <View style={
        flex: 1
      }>
        {
          if @state.primaryMap
            [@renderThumbnails(), @renderMap()]
          else
            [@renderMap(), @renderThumbnails()]
        }
        {@renderNoteView()}
        {@renderCreateNote()}
        {@renderSearch() if @state.searchOpen}
      </View>
      <View style={
        backgroundColor: 'rgb(44,48,59)'
        flexDirection: 'row'
        justifyContent: 'space-between'
      }>
        <View style={flexDirection: 'row'}>
          <TouchableOpacity onPress={@props.onExit}>
            <Image style={width: 60, height: 60} source={require('../web/assets/img/brand.png')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={=> @setState primaryMap: true}>
            <Image style={width: 60, height: 60} source={
              if @state.primaryMap
                require('../web/assets/img/map-on.png')
              else
                require('../web/assets/img/map-off.png')
            } />
          </TouchableOpacity>
          <TouchableOpacity onPress={=> @setState primaryMap: false}>
            <Image style={width: 60, height: 60} source={
              if not @state.primaryMap
                require('../web/assets/img/thumbs-on.png')
              else
                require('../web/assets/img/thumbs-off.png')
            } />
          </TouchableOpacity>
        </View>
        <View style={flexDirection: 'row'}>
          <TouchableOpacity onPress={@startCreate}>
            <Image style={width: 60, height: 60} source={require('../web/assets/img/mobile-plus.png')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={=> @setState searchOpen: not @state.searchOpen}>
            <Image style={width: 60, height: 60} source={
              if @state.searchOpen
                require('../web/assets/img/search-on.png')
              else
                require('../web/assets/img/search-off.png')
            } />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    classes = [
      'siftr-view'
      if @state.searchOpen then 'search-open' else 'search-closed'
      if @state.primaryMap then 'primary-map' else 'primary-thumbs'
    ]
    <div className={classes.join(' ')}>
      <div className="siftr-view-nav">
        <div className="siftr-view-nav-section">
          <a href="#" onClick={clicker @props.onExit}>
            <img src="assets/img/brand.png" />
          </a>
          <a href="#" onClick={clicker => @setState primaryMap: true}>
            <img src={"assets/img/map-#{if @state.primaryMap then 'on' else 'off'}.png"} />
          </a>
          <a href="#" onClick={clicker => @setState primaryMap: false}>
            <img src={"assets/img/thumbs-#{if @state.primaryMap then 'off' else 'on'}.png"} />
          </a>
        </div>
        <div className="siftr-view-nav-section">
          <a href="#" onClick={clicker @startCreate}>
            <img src="assets/img/mobile-plus.png" />
          </a>
          <a href="#" onClick={clicker => @setState searchOpen: not @state.searchOpen}>
            <img src={"assets/img/search-#{if @state.searchOpen then 'on' else 'off'}.png"} />
          </a>
        </div>
      </div>
      <div className="siftr-view-content">
        {@renderMap()}
        {@renderThumbnails()}
        {@renderNoteView()}
        {@renderCreateNote()}
        {@renderSearch()}
      </div>
    </div>
  # @endif

exports.SiftrView = SiftrView
