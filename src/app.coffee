'use strict'

React = require 'react'
T = require 'prop-types'
createClass = require 'create-react-class'

# @ifdef NATIVE
{ View
, TextInput
, TouchableOpacity
, ScrollView
, Image
, ImageBackground
, Linking
, NetInfo
, ActivityIndicator
, StatusBar
, BackHandler
, Platform
, AppState
, Keyboard
, TouchableWithoutFeedback
, Alert
, Dimensions
} = require 'react-native'
import {UploadQueue} from './upload-queue'
import {styles, Text} from './styles'
import {StatusSpace} from './status-space'
import {CacheMedia} from './media'
import {Terms} from './terms'
import {KeyboardAwareView} from 'react-native-keyboard-aware-view'
import RNFS from 'react-native-fs'
import firebase from 'react-native-firebase'
import {
  BrowserSearchPane
, BrowserMine
, BrowserFollowed
, BrowserDownloaded
, BrowserFeatured
, BrowserPopular
, BrowserNearMe
} from './native-browser'
# @endif

{ Auth
, Game
, arisHTTPS
, deserializeGame
, deserializeNote
} = require './aris'

{SiftrView, SiftrInfo} = require './siftr-view'
Photos = require './photos'
# @ifdef WEB
{WebNav} = require './web-nav'
# @endif

{clicker, withSuccess} = require './utils'

{parseUri} = require './parse-uri'

Loading = createClass
  # @ifdef NATIVE
  render: ->
    <View style={flex: 1, backgroundColor: 'rgb(233,240,240)'}>
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
NativeLogin = createClass
  getDefaultProps: ->
    onLogin: (->)
    onRegister: (->)

  getInitialState: ->
    page: 'sign-in'
    keyboard: false
    username: ''
    password: ''
    password2: ''
    email: ''

  doLogin: ->
    @props.onLogin @state.username, @state.password

  doRegister: ->
    if @state.password is ''
      Alert.alert "You must enter a password."
    else if @state.password isnt @state.password2
      Alert.alert "Passwords don't match."
    else
      @props.onRegister @state.username, @state.password, @state.email

  componentWillMount: ->
    @onKeyboardShow = =>
      @setState keyboard: true
    @onKeyboardHide = =>
      @setState keyboard: false
    verb = if Platform.OS is 'ios' then 'Will' else 'Did'
    Keyboard.addListener "keyboard#{verb}Show", @onKeyboardShow
    Keyboard.addListener "keyboard#{verb}Hide", @onKeyboardHide

  componentWillUnmount: ->
    verb = if Platform.OS is 'ios' then 'Will' else 'Did'
    Keyboard.removeListener "keyboard#{verb}Show", @onKeyboardShow
    Keyboard.removeListener "keyboard#{verb}Hide", @onKeyboardHide

  render: ->
    {height} = Dimensions.get 'window'
    tablet = height > 900
    <KeyboardAwareView animated={true} style={
      flex: 1
      flexDirection: 'column'
    }>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={
        if @state.page is 'sign-in'
          require('../web/assets/img/bg1.jpg')
        else
          require('../web/assets/img/bg2.jpg')
      } style={
        flex: if @state.keyboard and not tablet then 0 else 1
        flexDirection: 'column'
        backgroundColor: 'rgba(0,0,0,0)'
        alignItems: 'center'
        justifyContent: 'space-between'
        width: null
        height: null
      }>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={height: 40} />
        </TouchableWithoutFeedback>
        {
          unless @state.keyboard and not tablet
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            </TouchableWithoutFeedback>
        }
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            } onPress={=> @setState
              page: 'sign-in'
              password: ''
              password2: ''
              email: ''
            }>
              <Text style={color: 'white'}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={
              padding: 16
              borderBottomWidth: 7
              borderBottomColor: if @state.page is 'sign-up' then 'white' else 'rgba(0,0,0,0)'
            } onPress={=> @setState
              page: 'sign-up'
              password: ''
              password2: ''
              email: ''
            }>
              <Text style={color: 'white'}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
      {
        switch @state.page
          when 'sign-in'
            <View style={
              flex: 1
              flexDirection: 'column'
            }>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                    onChangeText={(username) => @setState {username}}
                    value={@state.username}
                    onSubmitEditing={=> @passwordBox.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @passwordBox = box}
                    placeholder="Password"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(password) => @setState {password}}
                    value={@state.password}
                    onSubmitEditing={@doLogin}
                    returnKeyType="go"
                  />
                </View>
              </TouchableWithoutFeedback>
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
            <View style={
              flex: 1
              flexDirection: 'column'
            }>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                    onChangeText={(username) => @setState {username}}
                    value={@state.username}
                    onSubmitEditing={=> @passwordBox.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @passwordBox = box}
                    placeholder="Password"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(password) => @setState {password}}
                    value={@state.password}
                    onSubmitEditing={=> @password2Box.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @password2Box = box}
                    placeholder="Password (confirm)"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(password2) => @setState {password2}}
                    value={@state.password2}
                    onSubmitEditing={=> @emailBox.focus()}
                    returnKeyType="next"
                  />
                  <TextInput
                    ref={(box) => @emailBox = box}
                    placeholder="Email (optional)"
                    secureTextEntry={true}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(email) => @setState {email}}
                    value={@state.email}
                    onSubmitEditing={@doRegister}
                    returnKeyType="go"
                  />
                </View>
              </TouchableWithoutFeedback>
              <TouchableOpacity onPress={@doRegister} style={
                backgroundColor: 'rgb(255,124,107)'
                alignItems: 'center'
                justifyContent: 'center'
                paddingTop: 20
                paddingBottom: 20
              }>
                <Text style={color: 'white'}>Create account</Text>
              </TouchableOpacity>
            </View>
      }
    </KeyboardAwareView>

