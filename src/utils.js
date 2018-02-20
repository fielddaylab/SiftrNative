'use strict';

import React from 'react';
import createClass from 'create-react-class';

// @ifdef NATIVE
import {Text, View, TouchableOpacity} from 'react-native';
// @endif

export const clicker = function(fn) {
  return function(e) {
    e.preventDefault();
    fn(e);
  };
};

export const withSuccess = function(cb) {
  return function(obj) {
    if (obj.returnCode === 0) {
      cb(obj.data);
    } else {
      console.warn(JSON.stringify(obj));
    }
  };
};

// hacks for stubbing out the dual interface

// @ifdef NATIVE
export const P = Text;
export const BUTTON = createClass({
  displayName: 'BUTTON',
  render() {
    return <TouchableOpacity onPress={this.props.onClick}>
      {this.props.children}
    </TouchableOpacity>;
  },
});
// @endif
// @ifdef WEB
export const P = 'p';
export const BUTTON = createClass({
  displayName: 'BUTTON',
  render() {
    return <a href="#" onClick={clicker(this.props.onClick)}>
      {this.props.children}
    </a>;
  },
});
// @endif
