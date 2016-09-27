'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
, TextInput
} = require 'react-native'
{styles} = require './styles'
# @endif

{fitBounds} = require 'google-map-react/utils'

{ Auth
, Game
, Tag
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

  getDefaultProps: ->
    isAdmin: false
    onExit: (->)

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
    results: null
    tags: null
    colors: null
    viewingNote: null
    createNote: null
    searchParams: {}

  componentWillMount: ->
    @props.auth.getTagsForGame
      game_id: @props.game.game_id
    , withSuccess (tags) =>
      @setState {tags}
    @props.auth.getColors
      colors_id: @props.game.colors_id ? 1
    , withSuccess (colors) =>
      @setState {colors}

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

  loadResults: ->
    @props.auth.siftrSearch
      game_id: @props.game.game_id
      min_latitude: @state.bounds.se.lat
      max_latitude: @state.bounds.nw.lat
      min_longitude: @state.bounds.nw.lng
      max_longitude: @state.bounds.se.lng
      search: @state.searchParams.text ? ''
      order: @state.searchParams.sort ? 'recent'
      filter: if @state.searchParams.mine ? false then 'mine' else undefined
      tag_ids: @state.searchParams.tags ? undefined
      min_time: timeToARIS @state.searchParams.min_time
      max_time: timeToARIS @state.searchParams.max_time
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

  loadNoteByID: (note_id) ->
    @props.auth.searchNotes
      game_id: @props.game.game_id
      note_id: note_id
    , withSuccess (data) => @setState viewingNote: data[0]

  selectNote: (note) ->
    @loadNoteByID note.note_id

  deleteNote: (note) ->
    @props.auth.call 'notes.deleteNote',
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
    />

  renderNoteView: ->
    if @state.viewingNote?
      <SiftrNoteView
        note={@state.viewingNote}
        onClose={=> @setState viewingNote: null}
        auth={@props.auth}
        onDelete={@deleteNote}
        onReload={(note) => @loadNoteByID note.note_id}
        isAdmin={@props.isAdmin}
      />
    else
      if window.isNative
        <Text>No note open.</Text>
      else
        <p>No note open.</p>

  renderMap: ->
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
      getColor={@getColor}
      onSelectNote={@selectNote}
    />

  renderThumbnails: ->
    <SiftrThumbnails
      notes={@state.results?.notes}
      getColor={@getColor}
      onSelectNote={@selectNote}
    />

  startLocatingNote: ({exif, center}) ->
    # first use provided center
    if center?
      @setState center: center
      return
    # then get location from exif
    lat = exif.GPSLatitude
    lng = exif.GPSLongitude
    console.log exif
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

  renderCreateNote: ->
    unless @state.createNote?
      if @props.auth.authToken?
        <BUTTON onClick={=> @setState createNote: {}}>
          <P>Upload Photo</P>
        </BUTTON>
      else
        <P>Log in to upload a photo.</P>
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
        onPickCategory={@finishNoteCreation}
        onCancel={=> @setState createNote: null}
        onBack={=>
          @setState
            createNote:
              media: @state.createNote.media
              caption: @state.createNote.caption
          , => @startLocatingNote center: @state.createNote.location
        }
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
      @loadResults()
      @loadNoteByID note.note_id

  render: ->
    <DIV>
      <BUTTON onClick={@props.onExit}>
        <P>Back to Siftrs</P>
      </BUTTON>
      {@renderSearch()}
      {@renderMap()}
      {@renderThumbnails()}
      {@renderNoteView()}
      {@renderCreateNote()}
    </DIV>

exports.SiftrView = SiftrView
