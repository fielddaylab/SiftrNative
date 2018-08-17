'use strict';

window.isNative = false;
window.platform = 'web';

import {SiftrNative} from './app';
import React from 'react';
import ReactDOM from 'react-dom';
document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<SiftrNative />, document.getElementById('app-container'));
});
