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
, BackHandler
, Modal
, ScrollView
, TouchableWithoutFeedback
, Keyboard
} = require 'react-native'
RNFS = require 'react-native-fs'
{styles} = require './styles'
{StatusSpace} = require './status-space'
{KeyboardAwareView} = require 'react-native-keyboard-aware-view'
{default: SideMenu} = require 'react-native-side-menu'
{default: Markdown} = require 'react-native-simple-markdown'
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
{SiftrMap} = require './map'
{SiftrThumbnails} = require './thumbnails'
{SiftrNoteView} = require './note-view'
{CreateStep1, CreateStep2, CreateStep3, CreateStep4, CreateStep5, CreateData} = require './create-note'

{clicker, withSuccess, DIV, P, BUTTON} = require './utils'

fixLongitude = (longitude) ->
  longitude %%= 360
  longitude -= 360 if longitude > 180
  longitude

# @ifdef NATIVE
SiftrInfo = React.createClass
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
            <Text style={margin: 10}>
              {@props.game?.name}
            </Text>
            <TouchableOpacity onPress={if isFollowing then @props.unfollowGame else @props.followGame}>
              <Text style={margin: 10}>
                {if not isFollowing? then '...' else if isFollowing then 'Following' else 'Not following'}
              </Text>
            </TouchableOpacity>
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
# @ifdef WEB
SiftrInfo = React.createClass
  render: ->
    @props.children
# @endif

