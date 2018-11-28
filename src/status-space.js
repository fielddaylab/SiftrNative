'use strict';

import React from 'react';

import
{ StatusBar
} from 'react-native';

export class StatusSpace extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      (!(this.props.leaveBar))
      ? <StatusBar
          backgroundColor={this.props.backgroundColor || 'white'}
          barStyle={this.props.barStyle || 'dark-content'}
          networkActivityIndicatorVisible={
            this.props.queueMessage ? this.props.queueMessage.uploading : false
          }
        />
      : null
    );
  }

}