NativePassword = createClass
  getDefaultProps: ->
    onClose: (->)
    onChangePassword: (->)

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
        <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={@props.onClose}>
          <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-back.png')} />
        </TouchableOpacity>
        <View style={flex: 4, alignItems: 'center'}>
          <Text>Change Password</Text>
        </View>
        <View style={flex: 1} />
      </View>
      <ScrollView style={flex: 1}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Current password</Text>
        </View>
        <TextInput
          placeholder="Current password"
          secureTextEntry={true}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @oldPassword = str}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>New password</Text>
        </View>
        <TextInput
          placeholder="New password"
          secureTextEntry={true}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @newPassword1 = str}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>New password, once more</Text>
        </View>
        <TextInput
          placeholder="New password, once more"
          secureTextEntry={true}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @newPassword2 = str}
        />
        <TouchableOpacity style={styles.settingsButton} onPress={=>
          if @newPassword1 is @newPassword2
            @props.onChangePassword
              username: @props.auth.authToken.username
              oldPassword: @oldPassword
              newPassword: @newPassword1
            , (changed) =>
              if changed
                @props.onClose()
              else
                console.warn 'could not change password'
        }>
          <Text>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>

NativeProfile = createClass
  getDefaultProps: ->
    onClose: (->)
    onEditProfile: (->)

  getInitialState: ->
    display_name: @props.auth.authToken.display_name
    url: @props.auth.url
    bio: @props.auth.bio
    currentPicture: null
    newPicture: null
    progress: null

  componentWillMount: ->
    @fetchPicture()

  fetchPicture: ->
    media_id = @props.auth.authToken.media_id
    if media_id?
      @props.auth.call 'media.getMedia',
        media_id: media_id
      , withSuccess (userMedia) =>
        @setState currentPicture:
          uri: userMedia.url.replace('http://', 'https://')
    else
      @setState currentPicture: null

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
        <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={@props.onClose}>
          <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-back.png')} />
        </TouchableOpacity>
        <View style={flex: 4, alignItems: 'center'}>
          <Text>Edit Profile</Text>
        </View>
        <View style={flex: 1} />
      </View>
      <ScrollView style={flex: 1} contentContainerStyle={alignItems: 'stretch'}>
        <View style={
          flexDirection: 'row'
          justifyContent: 'center'
          paddingTop: 15
        }>
          <TouchableOpacity onPress={=>
            return if @state.progress?
            Photos.requestImage (img) =>
              if img?
                @setState newPicture: img
          }>
            {
              if @state.newPicture?
                <Image
                  source={@state.newPicture}
                  style={styles.editProfilePic}
                />
              else if @state.currentPicture?
                <CacheMedia
                  url={@state.currentPicture.uri}
                  withURL={(pic) =>
                    <Image
                      source={if pic? then uri: pic else undefined}
                      style={styles.editProfilePic}
                    />
                  }
                />
              else
                <View
                  style={styles.editProfilePic}
                />
            }
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Username"
          style={styles.input}
          value={@props.auth.authToken.username}
          editable={false}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Display name</Text>
        </View>
        <TextInput
          placeholder="Display name"
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={(str) => @setState display_name: str}
          value={@state.display_name}
          editable={not @state.progress?}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Website</Text>
        </View>
        <TextInput
          placeholder="Website"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(str) => @setState url: str}
          value={@state.url}
          editable={not @state.progress?}
        />
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderText}>Bio</Text>
        </View>
        <TextInput
          placeholder="Bio"
          style={styles.input}
          autoCapitalize="sentences"
          autoCorrect={true}
          onChangeText={(str) => @setState bio: str}
          value={@state.bio}
          editable={not @state.progress?}
        />
        <TouchableOpacity style={styles.settingsButton} onPress={=>
          return if @state.progress?
          @props.onEditProfile
            display_name: @state.display_name
            url: @state.url
            bio: @state.bio
            newPicture: @state.newPicture
          , (progress) =>
            @setState {progress}
          , (changed) =>
            if changed
              @props.onClose()
            else
              console.warn 'could not save profile'
        }>
          <Text>
            {
              if @state.progress?
                "Uploading photo… #{Math.floor(@state.progress * 100)}%"
              else
                "Save"
            }
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>

