import React from 'react';
import RN, {StyleSheet} from 'react-native';
import createClass from 'create-react-class';

export const globalstyles = StyleSheet.create({


  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },

  closeContainer: {
    // make sure to set pointerEvents="box-none" also
    position: 'absolute',
    bottom: -22,
    left: 0,
    right: 0,
    justifyContent: 'center',
    flexDirection: 'row',
  },

  closeButton: {
    width: 100 * 0.45,
    height: 150 * 0.45,
    shadowColor: '#5D0D0D',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: {height: 2},
  },

  closeModifier: {
    width: 100 * 0.45,
    height: 150 * 0.45,
  },

  buttonMain: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#fff',
    shadowColor: '#5D0D0D',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: {height: 2},
  },

});
