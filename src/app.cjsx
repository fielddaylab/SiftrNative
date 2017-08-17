'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
, TextInput
, TouchableOpacity
, ScrollView
, Image
, Linking
, NetInfo
, ActivityIndicator
, StatusBar
} = require 'react-native'
{UploadQueue} = require './upload-queue'
{styles} = require './styles'
{StatusSpace} = require './status-space'
{KeyboardAwareView} = require 'react-native-keyboard-aware-view'
RNFS = require 'react-native-fs'
# @endif

{ Auth
, Game
, arisHTTPS
, deserializeGame
} = require './aris'

{SiftrView, SiftrInfo} = require './siftr-view'
{GameList, SiftrURL} = require './siftr-browser'

{clicker, withSuccess, DIV, P, BUTTON} = require './utils'

{parseUri} = require './parse-uri'

AuthContainer = React.createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    onLogin: T.func
    onLogout: T.func
    hasBrowserButton: T.bool
    onBrowserButton: T.func
    menuOpen: T.bool
    onMenuMove: T.func
    online: T.bool

  getDefaultProps: ->
    onLogin: (->)
    onLogout: (->)
    hasBrowserButton: false
    onBrowserButton: (->)
    menuOpen: false
    onMenuMove: (->)

  getInitialState: ->
    hasBrowserButton: false
    onBrowserButton: (->)
    userPicture: null

  goBackToBrowser: ->
    @props.onMenuMove false
    @props.onBrowserButton()

  componentWillMount: ->
    @fetchPicture()

  componentWillReceiveProps: (nextProps) ->
    if @props.auth isnt nextProps.auth
      @fetchPicture nextProps.auth

  fetchPicture: (auth = @props.auth) ->
    media_id = auth.authToken?.media_id
    unless media_id?
      @setState userPicture: null
      return
    if @props.online
      @props.auth.call 'media.getMedia',
        media_id: media_id
      , withSuccess (userPicture) =>
        @setState {userPicture}

  # @ifdef NATIVE
  render: ->
    null # removed
  # @endif

  # @ifdef WEB
  render: ->
    <div className={"auth-container #{if @props.menuOpen then 'auth-menu-open' else 'auth-menu-closed'}"}>
      <div className="auth-nav">
        <a href="#"
          onClick={clicker => @props.onMenuMove not @props.menuOpen}
          className="auth-nav-button"
        ><img src="assets/img/menu.png" /></a>
        <span>
        {
          if @props.auth.authToken?
            " Logged in as #{@props.auth.authToken.display_name}"
          else
            " Log in"
        }
        </span>
      </div>
      <div className="auth-contents">
        {@props.children}
      </div>
      <div className="auth-menu">
        {
          if @props.auth.authToken?
            <div>
              <div className="auth-menu-user-picture" style={
                backgroundImage:
                  if (url = @state.userPicture?.big_thumb_url)
                    "url(#{arisHTTPS url})"
              } />
              <p>
                {@props.auth.authToken.display_name}
              </p>
              <p>
                <button type="button" onClick={@props.onLogout}>Logout</button>
              </p>
            </div>
          else
            <LoginBox onLogin={@props.onLogin} />
        }
        {
          if @props.hasBrowserButton
            <p>
              <button type="button" onClick={@goBackToBrowser}>Back to Browser</button>
            </p>
        }
      </div>
    </div>
  # @endif

LoginBox = React.createClass
  propTypes:
    onLogin: T.func

  doLogin: ->
    if @props.onLogin?
      # @ifdef NATIVE
      @props.onLogin @username, @password
      # @endif
      # @ifdef WEB
      @props.onLogin @refs.username.value, @refs.password.value
      # @endif

  handleEnter: (e) ->
    @doLogin() if e.keyCode is 13

  # @ifdef NATIVE
  render: ->
    <View>
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
        <Text style={[styles.blueButton, margin: 10]}>Login</Text>
      </TouchableOpacity>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <form>
      <p>
        <input
          placeholder="Username"
          type="text"
          ref="username"
          onKeyDown={@handleEnter}
          className="login-field"
        />
      </p>
      <p>
        <input
          placeholder="Password"
          type="password"
          ref="password"
          onKeyDown={@handleEnter}
          className="login-field"
        />
      </p>
      <p>
        <button type="button" onClick={clicker @doLogin}>Login</button>
      </p>
    </form>
  # @endif