NativeSettings = createClass
  getInitialState: ->
    setting: null

  getDefaultProps: ->
    onLogout: (->)
    onClose: (->)
    onChangePassword: (->)
    onEditProfile: (->)

  render: ->
    switch @state.setting
      when 'profile'
        <NativeProfile
          onClose={=> @setState setting: null}
          auth={@props.auth}
          onEditProfile={@props.onEditProfile}
        />
      when 'password'
        <NativePassword
          onClose={=> @setState setting: null}
          auth={@props.auth}
          onChangePassword={@props.onChangePassword}
        />
      else
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
            <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={@props.onClose}>
              <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-back.png')} />
            </TouchableOpacity>
            <View style={flex: 4, alignItems: 'center'}>
              <Text>Settings</Text>
            </View>
            <View style={flex: 1} />
          </View>
          <ScrollView style={flex: 1}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsHeaderText}>Account</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={=> @setState setting: 'profile'}>
              <Text>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={=> @setState setting: 'password'}>
              <Text>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={@props.onLogout}>
              <Text>Logout</Text>
            </TouchableOpacity>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsHeaderText}>About</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={=>
              Linking.openURL "https://github.com/fielddaylab/SiftrNative"
            }>
              <Text>Open Source</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={=>
              Linking.openURL "https://docs.google.com/document/d/16P8kIfHka-zHXoQcd9mWlUWiOkaTp6I7UcpD_GoB8LY/edit"
            }>
              <Text>Terms of Use</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={=>
              Linking.openURL "https://docs.google.com/document/d/1yLXB67G0NfIgp0AAsRUQYB7-LoyFsrihUydxsL_qrms/edit"
            }>
              <Text>Privacy Policy</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

