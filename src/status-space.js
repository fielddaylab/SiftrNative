'use strict';

import React from 'react';

import
{ View
, Platform
, StatusBar
} from 'react-native';
import Orientation from 'react-native-orientation';

export class StatusSpace extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      orientation: 'PORTRAIT',
    };
  }

  componentDidMount() {
    this.mounted = true;
    // TODO something's not linked right with orientation on android.
    // we don't need it anyway, but for now just don't set it up
    if (Platform.OS === 'ios') {
      Orientation.getSpecificOrientation((err, orientation) => {
        if (this.mounted) this.setState({orientation: orientation});
      });
      this.orientationListener = (orientation) => {
        if (this.mounted) this.setState({orientation: orientation});
      };
      Orientation.addSpecificOrientationListener(this.orientationListener);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    if (Platform.OS === 'ios') {
      Orientation.removeSpecificOrientationListener(this.orientationListener);
    }
  }

  render() {
    return <View style={{
      flex: 0,
      height: (
        (Platform.OS === 'ios' && ['PORTRAIT', 'PORTRAITUPSIDEDOWN', 'UNKNOWN'].indexOf(this.state.orientation) !== -1)
        ? 20
        : undefined
      ),
      backgroundColor: (
        this.props.backgroundColor == null
        ? 'white'
        : this.props.backgroundColor
      ),
    }}>
      {
        (!(this.props.leaveBar))
        ? <StatusBar
            backgroundColor={this.props.backgroundColor || 'white'}
            barStyle={this.props.barStyle || 'dark-content'}
            networkActivityIndicatorVisible={
              this.props.queueMessage ? this.props.queueMessage.uploading : false
            }
          />
        : undefined
      }
    </View>
  }

}
