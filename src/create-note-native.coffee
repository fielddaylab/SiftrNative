'use strict'

import React from 'react'
import T from 'prop-types'
import update from 'immutability-helper'
import { Map, Set } from 'immutable'
import createClass from 'create-react-class'

import { Image
, View
, TextInput
, Picker
, TouchableOpacity
, ActivityIndicator
, ScrollView
, Switch
, Linking
, BackHandler
, CameraRoll
, ListView
, TouchableWithoutFeedback
, Keyboard
, Alert
} from 'react-native'
import {styles, Text} from './styles'
import Camera from 'react-native-camera'
import InfiniteScrollView from 'react-native-infinite-scroll-view'
import firebase from 'react-native-firebase'
import Geocoder from 'react-native-geocoder'
import Permissions from 'react-native-permissions'

import {Auth, Game, Tag, Field, FieldData} from './aris'

class SiftrRoll extends React.Component
  constructor: (props) ->
    super(props)
    this.state =
      photos: []
      canLoadMore: true
      dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1[0] != r2[0]})

  componentWillMount: ->
    @getMorePhotos()

  getMorePhotos: ->
    thisGet = this.lastGet = Date.now()
    CameraRoll.getPhotos
      first: 20
      after: this.state.photoCursor
      assetType: 'Photos'
    .then (result) =>
      return unless thisGet is this.lastGet
      if result.edges.length > 0
        @setState
          photos: @state.photos.concat result.edges.map ({node}) => [node.image.uri, node.location]
          photoCursor: result.page_info.end_cursor
          canLoadMore: result.page_info.has_next_page
      else
        @setState canLoadMore: false

  render: ->
    <ListView
      style={flex: 1}
      contentContainerStyle={
        flexDirection: 'row'
        flexWrap: 'wrap'
        alignItems: 'center'
        justifyContent: 'center'
      }
      enableEmptySections={true}
      renderScrollComponent={(props) => <InfiniteScrollView {...props} />}
      dataSource={this.state.dataSource.cloneWithRows(this.state.photos)}
      renderRow={([uri, location]) =>
        <TouchableOpacity onPress={=> this.props.onSelectImage uri, location}>
          <Image source={
            uri: uri
          } style={
            width: 160
            height: 160
            margin: 5
          } />
        </TouchableOpacity>
      }
      canLoadMore={@state.canLoadMore}
      onLoadMoreAsync={=> @getMorePhotos()}
    />

SiftrRoll.defaultProps =
  onSelectImage: (->)

