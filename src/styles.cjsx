'use strict'

# @ifdef NATIVE

{StyleSheet} = require 'react-native'

exports.styles = StyleSheet.create

  whiteBG:
    backgroundColor: 'white'

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

  grayButton:
    paddingLeft: 20
    paddingRight: 20
    paddingTop: 8
    paddingBottom: 8
    backgroundColor: '#cfcbcc'
    color: 'white'
    fontSize: 18

  blueButton:
    paddingLeft: 20
    paddingRight: 20
    paddingTop: 8
    paddingBottom: 8
    backgroundColor: '#61c9e2'
    color: 'white'
    fontSize: 18

# @endif
