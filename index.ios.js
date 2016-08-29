window.isNative = true;
window.platform = 'ios';

import {SiftrNative} from './src-native/app';
import {AppRegistry} from 'react-native';
AppRegistry.registerComponent('SiftrNative', () => SiftrNative);
