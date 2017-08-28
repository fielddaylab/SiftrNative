'use strict';

// @ifdef NATIVE

import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({

  whiteBG: {
    backgroundColor: 'white',
  },

  input: {
    height: 50,
    backgroundColor: 'white',
    color: 'black',
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 30,
    marginRight: 30,
  },

  horizontal: {
    flexDirection: 'row',
  },

  grayButton: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#cfcbcc',
    color: 'white',
    fontSize: 18,
  },

  blueButton: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#61c9e2',
    color: 'white',
    fontSize: 18,
  },

  overlayWhole: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  overlayWholeCenter: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlayBottom: {
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },

  openSiftrButton: {
    borderColor: 'black',
    borderWidth: 1,
    alignItems: 'flex-start',
    flexDirection: 'column',
    padding: 5,
    backgroundColor: '#eee',
  },

  exploreTabOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#B8B8B8',
    paddingTop: 13,
    paddingBottom: 13,
  },

  exploreTabOn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FF7C6B',
    paddingTop: 13,
    paddingBottom: 13,
  },

  settingsHeader: {
    backgroundColor: 'rgb(249,249,249)',
    borderTopColor: 'rgb(230,230,230)',
    borderBottomColor: 'rgb(230,230,230)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 10,
    paddingTop: 18,
    paddingBottom: 6,
  },

  settingsHeaderText: {
    fontSize: 12,
    color: 'rgb(172,172,172)',
  },

  settingsButton: {
    backgroundColor: 'white',
    borderTopColor: 'rgb(230,230,230)',
    borderBottomColor: 'rgb(230,230,230)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 14,
  },

});

// @endif
