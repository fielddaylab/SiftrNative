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

# @endif