Loading = React.createClass
  # @ifdef NATIVE
  render: ->
    <View style={flex: 1}>
      <StatusSpace />
      <View style={flex: 1, alignItems: 'center', justifyContent: 'center'}>
        <ActivityIndicator size="large" />
      </View>
    </View>
  # @endif
  # @ifdef WEB
  render: ->
    <p>Loading...</p>
  # @endif

# @ifdef NATIVE
NativeLogin = React.createClass
  getDefaultProps: ->
    onLogin: (->)

  getInitialState: ->
    page: 'sign-in'

  doLogin: ->
    @props.onLogin @username, @password

  componentWillMount: ->
    @username = ''
    @password = ''

  render: ->
    <KeyboardAwareView style={
      flex: 1
      flexDirection: 'column'
    }>
      <StatusBar barStyle="light-content" />
      <Image source={
        if @state.page is 'sign-in'
          require('../web/assets/img/bg1.jpg')
        else
          require('../web/assets/img/bg2.jpg')
      } style={
        flex: 1
        flexDirection: 'column'
        backgroundColor: 'rgba(0,0,0,0)'
        alignItems: 'center'
        justifyContent: 'space-between'
        width: null
        height: null
      }>
        <View style={height: 40} />
        <View style={
          flexDirection: 'column'
          alignItems: 'center'
        }>
          <Image source={require('../web/assets/img/siftr-logo.png')} style={
            width: 190 * 0.5
            height: 196 * 0.5
            marginBottom: 20
          } />
          <Text style={color: 'white'}>Exploring our world together</Text>
        </View>
        <View style={
          flexDirection: 'row'
          alignItems: 'flex-end'
          justifyContent: 'space-around'
          alignSelf: 'stretch'
        }>
          <TouchableOpacity style={
            padding: 16
            borderBottomWidth: 7
            borderBottomColor: if @state.page is 'sign-in' then 'white' else 'rgba(0,0,0,0)'
          } onPress={=> @setState page: 'sign-in'}>
            <Text style={color: 'white'}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={
            padding: 16
            borderBottomWidth: 7
            borderBottomColor: if @state.page is 'sign-up' then 'white' else 'rgba(0,0,0,0)'
          } onPress={=> @setState page: 'sign-up'}>
            <Text style={color: 'white'}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Image>
      {
        switch @state.page
          when 'sign-in'
            <View style={
              flex: 1
              flexDirection: 'column'
            }>
              <View style={
                flex: 1
                justifyContent: 'center'
                alignItems: 'stretch'
              }>
                <TextInput
                  placeholder="Username"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                  onChangeText={(username) => @username = username}
                  defaultValue={@username}
                />
                <TextInput
                  placeholder="Password"
                  secureTextEntry={true}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(password) => @password = password}
                  defaultValue={@password}
                />
              </View>
              <TouchableOpacity onPress={@doLogin} style={
                backgroundColor: 'rgb(255,124,107)'
                alignItems: 'center'
                justifyContent: 'center'
                paddingTop: 20
                paddingBottom: 20
              }>
                <Text style={color: 'white'}>Log in</Text>
              </TouchableOpacity>
            </View>
          when 'sign-up'
            <View style={flex: 1} />
      }
    </KeyboardAwareView>