# photo taker on native: takes a single photo at a time
export CreatePhoto = createClass
  displayName: 'CreatePhoto'
  propTypes:
    onCancel: T.func
    onSelectImage: T.func
    instruction: T.string

  getDefaultProps: ->
    onCancel: (->)
    onSelectImage: (->)
    instruction: null

  getInitialState: ->
    source: 'camera'
    camera: 'back'
    flash: false

  componentWillMount: ->
    @hardwareBack = =>
      @props.onCancel()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack
    Permissions.request('camera') # take photos
    Permissions.request('photo') # access photos

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  render: ->
    <View style={styles.overlayWhole}>
      <View style={backgroundColor: 'white', padding: 3}>
        <Text style={color: '#979797', textAlign: 'center'}>
          {
            if @props.instruction?
              "Add image of: #{@props.instruction}".toUpperCase()
            else
              'Main image'.toUpperCase()
          }
        </Text>
      </View>
      {
        switch @state.source
          when 'camera'
            <View style={flex: 1}>
              <View style={
                flex: 1
                backgroundColor: 'black'
              }>
                <Camera
                  ref={(cam) => this.camera = cam}
                  style={
                    flex: 1
                  }
                  type={@state.camera}
                  flashMode={if @state.flash then Camera.constants.FlashMode.on else Camera.constants.FlashMode.off}
                />
              </View>
              <View style={
                flexDirection: 'row'
                justifyContent: 'space-around'
                alignItems: 'center'
              }>
                <TouchableOpacity onPress={=>
                  @setState camera: if @state.camera is 'front' then 'back' else 'front'
                }>
                  <Image source={require '../web/assets/img/icon-switch-camera.png'} style={
                    width: 30
                    height: 30
                    margin: 10
                  } />
                </TouchableOpacity>
                <TouchableOpacity onPress={=>
                  return unless this.camera?
                  field_id = @state.field_id
                  cameraError = =>
                    Alert.alert "Couldn't capture photo", "Please check that Siftr has access to the camera and photo roll in system privacy settings."
                  Permissions.checkMultiple(['camera', 'photo']).then (response) =>
                    if response.camera is 'authorized' and response.photo is 'authorized'
                      this.camera.capture({})
                      .then ({path}) =>
                        @props.onSelectImage
                          uri: path
                          isStatic: true
                          type: 'image/jpeg'
                          name: 'upload.jpg'
                      .catch(cameraError)
                    else
                      cameraError()
                }>
                  <Image source={require '../web/assets/img/icon-take-picture.png'} style={
                    width: 50
                    height: 50
                    margin: 10
                  } />
                </TouchableOpacity>
                <TouchableOpacity onPress={=>
                  @setState flash: not @state.flash
                }>
                  <Image source={require '../web/assets/img/icon-flash.png'} style={
                    width: 32 * 0.7
                    height: 46 * 0.7
                    margin: 10
                  } />
                </TouchableOpacity>
              </View>
            </View>
          when 'roll'
            <View style={flex: 1}>
              <SiftrRoll
                onSelectImage={(uri, location) =>
                  img =
                    uri: uri
                    isStatic: true
                    # TODO do we need to support other types
                    type: 'image/jpeg'
                    name: 'upload.jpg'
                  @props.onSelectImage img, location
                }
              />
            </View>
      }
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={@props.onCancel}>
          <Text style={[styles.blackViolaButton, {color: 'rgb(188,188,188)'}]}>cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={=> @setState source: 'camera'}>
          <Image style={width: 52 * 0.7, height: 38 * 0.7} source={
            if @state.source is 'camera'
              require '../web/assets/img/icon-from-camera.png'
            else
              require '../web/assets/img/icon-from-camera-gray.png'
          } />
        </TouchableOpacity>
        <TouchableOpacity onPress={=> @setState source: 'roll'}>
          <Image style={width: 52 * 0.7, height: 52 * 0.7} source={
            if @state.source is 'roll'
              require '../web/assets/img/icon-from-roll.png'
            else
              require '../web/assets/img/icon-from-roll-gray.png'
          } />
        </TouchableOpacity>
        <View>
          <Text style={[styles.blackViolaButton, {opacity: 0}]}>cancel</Text>
        </View>
      </View>
    </View>

export class Blackout extends React.Component
  @defaultProps:
    isFocused: false
    keyboardUp: false

  render: ->
    <View style={@props.style}>
      {@props.children}
      {
        if @props.keyboardUp and not @props.isFocused
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={
              position: 'absolute'
              top: 0
              left: 0
              bottom: 0
              right: 0
              backgroundColor: 'rgba(0,0,0,0.5)'
            } />
          </TouchableWithoutFeedback>
      }
    </View>

CreateDataPhotoButton = createClass
  displayName: 'CreateDataPhotoButton'

  render: ->
    file = null
    for f in (@props.files ? [])
      if f.field_id is @props.field_id
        file = f.file
        break
    <View style={
      flexDirection: 'row'
      alignItems: 'center'
      backgroundColor: 'white'
      padding: 3
    }>
      <TouchableOpacity onPress={@props.onPress}>
        <Image source={
          if file?
            file
          else
            require '../web/assets/img/icon-needs-pic.png'
        } style={styles.photoSlot} />
      </TouchableOpacity>
      {
        if @props.blurb?
          @props.blurb
        else
          <TouchableOpacity style={flex: 1} onPress={@props.onPress}>
            <Text>{@props.label}</Text>
          </TouchableOpacity>
      }
    </View>

