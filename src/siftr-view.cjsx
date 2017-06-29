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
, BackAndroid
} = require 'react-native'
RNFS = require 'react-native-fs'
{styles} = require './styles'
{StatusSpace} = require './status-space'
# @endif

{fitBounds} = require 'google-map-react/utils'

{ Auth
, Game
, Tag
, Note
, FieldData
, Colors
, Field
} = require './aris'

{timeToARIS} = require './time-slider'

{SearchNotes} = require './search-notes'
{SiftrMap} = require './map'
{SiftrThumbnails} = require './thumbnails'
{SiftrNoteView} = require './note-view'
{CreateStep1, CreateStep2, CreateStep3, CreateStep4, CreateStep5} = require './create-note'

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
    # nomenData
    clearNomenData: T.func
    online: T.bool

  getDefaultProps: ->
    isAdmin: false
    onExit: (->)
    onPromptLogin: (->)
    nomenData: null
    clearNomenData: (->)

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
    # @ifdef NATIVE
    siftrDir = "#{RNFS.DocumentDirectoryPath}/siftrs/#{@props.game.game_id}"
    RNFS.mkdir siftrDir, NSURLIsExcludedFromBackupKey: true
    RNFS.writeFile "#{siftrDir}/game.txt", JSON.stringify @props.game
    if @props.online
      @props.auth.getTagsForGame
        game_id: @props.game.game_id
      , withSuccess (tags) =>
        @setState {tags}
        RNFS.writeFile "#{siftrDir}/tags.txt", JSON.stringify tags
      @props.auth.getColors
        colors_id: @props.game.colors_id ? 1
      , withSuccess (colors) =>
        @setState {colors}
        RNFS.writeFile "#{siftrDir}/colors.txt", JSON.stringify colors
      @props.auth.getFieldsForGame
        game_id: @props.game.game_id
      , withSuccess (fields) =>
        @setState {fields}
        RNFS.writeFile "#{siftrDir}/fields.txt", JSON.stringify fields
    else
      RNFS.readFile("#{siftrDir}/tags.txt").then (tags) =>
        @setState tags:
          for tag in JSON.parse tags
            Object.assign(new Tag, tag)
      RNFS.readFile("#{siftrDir}/colors.txt").then (colors) =>
        @setState colors: Object.assign(new Colors, JSON.parse colors)
      RNFS.readFile("#{siftrDir}/fields.txt").then (fields) =>
        @setState fields:
          for field in JSON.parse fields
            Object.assign(new Field, field)
    @hardwareBack = =>
      if @state.searchOpen
        @setState searchOpen: false
      else
        @props.onExit()
      true
    BackAndroid.addEventListener 'hardwareBackPress', @hardwareBack
    # @endif
    # @ifdef WEB
    @props.auth.getTagsForGame
      game_id: @props.game.game_id
    , withSuccess (tags) => @setState {tags}
    @props.auth.getColors
      colors_id: @props.game.colors_id ? 1
    , withSuccess (colors) => @setState {colors}
    @props.auth.getFieldsForGame
      game_id: @props.game.game_id
    , withSuccess (fields) => @setState {fields}
    # @endif
    if @props.nomenData?
      @applyNomenData @props.nomenData

  componentDidMount: ->
    @nomenTimer = setInterval =>
      @checkNomenFieldData()
    , 1000

  componentWillUnmount: ->
    clearInterval @nomenTimer
    # @ifdef NATIVE
    BackAndroid.removeEventListener 'hardwareBackPress', @hardwareBack
    # @endif

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
    if not @props.nomenData? and nextProps.nomenData?
      @applyNomenData nextProps.nomenData

  applyNomenData: (nomenData) ->
    if @state.createNote?
      # continue note filling in data
      @setState {nomenData}
    else
      @startCreate nomenData
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
          @setState
            nomenData: null
            createNote: update @state.createNote,
              field_data: $set: field_data
      else
        @setState nomenData: null

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
    return unless @props.online
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
    return unless @props.online
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

  startCreate: (nomenData) ->
    return if @state.createNote?
    if @props.auth.authToken? or not @props.online
      @setState
        createNote: {}
        searchOpen: false
        viewingNote: null
        nomenData: nomenData
    else
      @props.onPromptLogin()

  renderCreateNote: ->
    unless @state.createNote?
      null
    else unless @state.createNote.media? or @state.createNote.file?
      <CreateStep1
        auth={@props.auth}
        game={@props.game}
        onCancel={=> @setState createNote: null}
        onCreateMedia={({media, exif}) => @setState createNote: {media, exif, online: true}}
        onStoreMedia={({file}) => @setState createNote: {file, online: false}}
        online={@props.online}
      />
    else unless @state.createNote.caption?
      <CreateStep2
        onEnterCaption={(caption) =>
          @setState
            createNote:
              media: @state.createNote.media
              exif: @state.createNote.exif
              file: @state.createNote.file
              online: @state.createNote.online
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
          file: @state.createNote.file
          online: @state.createNote.online
          caption: @state.createNote.caption
          location: @state.center
          category: @state.tags[0] # TODO handle empty case better
        }
        onCancel={=> @setState createNote: null}
        onBack={=> @setState createNote:
          media: @state.createNote.media
          exif: @state.createNote.exif
          file: @state.createNote.file
          online: @state.createNote.online
          defaultCaption: @state.createNote.caption
        }
      />
    else unless @state.createNote.field_data?
      <CreateStep4
        categories={@state.tags ? []}
        category={@state.createNote.category}
        onPickCategory={(category) =>
          @setState createNote: update @state.createNote,
            category: $set: category
        }
        onFinish={=> @setState createNote:
          media: @state.createNote.media
          exif: @state.createNote.exif
          file: @state.createNote.file
          online: @state.createNote.online
          caption: @state.createNote.caption
          location: @state.createNote.location
          category: @state.createNote.category
          field_data: []
        }
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
    else
      <CreateStep5
        onChangeData={(field_data) =>
          @setState createNote: update @state.createNote,
            field_data: $set: field_data
        }
        onFinish={@finishNoteCreation}
        onCancel={=> @setState createNote: null}
        onBack={=>
          @setState createNote:
            media: @state.createNote.media
            exif: @state.createNote.exif
            file: @state.createNote.file
            online: @state.createNote.online
            caption: @state.createNote.caption
            location: @state.createNote.location
            category: @state.createNote.category
        }
        fields={@state.fields}
        field_data={@state.createNote.field_data}
      />

  finishNoteCreation: (field_data) ->
    {media, file, online, caption, location, category} = @state.createNote
    createArgs =
      game_id: @props.game.game_id
      description: caption
      trigger:
        latitude: location.lat
        longitude: fixLongitude location.lng
      tag_id: category.tag_id
      field_data: field_data
    if online
      # we've already uploaded media, now create note
      createArgs.media_id = media.media_id
      @props.auth.call 'notes.createNote', createArgs, withSuccess (note) =>
        @setState createNote: null
        @loadResults()
        @loadNoteByID note.note_id
    else
      # save note for later upload queue
      queueDir = "#{RNFS.DocumentDirectoryPath}/siftrqueue/#{Date.now()}"
      RNFS.mkdir(queueDir).then =>
        if file.uri.indexOf('content://') is -1
          RNFS.copyFile(file.uri, "#{queueDir}/#{file.name}").then =>
            createArgs.filename = file.name
            createArgs.mimetype = file.type # this is for us to reconstruct 'file' during upload
            RNFS.writeFile("#{queueDir}/createNote.json", JSON.stringify(createArgs)).then =>
              @setState createNote: null
        else
          console.warn "TODO: handle content:// (picked from image roll on Android)"
          @setState createNote: null

  # @ifdef NATIVE
  render: ->
    <View style={
      flexDirection: 'column'
      flex: 1
      backgroundColor: 'white'
    }>
      <StatusSpace />
      <View style={
        flexDirection: 'row'
        justifyContent: 'space-between'
        alignItems: 'center'
      }>
        <TouchableOpacity style={padding: 10} onPress={
          if @state.viewingNote?
            => @setState viewingNote: null
          else
            @props.onExit
        }>
          <Image style={resizeMode: 'contain', height: 18} source={require('../web/assets/img/icon-back.png')} />
        </TouchableOpacity>
        <Text>{
          if @state.viewingNote?
            @state.viewingNote.user.display_name
          else
            @props.game.name
        }</Text>
        <TouchableOpacity style={padding: 10}>
          <Image style={resizeMode: 'contain', height: 20} source={require('../web/assets/img/icon-4dots.png')} />
        </TouchableOpacity>
      </View>
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
        flexDirection: 'row'
        justifyContent: 'space-between'
        alignItems: 'center'
      }>
        <TouchableOpacity style={padding: 10} onPress={=>
          @setState primaryMap: not @state.primaryMap
        }>
          <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-map.png')} />
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
