'use strict'

# @ifdef NATIVE

{StyleSheet} = require 'react-native'

exports.styles = StyleSheet.create

  whiteBG:
    backgroundColor: 'white'

  input:
    height: 50
    backgroundColor: 'white'
    color: 'black'
    marginTop: 8
    marginBottom: 8
    marginLeft: 30
    marginRight: 30

  horizontal:
    flexDirection: 'row'

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

  overlayWhole:
    backgroundColor: 'white'
    position: 'absolute'
    top: 0
    bottom: 0
    left: 0
    right: 0
    flexDirection: 'column'
    alignItems: 'stretch'

  overlayWholeCenter:
    backgroundColor: 'white'
    position: 'absolute'
    top: 0
    bottom: 0
    left: 0
    right: 0
    flexDirection: 'column'
    alignItems: 'center'
    justifyContent: 'center'

  overlayBottom:
    backgroundColor: 'white'
    position: 'absolute'
    bottom: 0
    left: 0
    right: 0
    flexDirection: 'column'
    alignItems: 'stretch'

  buttonRow:
    flexDirection: 'row'
    justifyContent: 'space-between'
    alignItems: 'center'
    padding: 10

  openSiftrButton:
    borderColor: 'black'
    borderWidth: 1
    alignItems: 'flex-start'
    flexDirection: 'column'
    padding: 5
    backgroundColor: '#eee'

# @endif
