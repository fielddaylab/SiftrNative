'use strict';

import React from 'react';

import
{ StatusBar
, Platform
, View
} from 'react-native';

const iOSBefore11 = Platform.OS === 'ios' && parseInt(Platform.Version, 10) < 11;

export class StatusSpace extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={{
        flex: 0,
        height: iOSBefore11 ? 20 : 0,
        backgroundColor: this.props.backgroundColor || 'white',
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
          : null
        }
      </View>
    );
  }

}
