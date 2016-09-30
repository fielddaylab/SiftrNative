'use strict'

# @ifdef NATIVE

{StyleSheet} = require 'react-native'

exports.styles = StyleSheet.create

  container:
    flex: 1
    backgroundColor: '#F5FCFF'
    padding: 10

  welcome:
    fontSize: 20
    textAlign: 'center'
    margin: 10

  instructions:
    textAlign: 'center'
    color: '#333333'
    marginBottom: 5

  input:
    height: 50

  theMap:
    height: 400
    width: 300

  horizontal:
    flexDirection: 'row'

  previewImage:
    height: 400
    width: 300

  textInput:
    height: 400
    width: 300

# @endif