SiftrView = React.createClass
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

  getDefaultProps: ->
    isAdmin: false
    onExit: (->)
    onPromptLogin: (->)
    nomenData: null
    clearNomenData: (->)
    following: null
    followGame: (->)
    unfollowGame: (->)

  getInitialState: ->
    center:
      lat: @props.game.latitude
      lng: @props.game.longitude
    # @ifdef NATIVE
    delta: do =>
      # more research needed, this is a hack
      delta = 26 / (2 ** (@props.game.zoom - 4))
      delta = Math.min(90, delta)
      lat: delta
      lng: delta
    # @endif
    # @ifdef WEB
    zoom: @props.game.zoom
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
    primaryMap: true
    fields: null
    infoOpen: false
    primaryMenuOpen: false

  componentWillMount: ->
    @isMounted = true
    # @ifdef NATIVE
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
        @setState allNotes:
          deserializeNote(note) for note in JSON.parse notes
    @hardwareBack = =>
      if @state.searchOpen
        if @isMounted then @setState searchOpen: false
      else
        @props.onExit()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack
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
    # @endif
    if @props.nomenData?
      @applyNomenData @props.nomenData

  componentDidMount: ->
    @nomenTimer = setInterval =>
      @checkNomenFieldData()
    , 1000

  componentWillUnmount: ->
    @isMounted = false
    clearInterval @nomenTimer
    # @ifdef NATIVE
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack
    # @endif

  componentWillReceiveProps: (nextProps) ->
    if @props.auth.authToken?.user_id isnt nextProps.auth.authToken?.user_id
      # if we log in or out, reload the note search
      @loadResults nextProps.auth
      if @state.viewingNote? and @props.auth.authToken?
        # if we were logged in, close the open note
        if @isMounted then @setState viewingNote: null
      if not nextProps.auth.authToken?
        # cancel note creation on logout
        if @isMounted then @setState createNote: null
    if not @props.nomenData? and nextProps.nomenData?
      @applyNomenData nextProps.nomenData

  applyNomenData: (nomenData) ->
    if @state.createNote?
      # continue note filling in data
      if @isMounted then @setState {nomenData}
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
          if @isMounted then @setState
            nomenData: null
            createNote: update @state.createNote,
              field_data: $set: field_data
      else
        if @isMounted then @setState nomenData: null

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

  commonSearchParams: (auth = @props.auth) ->
    game_id: @props.game.game_id
    min_latitude: @state.bounds?.se?.lat
    max_latitude: @state.bounds?.nw?.lat
    min_longitude: @state.bounds?.nw?.lng
    max_longitude: @state.bounds?.se?.lng
    search: @state.searchParams.text ? ''
    order: @state.searchParams.sort ? 'recent'
    filter: if auth.authToken? and @state.searchParams.mine then 'mine' else undefined
    tag_ids: @state.searchParams.tags ? undefined
    min_time: timeToARIS @state.searchParams.min_time
    max_time: timeToARIS @state.searchParams.max_time
    zoom:
      # @ifdef NATIVE
      do =>
        return 1 unless @state.bounds?
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
      if @isMounted then @setState
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
    params = update @commonSearchParams(),
      offset: $set: currentNotes.length
      map_data: $set: false
      limit: $set: 50
    @lastResultsXHR = @props.auth.siftrSearch params
    , withSuccess ({notes}) =>
      @lastResultsXHR = null
      @loading = false
      if @isMounted then @setState
        notes: currentNotes.concat notes
        loadedAll: notes.length < 50

  moveMap: (obj) ->
    if @isMounted then @setState obj, => @loadResults()

  loadNoteByID: (note_id) ->
    @props.auth.searchNotes
      game_id: @props.game.game_id
      note_id: note_id
    , withSuccess (data) => if @isMounted then @setState viewingNote: data[0]

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
    />

  renderNoteView: ->
    if @state.viewingNote?
      <SiftrNoteView
        ref={(noteView) => @noteView = noteView}
        note={@state.viewingNote}
        onClose={=> if @isMounted then @setState viewingNote: null}
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
          pin = new Note
          pin.note_id = 0
          pin.latitude = @state.center.lat
          pin.longitude = @state.center.lng
          pin.description = @state.createNote.caption
          pin.tag_id = @state.tags[0]
          [pin]
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
    return unless @isMounted
    goToCenter = (center) =>
      @setState {center}
      @refs.theSiftrMap?.moveToPoint center
    # first use provided center
    if center?
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
    # @ifdef NATIVE
    else unless @state.createNote.media? or @state.createNote.file? or @state.createNote.uploading
      <CreateStep1
        auth={@props.auth}
        game={@props.game}
        onCancel={=> @setState createNote: null}
        onStartUpload={=> @setState createNote: {
          uploading: true
          caption: ''
          location: @state.center
          category: @state.tags[0]
          field_data: []
          online: true
        }}
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
            caption: @state.createNote?.caption ? ''
            location: @state.createNote?.center ? @state.center
            category: @state.createNote?.category ? @state.tags[0]
            field_data: (@state.createNote?.field_data ? []).concat(fieldMedia)
            online: true
          }
        }
        onStoreMedia={({file}) => @setState createNote: {
          file: file
          caption: ''
          location: @state.center
          category: @state.tags[0]
          field_data: []
          online: false
        }}
        online={@props.online}
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
        onBack={=> @setState createNote: {}}
        getColor={@getColor}
        progress={@state.progress}
      />
    # @endif
    # @ifdef WEB
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
    # @endif

  finishNoteCreation: (field_data = @state.createNote?.field_data ? []) ->
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={
            flexDirection: 'row'
            justifyContent: 'space-between'
            alignItems: 'center'
            backgroundColor: 'white'
          }>
            <TouchableOpacity style={padding: 10} onPress={
              if @state.viewingNote?
                => @setState viewingNote: null
              else if @state.createNote?
                => @setState createNote: null
              else if @state.searchOpen
                => @setState searchOpen: false
              else
                @props.onExit
            }>
              <Image style={resizeMode: 'contain', height: 18} source={require('../web/assets/img/icon-back.png')} />
            </TouchableOpacity>
            <Text>{
              if @state.viewingNote?
                @state.viewingNote.user.display_name
              else if @state.createNote?
                "Posting to: #{@props.game.name}"
              else
                @props.game.name
            }</Text>
            {
              if @state.viewingNote?
                <TouchableOpacity style={padding: 10} onPress={=> @noteView?.openNoteOptions()}>
                  <Image style={resizeMode: 'contain', height: 5} source={require('../web/assets/img/icon-3dots.png')} />
                </TouchableOpacity>
              else
                <TouchableOpacity style={padding: 10} onPress={=> @setState infoOpen: not @state.infoOpen}>
                  <Image style={resizeMode: 'contain', height: 20} source={require('../web/assets/img/icon-4dots.png')} />
                </TouchableOpacity>
            }
          </View>
        </TouchableWithoutFeedback>
        <View style={
          flex: 1
        }>
          {
            if @state.createNote? and not (@state.createNote.media? or @state.createNote.file? or @state.createNote.uploading)
              undefined
            else if @state.primaryMap
              [@renderThumbnails(), @renderMap()]
            else
              [@renderMap(), @renderThumbnails()]
          }
          {@renderNoteView()}
          {@renderCreateNote()}
          {@renderSearch() if @state.searchOpen}
        </View>
        {
          if @state.primaryMenuOpen
            <View style={
              flexDirection: 'row'
              justifyContent: 'space-between'
              alignItems: 'center'
              backgroundColor: 'white'
            }>
              <View style={
                flexDirection: 'row'
                alignItems: 'center'
              }>
                <TouchableOpacity style={padding: 10} onPress={=>
                  @setState primaryMap: true
                }>
                  <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-map.png')} />
                </TouchableOpacity>
                <TouchableOpacity style={padding: 10} onPress={=>
                  @setState primaryMap: false
                }>
                  <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-grid.png')} />
                </TouchableOpacity>
              </View>
              <View style={
                flexDirection: 'row'
                alignItems: 'center'
              }>
                <View style={padding: 6}>
                  <Text>Sort by:</Text>
                </View>
                <TouchableOpacity style={
                  padding: 6
                  borderBottomWidth: 3
                  borderBottomColor: if @state.searchParams.sort is 'recent' then 'black' else 'white'
                } onPress={=>
                  @setState (state) =>
                    update state,
                      searchParams:
                        sort:
                          $set: 'recent'
                  , => @loadResults()
                }>
                  <Text>newest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={
                  padding: 6
                  borderBottomWidth: 3
                  borderBottomColor: if @state.searchParams.sort is 'popular' then 'black' else 'white'
                } onPress={=>
                  @setState (state) =>
                    update state,
                      searchParams:
                        sort:
                          $set: 'popular'
                  , => @loadResults()
                }>
                  <Text>popularity</Text>
                </TouchableOpacity>
              </View>
            </View>
        }
        {
          unless @state.createNote?
            <View style={
              flexDirection: 'row'
              justifyContent: 'space-between'
              alignItems: 'center'
              backgroundColor: 'white'
            }>
              <TouchableOpacity style={padding: 10} onPress={=>
                @setState primaryMenuOpen: not @state.primaryMenuOpen
              }>
                <Image style={resizeMode: 'contain', height: 30} source={
                  if @state.primaryMap
                    require('../web/assets/img/icon-map.png')
                  else
                    require('../web/assets/img/icon-grid.png')
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
exports.SiftrInfo = SiftrInfo
