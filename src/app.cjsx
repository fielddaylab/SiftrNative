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

{fitBounds} = require 'google-map-react/utils'

{ Auth
, Game
, Tag
} = require './aris'

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
    @props.auth.siftrSearch
      game_id: @props.game.game_id
      note_id: note_id
      map_data: false
    , withSuccess (data) => @selectNote data.notes[0]

  selectNote: (note) ->
    @setState viewingNote: note

  deleteNote: (note) ->
    @props.auth.call 'notes.deleteNote',
      note_id: note.note_id
    , withSuccess =>
      @setState viewingNote: null
      @loadResults()

  renderNoteView: ->
    if @state.viewingNote?
      <SiftrNoteView
        note={@state.viewingNote}
        onClose={=> @setState viewingNote: null}
        auth={@props.auth}
        onDelete={@deleteNote}
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
        onCreateMedia={(media) => @setState createNote: {media}}
      />
    else unless @state.createNote.caption?
      <CreateStep2
        onEnterCaption={(caption) => @setState createNote:
          media: @state.createNote.media
          caption: caption
        }
        onCancel={=> @setState createNote: null}
        onBack={=> @setState createNote: {}}
        defaultCaption={@state.createNote.defaultCaption}
      />
    else unless @state.createNote.location?
      <CreateStep3
        onPickLocation={(caption) => @setState createNote:
          media: @state.createNote.media
          caption: @state.createNote.caption
          location: @state.center
        }
        onCancel={=> @setState createNote: null}
        onBack={=> @setState createNote:
          media: @state.createNote.media
          defaultCaption: @state.createNote.caption
        }
      />
    else
      <CreateStep4
        categories={@state.tags ? []}
        onPickCategory={@finishNoteCreation}
        onCancel={=> @setState createNote: null}
        onBack={=> @setState createNote:
          media: @state.createNote.media
          caption: @state.createNote.caption
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
      {@renderMap()}
      {@renderThumbnails()}
      {@renderNoteView()}
      {@renderCreateNote()}
    </DIV>

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
          <button type="button" onClick={clicker @props.onLogout}>Logout</button>
        </p>
        {@props.children}
      </div>

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
      <ScrollView>
        {
          @props.games.map (game) =>
            <TouchableOpacity key={game.game_id} onPress={=> @props.onSelect game}>
              <Text>
                {game.name}
              </Text>
            </TouchableOpacity>
        }
      </ScrollView>
    else
      <Text>Loading games...</Text>
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

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  findSiftr: ->
    url = @refs.inputText.value
    return unless url?
    @props.auth.searchSiftrs
      siftr_url: url
    , withSuccess (games) =>
      if games.length is 1
        @props.onSelect games[0]

  handleEnter: (e) ->
    @findSiftr() if e.keyCode is 13

  render: ->
    <p>
      <input
        ref="inputText"
        type="text"
        onKeyDown={@handleEnter}
        placeholder="Enter a Siftr URL"
      />
      {' '}
      <BUTTON onClick={@findSiftr}>Submit</BUTTON>
    </p>
  # @endif

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
          <button type="button" onClick={clicker @doLogin}>Login</button>
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

SiftrNative = React.createClass
  getInitialState: ->
    auth: null
    games: null
    game: null

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
          {
            if @state.game?
              <SiftrView game={@state.game} auth={@state.auth} onExit={=> @setState game: null} />
            else
              <DIV>
                <GameList games={@state.games} onSelect={(game) => @setState {game}} />
                <SiftrURL auth={@state.auth} onSelect={(game) => @setState {game}} />
              </DIV>
          }
        </LoggedInContainer>
      else
        <LoginBox onLogin={@login} />
    else
      <Loading />

exports.SiftrNative = SiftrNative
