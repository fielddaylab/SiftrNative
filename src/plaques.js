'use strict';

import React from 'react';
import {
  Text
, View
, TouchableOpacity
, ScrollView
, Image
} from 'react-native';
import {
  FullWidthWebView
, webViewBoilerplate
} from './items';
import {CacheMedia} from './media';

export const PlaqueScreen = (props) => (
  <View style={{
    flex: 1,
    backgroundColor: 'rgb(149,169,153)',
    flexDirection: 'column',
    paddingLeft: 10,
    paddingRight: 10,
  }}>
    <CacheMedia
      media_id={props.plaque.media_id}
      auth={props.auth}
      online={true}
      withURL={(url) => (
        <View style={{marginTop: 20, marginBottom: 20}}>
          <Image
            source={url}
            style={{
              height: 150,
              resizeMode: 'contain',
            }}
          />
        </View>
      )}
    />
    <View style={{
      backgroundColor: 'white',
      flex: 1,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      alignItems: 'center',
    }}>
      <Text style={{
        margin: 15,
        fontSize: 24,
      }}>
        {props.plaque.name}
      </Text>
      <FullWidthWebView
        style={{
          flex: 1,
          alignSelf: 'stretch',
          margin: 10,
        }}
        source={{html: webViewBoilerplate(props.plaque.description)}}
        originWhitelist={["*"]}
      />
      <View style={{
        margin: 15,
        alignItems: 'center',
      }}>
        <TouchableOpacity onPress={props.onClose}>
          <Image
            style={{
              width: 140 * 0.45,
              height: 140 * 0.45,
            }}
            source={require("../web/assets/img/quest-close.png")}
          />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);
