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

export const PlaqueScreen = (props) => {
  const event_package_id = props.plaque.event_package_id;
  let events = [];
  if (event_package_id) {
    events = props.events.filter(event => event.event_package_id === event_package_id);
  }
  return (
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
        {
          events.length > 0 && (
            <View>
              {
                events.map(event => {
                  const item = props.items.find(item => parseInt(item.item_id) === parseInt(event.content_id));
                  return (
                    <Text key={event.event_id}>{
                      event.event === 'GIVE_ITEM' ? (
                        `${event.qty} x ${item ? item.name : '???'}`
                      ) : JSON.stringify(event)
                    }</Text>
                  );
                })
              }
              <TouchableOpacity onPress={() => {
                props.onPickup(events);
                props.onClose();
              }}>
                <Text>Collect</Text>
              </TouchableOpacity>
            </View>
          )
        }
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
};
