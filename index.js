window.isNative = true;
import {AppRegistry, Platform} from 'react-native';
window.platform = Platform.OS;

import {SiftrNative} from './src-native/app';
AppRegistry.registerComponent('GMiOS', () => SiftrNative);