CreateSingleSelect = createClass
  displayName: 'CreateSingleSelect'

  getInitialState: ->
    menuOpen: false

  render: ->
    <View>
      <TouchableOpacity onPress={=>
        @setState menuOpen: not @state.menuOpen
      } style={
        padding: 13
        flexDirection: 'row'
        alignItems: 'center'
        justifyContent: 'space-between'
        backgroundColor: 'white'
      }>
        <View style={
          backgroundColor: @props.getColor(@props.current)
          height: 16
          width: 16
          borderRadius: 8
          marginRight: 20
        } />
        <Text style={flex: 1}>{ @props.getLabel(@props.current) }</Text>
        <Image source={require('../web/assets/img/icon-expand.png')} style={
          width: 32 * 0.7
          height: 18 * 0.7
          resizeMode: 'contain'
        } />
      </TouchableOpacity>
      {
        if @state.menuOpen
          <View>
            {
              @props.options.map (option) =>
                <TouchableOpacity key={@props.getKey(option)} onPress={=>
                  @setState menuOpen: false
                  @props.onSelectOption option
                } style={
                  borderTopColor: 'rgb(230,230,230)'
                  borderTopWidth: 1
                  padding: 13
                  flexDirection: 'row'
                  alignItems: 'center'
                  justifyContent: 'space-between'
                  backgroundColor: 'rgb(240,240,240)'
                }>
                  <View style={
                    backgroundColor: @props.getColor(option)
                    height: 16
                    width: 16
                    borderRadius: 8
                    marginRight: 20
                  } />
                  <Text style={flex: 1}>{ @props.getLabel(option) }</Text>
                </TouchableOpacity>
            }
          </View>
      }
    </View>

