'use strict'

React = require 'react'
T = require 'prop-types'
createClass = require 'create-react-class'
update = require 'immutability-helper'

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
import {styles, Text} from './styles'
import {StatusSpace} from './status-space'
import {CacheMedia} from './media'

Photos = require './photos'

{withSuccess} = require './utils'

NativePassword = createClass
  displayName: 'NativePassword'
  getDefaultProps: ->
    onClose: (->)
    onChangePassword: (->)

  componentWillMount: ->
    @hardwareBack = =>
      @props.onClose()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

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
  displayName: 'NativeProfile'
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
    @hardwareBack = =>
      @props.onClose()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

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

export NativeSettings = createClass
  displayName: 'NativeSettings'
  getInitialState: ->
    setting: null

  getDefaultProps: ->
    onLogout: (->)
    onClose: (->)
    onChangePassword: (->)
    onEditProfile: (->)

  componentWillMount: ->
    @hardwareBack = =>
      @props.onClose()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

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