NativeCard = React.createClass
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
      @setState
        authors:
          author.display_name for author in authors
    @props.auth.searchNotes
      game_id: @props.game.game_id
    , withSuccess (notes) =>
      return unless @isMounted
      @setState
        photos:
          for note in notes.slice(8)
            continue unless note.thumb_url?
            url: note.thumb_url
            note_id: note.note_id
        posts: notes.length
        contributors: do =>
          user_ids = {}
          for note in notes
            user_ids[note.user.user_id] = true
            for comment in note.comments
              user_ids[comment.user.user_id] = true
          Object.keys(user_ids).length

  componentWillUnmount: ->
    @isMounted = false

  render: ->
    switch @props.cardMode
      when 'full'
        <TouchableOpacity onPress={@props.onSelect} style={
          backgroundColor: 'white'
          margin: 12
          marginBottom: 0
          borderRadius: 12
        }>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View>
              <Text>{@props.game.name}</Text>
              <Text>{@state.authors?.join(', ') ? '…'}</Text>
            </View>
            <TouchableOpacity style={padding: 10} onPress={->}>
              <Image source={require('../web/assets/img/icon-3dots.png')} style={width: 34 * 0.6, height: 8 * 0.6, resizeMode: 'contain'} />
            </TouchableOpacity>
          </View>
          <View style={flexDirection: 'row', overflow: 'hidden'}>
            {
              if @state.photos?
                for {url, note_id} in @state.photos
                  <Image key={note_id} source={uri: url} style={height: 100, width: 100} />
              else
                <View style={height: 100, width: 100} />
            }
          </View>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View>
              <Text>{@state.contributors ? '…'} contributors</Text>
              <Text>{@state.posts ? '…'} posts</Text>
            </View>
            <TouchableOpacity style={padding: 10} onPress={@props.onInfo}>
              <Image source={require('../web/assets/img/icon-4dots.png')} style={width: 38 * 0.7, height: 40 * 0.7, resizeMode: 'contain'} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      when 'compact'
        <TouchableOpacity onPress={@props.onSelect} style={
          backgroundColor: 'white'
          margin: 12
          marginBottom: 0
          borderRadius: 12
        }>
          <View style={flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center'}>
            <View>
              <Text>{@props.game.name}</Text>
              <Text>{@state.authors?.join(', ') ? '…'}</Text>
            </View>
            <TouchableOpacity style={padding: 10} onPress={@props.onInfo}>
              <Image source={require('../web/assets/img/icon-4dots.png')} style={width: 38 * 0.7, height: 40 * 0.7, resizeMode: 'contain'} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

BrowserList = React.createClass
  getDefaultProps: ->
    onSelect: (->)
    onInfo: (->)
    cardMode: 'full'

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
            />
        }
      </ScrollView>
    else
      <View style={flex: 1, alignItems: 'center', justifyContent: 'center'}>
        <ActivityIndicator size="large" />
      </View>

makeBrowser = (getGames) ->
  React.createClass
    getDefaultProps: ->
      onSelect: (->)
      onInfo: (->)
      cardMode: 'full'

    getInitialState: ->
      games: null

    componentWillMount: ->
      @isMounted = true
      @updateGames()

    componentWillUnmount: ->
      @isMounted = false

    updateGames: (props = @props) ->
      thisSearch = @lastSearch = Date.now()
      getGames props, (games) =>
        return unless @isMounted
        return unless thisSearch is @lastSearch
        @setState {games}

    componentWillReceiveProps: (newProps) ->
      if not @props.auth? or ['auth', 'search', 'mine', 'followed'].some((x) => @props[x] isnt newProps[x])
        @updateGames newProps

    render: ->
      <BrowserList auth={@props.auth} games={@state.games} onSelect={@props.onSelect} onInfo={@props.onInfo} cardMode={@props.cardMode} />

BrowserSearch = makeBrowser (props, cb) =>
  if props.search is ''
    cb []
  else
    props.auth.searchSiftrs
      search: props.search
      count: 10
    , withSuccess (games) =>
      cb games

BrowserSearchPane = React.createClass
  getInitialState: ->
    search: ''

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
      <BrowserSearch auth={@props.auth} onSelect={@props.onSelect} onInfo={@props.onInfo} search={@state.search} />
    </View>

BrowserMine = makeBrowser (props, cb) =>
  cb props.mine

BrowserFollowed = makeBrowser (props, cb) =>
  cb props.followed

BrowserDownloaded = makeBrowser (props, cb) =>
  siftrsDir = "#{RNFS.DocumentDirectoryPath}/siftrs"
  RNFS.exists(siftrsDir).then (dirExists) =>
    if dirExists
      RNFS.readDir(siftrsDir).then (files) =>
        proms = for f in files
          game_id = parseInt f.name
          continue unless game_id and f.isDirectory()
          RNFS.readFile "#{siftrsDir}/#{game_id}/game.txt"
        Promise.all(proms).then (games) =>
          cb( deserializeGame(JSON.parse game) for game in games )
    else
      cb []

BrowserFeatured = makeBrowser (props, cb) =>
  cb null

BrowserPopular = makeBrowser (props, cb) =>
  props.auth.searchSiftrs
    count: 20 # TODO infinite scroll
    offset: 0
    order_by: 'popular'
  , withSuccess cb

BrowserNearMe = makeBrowser (props, cb) =>
  cb null

