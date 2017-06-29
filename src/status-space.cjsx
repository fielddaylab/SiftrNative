'use strict'

React = require 'react'

{ View
, Platform
, StatusBar
} = require 'react-native'
Orientation = require 'react-native-orientation'

StatusSpace = React.createClass
  getInitialState: ->
    orientation: 'PORTRAIT'

  componentDidMount: ->
    # TODO something's not linked right with orientation on android.
    # we don't need it anyway, but for now just don't set it up
    if Platform.OS is 'ios'
      Orientation.getSpecificOrientation (err, orientation) =>
        @setState {orientation}
      @orientationListener = (orientation) =>
        @setState {orientation}
      Orientation.addSpecificOrientationListener @orientationListener

  componentWillUnmount: ->
    if Platform.OS is 'ios'
      Orientation.removeSpecificOrientationListener @orientationListener

  render: ->
    <View style={
      flex: 0
      height:
        if Platform.OS is 'ios' and @state.orientation is 'PORTRAIT'
          20
        else
          undefined
      backgroundColor: @props.backgroundColor ? 'white'
    }>
      <StatusBar
        backgroundColor={@props.backgroundColor ? 'white'}
        barStyle={@props.barStyle ? 'dark-content'}
      />
    </View>

exports.StatusSpace = StatusSpace
