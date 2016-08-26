window.isNative = true;
window.platform = 'android';

import {SiftrNative} from './src/app';
import {AppRegistry} from 'react-native';
AppRegistry.registerComponent('SiftrNative', () => SiftrNative);