NativeHome = createClass
  getInitialState: ->
    discoverPage: if @props.online then null else 'downloaded'
    viewingGameInfo: null
    cardMode: 'full'
    settings: false

  getDefaultProps: ->
    onLogout: (->)
    onSelect: (->)
    mine: null
    followed: null
    followGame: (->)
    unfollowGame: (->)
    onChangePassword: (->)
    onEditProfile: (->)

  componentWillMount: ->
    @choosePage @props

  componentWillReceiveProps: (nextProps) ->
    @choosePage nextProps

  choosePage: (props) ->
    if not @state.discoverPage?
      if props.followed? and props.followed.length
        @setState discoverPage: 'followed'
      else if props.followed? and props.mine? and props.mine.length
        @setState discoverPage: 'mine'
      else if props.followed? and props.mine?
        @setState discoverPage: 'featured'

  render: ->
    isHome     = @state.discoverPage in ['mine', 'followed', 'downloaded'         ] and not @state.settings
    isDiscover = @state.discoverPage in ['featured', 'popular', 'nearme', 'search'] and not @state.settings
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
      {
        if @state.settings
          <NativeSettings
            onClose={=> @setState settings: false}
            onLogout={@props.onLogout}
            auth={@props.auth}
            onChangePassword={@props.onChangePassword}
            onEditProfile={@props.onEditProfile}
          />
        else if not @state.discoverPage?
          <Loading />
        else
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
              <TouchableOpacity style={flex: 1, alignItems: 'flex-start'} onPress={=> @setState discoverPage: 'search'}>
                <Image style={resizeMode: 'contain', height: 20, margin: 10} source={require('../web/assets/img/icon-search.png')} />
              </TouchableOpacity>
              <View style={flex: 4, alignItems: 'center'}>
                <Text>
                  {
                    if isHome then 'Home' else 'Explore'
                  }
                </Text>
              </View>
              <TouchableOpacity style={flex: 1, alignItems: 'flex-end'} onPress={=>
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
              else if isDiscover
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
            <CurrentBrowser
              auth={@props.auth}
              onSelect={@props.onSelect}
              cardMode={@state.cardMode}
              onInfo={(game) => @setState viewingGameInfo: game}
              mine={@props.mine}
              followed={@props.followed}
              online={@props.online}
            />
            <View style={
              flexDirection: 'row'
              justifyContent: 'space-between'
              alignItems: 'center'
            }>
              <TouchableOpacity style={padding: 10} onPress={=>
                if not isHome then @setState discoverPage: 'mine', settings: false
              }>
                <Image style={resizeMode: 'contain', height: 30} source={
                  if isHome
                    require('../web/assets/img/icon-home-selected.png')
                  else
                    require('../web/assets/img/icon-home.png')
                } />
              </TouchableOpacity>
              <TouchableOpacity style={padding: 10} onPress={=>
                if not isDiscover then @setState discoverPage: 'featured', settings: false
              }>
                <Image style={resizeMode: 'contain', height: 24} source={
                  if isDiscover
                    require('../web/assets/img/icon-eye-selected.png')
                  else
                    require('../web/assets/img/icon-eye.png')
                } />
              </TouchableOpacity>
              <TouchableOpacity style={padding: 10} onPress={=> @setState settings: true}>
                <Image style={resizeMode: 'contain', height: 28} source={
                  if @state.settings
                    require('../web/assets/img/icon-user-selected.png')
                  else
                    require('../web/assets/img/icon-user.png')
                } />
              </TouchableOpacity>
            </View>
          </View>
      }
    </SiftrInfo>
# @endif

export SiftrNative = createClass
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

  componentWillUnmount: ->
    NetInfo.removeEventListener 'connectionChange', @withInfo
    Linking.removeEventListener 'url', @urlHandler
    AppState.removeEventListener 'change', @withAppState

  parseURL: (url) ->
    unless url
      @setState
        aris: false
      return
    mapping = {}
    for kv in parseUri(url).query.split('&')
      [k, v] = kv.split('=')
      mapping[k] = v
    siftr_id = parseInt(mapping.siftr_id)
    if siftr_id
      @launchByID
        aris: if parseInt(mapping.aris) then true else false
        siftr_id: siftr_id
        nomen_id: parseInt(mapping.nomen_id)
        species_id: decodeURIComponent((mapping.species_id+'').replace(/\+/g, '%20'))

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

  login: (username, password) ->
    return unless @state.online
    (@state.auth ? new Auth).login username, password, (newAuth, err) =>
      if username? and password? and not newAuth.authToken?
        Alert.alert err.returnCodeDescription
      @setState
        auth: newAuth
        games: null
        followed: null
      # @ifdef WEB
      search = window.location.search
      if search[0] is '?'
        url = search[1..]
        if url.match(/[^0-9]/)
          newAuth.searchSiftrs
            siftr_url: url
          , withSuccess (games) =>
            if games.length is 1
              @setState game: games[0]
        else
          newAuth.getGame
            game_id: parseInt(url)
          , withSuccess (game) =>
            if game?
              @setState {game}
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
    return unless @state.online
    {username, password, email} = @registerInfo
    (@state.auth ? new Auth).register username, password, email, (newAuth, err) =>
      unless newAuth.authToken?
        Alert.alert err.returnCodeDescription
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
      >
        {
          if @state.auth.authToken?
            if @state.game?
              <SiftrView
                game={@state.game}
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
                onViolaIdentify={@props.onViolaIdentify}
                saved_note={@state.saved_note}
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
                onChangePassword={@changePassword}
                onEditProfile={@editProfile}
                queueMessage={@state.queueMessage}
              />
          else if @state.showingTerms
            <Terms
              onAccept={=> @register()}
              onCancel={=> @setState showingTerms: false}
            />
          else
            <NativeLogin onLogin={@login} onRegister={@showTerms} />
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
              onExit={=> @setState game: null}
              onPromptLogin={=> @setState menuOpen: true}
              nomenData={@state.nomenData}
              clearNomenData={@clearNomenData}
              online={@state.online}
              followed={@state.followed}
              followGame={@followGame}
              unfollowGame={@unfollowGame}
            />
        }
      </WebNav>
    else
      <Loading />
  # @endif
