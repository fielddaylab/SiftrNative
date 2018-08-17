'use strict';

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
