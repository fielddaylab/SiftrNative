React = {Component} = require 'react'
{ AppRegistry
, StyleSheet
, Text
, View
} = require 'react-native'

SiftrNative = React.createClass
  render: ->
    if window.platform in ['iOS', 'Android']
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          Running on {window.platform}.
        </Text>
      </View>
    else
      <p>Hello, web!</p>

styles = StyleSheet?.create
  container:
    flex: 1
    justifyContent: 'center'
    alignItems: 'center'
    backgroundColor: '#F5FCFF'
  welcome:
    fontSize: 20
    textAlign: 'center'
    margin: 10
  instructions:
    textAlign: 'center'
    color: '#333333'
    marginBottom: 5

exports.SiftrNative = SiftrNative
