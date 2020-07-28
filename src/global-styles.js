import React from 'react';
import RN, {StyleSheet} from 'react-native';
import createClass from 'create-react-class';

export const globalstyles = StyleSheet.create({


  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },

  closeButton: {
    width: 100 * 0.45,
    height: 150 * 0.45,
    position: 'absolute',
    bottom:-22,
    marginLeft: -22,
    shadowColor: '#5D0D0D',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: {height: 2},
  },

  closeModifier: {
    width: 100 * 0.45,
    height: 150 * 0.45,
    position: 'absolute',
    bottom:-62,
    marginLeft: -22,
  },

});