NativeHome = React.createClass
  getInitialState: ->
    discoverPage: 'mine'
    viewingGameInfo: null
    cardMode: 'full'

  getDefaultProps: ->
    onLogout: (->)
    onSelect: (->)
    mine: null
    followed: null
    followGame: (->)
    unfollowGame: (->)

  render: ->
    isHome = @state.discoverPage in ['mine', 'followed', 'downloaded']
    CurrentBrowser = switch @state.discoverPage
      when 'mine'       then BrowserMine
      when 'followed'   then BrowserFollowed
      when 'downloaded' then BrowserDownloaded
      when 'featured'   then BrowserFeatured
      when 'popular'    then BrowserPopular
      when 'nearme'     then BrowserNearMe
      when 'search'     then BrowserSearchPane

    <SiftrInfo
      game={@state.viewingGameInfo}
      isOpen={@state.viewingGameInfo?}
      onChange={(b) => if not b then @setState viewingGameInfo: null}
      followed={@props.followed}
      followGame={=> @props.followGame @state.viewingGameInfo}
      unfollowGame={=> @props.unfollowGame @state.viewingGameInfo}
    >
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
          <TouchableOpacity style={padding: 10} onPress={=> @setState discoverPage: 'search'}>
            <Image style={resizeMode: 'contain', height: 20} source={require('../web/assets/img/icon-search.png')} />
          </TouchableOpacity>
          <Text>
            {
              if isHome then 'Home' else 'Explore'
            }
          </Text>
          <TouchableOpacity style={padding: 0} onPress={=>
            @setState cardMode:
              if @state.cardMode is 'full'
                'compact'
              else
                'full'
          }>
            <Image style={resizeMode: 'contain', height: 20} source={
              if @state.cardMode is 'full'
                require('../web/assets/img/icon-cards.png')
              else
                require('../web/assets/img/icon-compact.png')
            } />
          </TouchableOpacity>
        </View>
        {
          if isHome
            <View style={flexDirection: 'row'}>
              <TouchableOpacity key={1} onPress={=> @setState discoverPage: 'mine'} style={
                if @state.discoverPage is 'mine' then styles.exploreTabOn else styles.exploreTabOff
              }>
                <Text style={
                  color: if @state.discoverPage is 'mine' then 'black' else '#B8B8B8'
                }>Mine</Text>
              </TouchableOpacity>
              <TouchableOpacity key={2} onPress={=> @setState discoverPage: 'followed'} style={
                if @state.discoverPage is 'followed' then styles.exploreTabOn else styles.exploreTabOff
              }>
                <Text style={
                  color: if @state.discoverPage is 'followed' then 'black' else '#B8B8B8'
                }>Followed</Text>
              </TouchableOpacity>
              <TouchableOpacity key={3} onPress={=> @setState discoverPage: 'downloaded'} style={
                if @state.discoverPage is 'downloaded' then styles.exploreTabOn else styles.exploreTabOff
              }>
                <Text style={
                  color: if @state.discoverPage is 'downloaded' then 'black' else '#B8B8B8'
                }>Downloaded</Text>
              </TouchableOpacity>
            </View>
          else
            <View style={flexDirection: 'row'}>
              <TouchableOpacity onPress={=> @setState discoverPage: 'featured'} style={
                if @state.discoverPage is 'featured' then styles.exploreTabOn else styles.exploreTabOff
              }>
                <Text style={
                  color: if @state.discoverPage is 'featured' then 'black' else '#B8B8B8'
                }>Featured</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={=> @setState discoverPage: 'popular'} style={
                if @state.discoverPage is 'popular' then styles.exploreTabOn else styles.exploreTabOff
              }>
                <Text style={
                  color: if @state.discoverPage is 'popular' then 'black' else '#B8B8B8'
                }>Popular</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={=> @setState discoverPage: 'nearme'} style={
                if @state.discoverPage is 'nearme' then styles.exploreTabOn else styles.exploreTabOff
              }>
                <Text style={
                  color: if @state.discoverPage is 'nearme' then 'black' else '#B8B8B8'
                }>Near Me</Text>
              </TouchableOpacity>
            </View>
        }
        <CurrentBrowser
          auth={@props.auth}
          onSelect={@props.onSelect}
          cardMode={@state.cardMode}
          onInfo={(game) => @setState viewingGameInfo: game}
          mine={@props.mine}
          followed={@props.followed}
        />
        <View style={
          flexDirection: 'row'
          justifyContent: 'space-between'
          alignItems: 'center'
        }>
          <TouchableOpacity style={padding: 10} onPress={=>
            if not isHome then @setState discoverPage: 'mine'
          }>
            <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-home.png')} />
          </TouchableOpacity>
          <TouchableOpacity style={padding: 10} onPress={=>
            if isHome then @setState discoverPage: 'featured'
          }>
            <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-eye.png')} />
          </TouchableOpacity>
          <TouchableOpacity style={padding: 10} onPress={@props.onLogout}>
            <Image style={resizeMode: 'contain', height: 30} source={require('../web/assets/img/icon-user.png')} />
          </TouchableOpacity>
        </View>
      </View>
    </SiftrInfo>
