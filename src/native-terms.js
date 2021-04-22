'use strict';

import React from 'react';
import T from 'prop-types';
import
{ View
, TouchableOpacity
} from 'react-native';
import {styles, Text} from './styles';
import Hyperlink from 'react-native-hyperlink';

export class Terms extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white'}}>
        <View style={{margin: 20}}>
          <Hyperlink
            linkStyle={{color: '#2980b9'}}
            linkText={(url) => 'Terms of Use.'}
            linkDefault={true}
          >
            <Text>
              To use The Station you must agree to the https://docs.google.com/document/d/16P8kIfHka-zHXoQcd9mWlUWiOkaTp6I7UcpD_GoB8LY/edit
            </Text>
          </Hyperlink>
        </View>
        <TouchableOpacity onPress={this.props.onAccept} style={{margin: 20}}>
          <Text style={{color: '#2980b9', fontWeight: 'bold'}}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.props.onCancel} style={{margin: 20}}>
          <Text style={{color: '#2980b9'}}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

Terms.defaultProps = {
  onAccept: function(){},
  onCancel: function(){},
};