# Steps 2-5 (native app), all non-photo data together
export CreateData = createClass
  displayName: 'CreateData'
  propTypes:
    createNote: T.any.isRequired
    onUpdateNote: T.func
    onStartLocation: T.func
    getLocation: T.func
    categories: T.arrayOf(T.instanceOf Tag).isRequired
    getColor: T.func
    fields: T.arrayOf(T.instanceOf Field)
    # misc
    onFinish: T.func
    onBack: T.func
    onCancel: T.func

  getDefaultProps: ->
    onUpdateNote: (->)
    onStartLocation: (->)
    getLocation: (->)
    getColor: (->)
    fields: []
    onFinish: (->)
    onBack: (->)
    onCancel: (->)

  getInitialState: ->
    isPickingLocation: false
    isTakingPhoto: null
    geocodeResult: null

  componentWillMount: ->
    firebase.analytics().logEvent 'entering_note_info', {}
    unless @props.resumedNote
      @props.onStartLocation()
    @hardwareBack = =>
      if @state.isPickingLocation
        @setState isPickingLocation: false
      else
        @props.onBack()
      true
    BackHandler.addEventListener 'hardwareBackPress', @hardwareBack
    setTimeout =>
      Geocoder.geocodePosition(@props.getLocation()).then (res) =>
        @setState geocodeResult: res
    , 1000

  componentWillUnmount: ->
    BackHandler.removeEventListener 'hardwareBackPress', @hardwareBack

  finishForm: ->
    unless @props.createNote.caption? and @props.createNote.caption.match(/\S/)
      Alert.alert 'Missing data', 'Please enter a caption.'
      return
    field_data = @props.createNote.field_data ? []
    files = @props.createNote.files ? []
    for field in @props.fields
      if field.field_type is 'SINGLESELECT'
        if field_data.some((data) => data.field_id is field.field_id)
        else
          field_data.push new FieldData {
            field_id: field.field_id
            field_option_id: field.options[0].field_option_id
          }
      else if field.required and field.field_type in ['TEXT', 'TEXTAREA']
        unless field_data.some((data) => data.field_id is field.field_id)
          Alert.alert 'Missing data', "Please fill in the field: #{field.label}"
          return
      else if field.required and field.field_type is 'MEDIA'
        unless files.some((file) => file.field_id is field.field_id)
          Alert.alert 'Missing photo', "Please supply a photo for: #{field.label}"
          return
    return if @props.progress?
    @props.onFinish field_data

  render: ->
    isEditing = (@props.createNote.note_id ? 0) isnt 0

    if @state.isPickingLocation
      <View style={styles.overlayBottom}>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={=>
            Geocoder.geocodePosition(@props.getLocation()).then (res) =>
              @setState geocodeResult: res
            @setState isPickingLocation: false
          }>
            <Text style={styles.blueButton}>Pick Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    else if @state.isTakingPhoto?
      if @state.isTakingPhoto is 'main'
        field = null
        field_id = null
      else
        field = @state.isTakingPhoto.label
        field_id = @state.isTakingPhoto.field_id
      <CreatePhoto
        onCancel={=> @setState isTakingPhoto: null}
        onSelectImage={(file) =>
          newFiles = @props.createNote.files.filter (file) => file.field_id isnt field_id
          newFiles.push {file, field_id}
          @props.onUpdateNote update @props.createNote,
            files: $set: newFiles
          @setState isTakingPhoto: null
        }
        instruction={field}
      />
    else
      <View style={flex: 1}>
        <ScrollView
          style={
            flex: 1
            backgroundColor:
              if @state.focusedBox?
                'rgb(127,127,127)'
              else
                'rgb(249,249,249)'
          }
          contentContainerStyle={
            flexDirection: 'column'
            alignItems: 'stretch'
          }
        >
          <View style={
            flexDirection: 'column'
            alignItems: 'stretch'
          }>
            <Blackout keyboardUp={@state.focusedBox?} isFocused={@state.focusedBox is 'caption'}>
              {
                descBox =
                  <TextInput
                    placeholder="Add a description…"
                    value={@props.createNote.caption}
                    onChangeText={(text) =>
                      @props.onUpdateNote update @props.createNote,
                        caption: $set: text
                    }
                    onFocus={=> @setState focusedBox: 'caption'}
                    onEndEditing={=>
                      if @state.focusedBox is 'caption'
                        @setState focusedBox: null
                    }
                    multiline={true}
                    style={
                      height: 100
                      padding: 10
                      fontSize: 16
                      backgroundColor: 'white'
                      flex: 1
                    }
                  />
                if isEditing
                  descBox
                else
                  <CreateDataPhotoButton
                    files={@props.createNote.files}
                    field_id={null}
                    onPress={=> @setState isTakingPhoto: 'main'}
                    label="Photo"
                    blurb={descBox}
                  />
              }
            </Blackout>
            <Blackout keyboardUp={@state.focusedBox?} isFocused={false}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsHeaderText}>Modify location</Text>
              </View>
              <View style={backgroundColor: 'white'}>
                <TouchableOpacity onPress={=>
                  @setState isPickingLocation: true
                } style={
                  flexDirection: 'row'
                  alignItems: 'center'
                }>
                  <Text style={
                    paddingLeft: 20
                    paddingRight: 20
                    paddingTop: 13
                    paddingBottom: 13
                    color: 'black'
                    flex: 1
                  }>{
                    if @state.geocodeResult? and @state.geocodeResult[0]?
                      @state.geocodeResult[0].feature ? @state.geocodeResult[0].formattedAddress
                    else
                      'Locating…'
                  }</Text>
                  <View style={
                    paddingLeft: 20
                    paddingRight: 20
                    paddingTop: 8
                    paddingBottom: 8
                  }>
                    <Image style={
                      width: 69 * 0.15
                      height: 112 * 0.15
                    } source={require('../web/assets/img/disclosure-arrow.png')} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsHeaderText}>Pick category</Text>
              </View>
              <CreateSingleSelect
                current={@props.createNote.category}
                options={@props.categories}
                getColor={@props.getColor}
                getLabel={(cat) => cat.tag}
                getKey={(cat) => cat.tag_id}
                onSelectOption={(cat) =>
                  @props.onUpdateNote update @props.createNote, category: $set: cat
                }
              />
            </Blackout>
            {
              @props.fields.map (field) =>
                if isEditing and field.field_type is 'MEDIA'
                  return null
                <Blackout keyboardUp={@state.focusedBox?} isFocused={@state.focusedBox is field.field_id} key={field.field_id} style={alignSelf: 'stretch'}>
                  <View style={styles.settingsHeader}>
                    <Text style={styles.settingsHeaderText}>
                      {
                        if field.field_type is 'MEDIA'
                          'Extra photo'
                        else
                          "Enter data: #{field.label}"
                      }
                    </Text>
                  </View>
                  {
                    field_data = @props.createNote.field_data ? []
                    onChangeData = (newData) =>
                      @props.onUpdateNote update @props.createNote,
                        field_data:
                          $set: newData
                    getText = =>
                      for data in field_data
                        if data.field_id is field.field_id
                          return data.field_data
                      ''
                    setText = (text) =>
                      newData =
                        data for data in field_data when data.field_id isnt field.field_id
                      newData.push new FieldData {
                        field_id: field.field_id
                        field_data: text
                      }
                      onChangeData newData
                    switch field.field_type
                      when 'TEXT'
                        <View style={backgroundColor: 'white'}>
                          <TextInput
                            multiline={false}
                            value={getText()}
                            onChangeText={setText}
                            style={styles.input}
                            placeholder={field.label}
                            onFocus={=> @setState focusedBox: field.field_id}
                            onEndEditing={=>
                              if @state.focusedBox is field.field_id
                                @setState focusedBox: null
                            }
                          />
                        </View>
                      when 'TEXTAREA'
                        <TextInput
                          multiline={true}
                          value={getText()}
                          onChangeText={setText}
                          style={
                            height: 120
                            padding: 10
                            fontSize: 16
                            alignSelf: 'stretch'
                            backgroundColor: 'white'
                          }
                          onFocus={=> @setState focusedBox: field.field_id}
                          onEndEditing={=>
                            if @state.focusedBox is field.field_id
                              @setState focusedBox: null
                          }
                        />
                      when 'SINGLESELECT'
                        <CreateSingleSelect
                          current={do =>
                            field_option_id = null
                            for data in field_data
                              if data.field_id is field.field_id
                                field_option_id = data.field_option_id
                                break
                            for option in field.options
                              if option.field_option_id is field_option_id
                                return option
                            field.options[0]
                          }
                          options={field.options}
                          getColor={=> 'rgba(0,0,0,0)'}
                          getLabel={(opt) => opt.option}
                          getKey={(opt) => opt.field_option_id}
                          onSelectOption={(opt) =>
                            newData =
                              data for data in field_data when data.field_id isnt field.field_id
                            newData.push new FieldData {
                              field_id: field.field_id
                              field_option_id: opt.field_option_id
                            }
                            onChangeData newData
                          }
                        />
                      when 'MULTISELECT'
                        field.options.map (option) =>
                          <View style={flexDirection: 'row', backgroundColor: 'white', alignItems: 'center'} key={option.field_option_id}>
                            <Switch
                              value={field_data.some (data) =>
                                data.field_id is field.field_id and data.field_option_id is option.field_option_id
                              }
                              onValueChange={(checked) =>
                                newData =
                                  data for data in field_data when not (data.field_id is field.field_id and data.field_option_id is option.field_option_id)
                                if checked
                                  newData.push new FieldData {
                                    field_id: field.field_id
                                    field_option_id: option.field_option_id
                                  }
                                onChangeData newData
                              }
                              style={margin: 10}
                            />
                            <Text style={margin: 10}>{ option.option }</Text>
                          </View>
                      when 'MEDIA'
                        <CreateDataPhotoButton
                          files={@props.createNote.files}
                          field_id={field.field_id}
                          onPress={=> @setState isTakingPhoto: field}
                          label={field.label}
                        />
                      when 'NOMEN'
                        <TouchableOpacity style={padding: 10, backgroundColor: 'white'} onPress={=>
                          # Linking.openURL "nomen://?nomen_id=#{field.label}&siftr_id=6234" # TODO actual siftr_id
                          @props.onViolaIdentify
                            note: @props.createNote
                            location: @props.getLocation()
                        }>
                          <Text>
                            {
                              do =>
                                for data in field_data
                                  if data.field_id is field.field_id
                                    return data.field_data
                            }
                          </Text>
                          <Text>Launch Nomen</Text>
                        </TouchableOpacity>
                      else
                        <Text>(not implemented yet)</Text>
                  }
                </Blackout>
            }
          </View>
        </ScrollView>
        <Blackout keyboardUp={@state.focusedBox?} isFocused={false}>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={@props.onCancel} style={flex: 1, alignItems: 'center'}>
              <Text style={[styles.blackViolaButton, color: 'rgb(165,159,164)']}>Cancel</Text>
            </TouchableOpacity>
            <View style={
              width: 2
              height: 20
              backgroundColor: 'rgb(237,237,237)'
            } />
            <TouchableOpacity onPress={=>
              unless @props.createNote.uploading
                @finishForm()
            } style={flex: 1, alignItems: 'center'}>
              <Text style={styles.blackViolaButton}>
                {
                  if @props.createNote.uploading
                    "Uploading… (#{Math.floor((@props.progress ? 0) * 100)}%)"
                  else
                    "Post"
                }
              </Text>
            </TouchableOpacity>
          </View>
        </Blackout>
      </View>