# @endif

SiftrNative = React.createClass
  getInitialState: ->
    auth: null
    games: null
    followed: null
    game: null
    menuOpen: false
    online: true

  # @ifdef WEB
  componentWillMount: ->
    @login()
  # @endif

  # @ifdef NATIVE
  componentDidMount: ->
    Linking.getInitialURL().then (url) =>
      @parseURL(url) if url
      @urlHandler = ({url}) => @parseURL(url)
      Linking.addEventListener 'url', @urlHandler
    @withReach = (reach) =>
      online = reach not in ['none', 'NONE']
      @setState {online}, =>
        if online
          @login()
        else if not @state.auth?
          new Auth().loadSavedAuth (authToken) =>
            @setState auth: Object.assign new Auth, {authToken}
    NetInfo.fetch().done @withReach
    NetInfo.addEventListener 'change', @withReach

  componentWillUnmount: ->
    NetInfo.removeEventListener 'change', @withReach
    Linking.removeEventListener 'url', @urlHandler

  parseURL: (url) ->
    mapping = {}
    for kv in parseUri(url).query.split('&')
      [k, v] = kv.split('=')
      mapping[k] = v
    siftr_id = parseInt(mapping.siftr_id)
    nomen_id = parseInt(mapping.nomen_id)
    species_id = decodeURIComponent((mapping.species_id+'').replace(/\+/g, '%20'))
    if siftr_id
      @launchByID {siftr_id, nomen_id, species_id}

  launchByID: ({siftr_id, nomen_id, species_id}) ->
    return if @state.game?.game_id is siftr_id
    (@state.auth ? new Auth).getGame
      game_id: siftr_id
    , withSuccess (game) =>
      @setState
        game: game
        nomenData: {nomen_id, species_id}

  clearNomenData: ->
    @setState nomenData: null
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

  login: (username, password) ->
    return unless @state.online
    (@state.auth ? new Auth).login username, password, (newAuth, err) =>
      if username? and password? and not newAuth.authToken?
        console.warn err
      @setState
        auth: newAuth
        games: null
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

  # @ifdef NATIVE
  render: ->
    if @state.auth?
      <UploadQueue auth={@state.auth} online={@state.online}>
        {
          if @state.auth.authToken?
            if @state.game?
              <SiftrView
                game={@state.game}
                auth={@state.auth}
                isAdmin={@gameBelongsToUser @state.game}
                onExit={=> @setState game: null}
                onPromptLogin={=> @setState menuOpen: true}
                nomenData={@state.nomenData}
                clearNomenData={@clearNomenData}
                online={@state.online}
                followed={@state.followed}
                followGame={@followGame}
                unfollowGame={@unfollowGame}
              />
            else
              <NativeHome
                auth={@state.auth}
                onLogout={@logout}
                onSelect={(game) => @setState {game}}
                online={@state.online}
                mine={@state.games}
                followed={@state.followed}
                followGame={@followGame}
                unfollowGame={@unfollowGame}
              />
          else
            <NativeLogin onLogin={@login} />
        }
      </UploadQueue>
    else
      <Loading />
  # @endif

  # @ifdef WEB
  render: ->
    if @state.auth?
      <AuthContainer
        auth={@state.auth} onLogin={@login} onLogout={@logout}
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
              onExit={=> @setState game: null}
              onPromptLogin={=> @setState menuOpen: true}
              nomenData={@state.nomenData}
              clearNomenData={@clearNomenData}
              online={@state.online}
            />
        }
        {
          unless @state.game?
            <GameList games={
              if @state.auth.authToken?
                @state.games
              else
                []
            } onSelect={(game) => @setState {game}} online={@state.online} />
        }
        {
          unless @state.game?
            <SiftrURL auth={@state.auth} onSelect={(game) => @setState {game}} />
        }
      </AuthContainer>
    else
      <Loading />
  # @endif

exports.SiftrNative = SiftrNative
