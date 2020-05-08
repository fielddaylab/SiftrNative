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
import {ItemScreen} from './items';

export class PlaqueScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedIn: false,
      showingItem: null,
    };
  }

  render() {
    const event_package_id = this.props.plaque.event_package_id;
    let events = [];
    if (event_package_id) {
      events = this.props.events.filter(event => event.event_package_id === event_package_id);
    }
    const notes = this.props.notes.filter(note => {
      const trigger = this.props.getTriggerForNote(note);
      if (!trigger) return;
      return parseInt(trigger.cluster_id) === parseInt(this.props.trigger.trigger_id)
    });

    if (this.state.showingItem != null) {
      const event = events[this.state.showingItem];
      const item = this.props.items.find(item => parseInt(item.item_id) === parseInt(event.content_id));
      return (
        <ItemScreen
          type="inventory"
          item={item}
          auth={this.props.auth}
          onClose={() => {
            const nextItem = this.state.showingItem + 1;
            if (nextItem >= events.length) {
              this.props.onClose();
            } else {
              this.setState({showingItem: nextItem});
            }
          }}
        />
      );
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
          media_id={this.props.plaque.media_id}
          auth={this.props.auth}
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
            {this.state.checkedIn ? 'Nice! You found:' : this.props.plaque.name}
          </Text>
          {
            this.state.checkedIn ? (
              <ScrollView style={{flex: 1}}>
                {
                  events.map(event => {
                    const item = this.props.items.find(item => parseInt(item.item_id) === parseInt(event.content_id));
                    return (
                      <Text key={event.event_id} style={{
                        margin: 5,
                        fontSize: 16,
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}>{
                        event.event === 'GIVE_ITEM' ? (
                          parseInt(event.qty) === 1
                            ? `${item ? item.name : '???'}`
                            : `${event.qty} x ${item ? item.name : '???'}`
                        ) : JSON.stringify(event)
                      }</Text>
                    );
                  })
                }
              </ScrollView>
            ) : (
              <FullWidthWebView
                style={{
                  flex: 1,
                  alignSelf: 'stretch',
                  margin: 10,
                }}
                source={{html: webViewBoilerplate(this.props.plaque.description)}}
                originWhitelist={["*"]}
              />
            )
          }
          <View>
            <TouchableOpacity onPress={() => {
              if (this.state.checkedIn) {
                if (events.length === 0) {
                  this.props.onClose();
                } else {
                  this.props.onPickup(events);
                  this.setState({showingItem: 0});
                }
              } else {
                this.props.onCheckin();
                if (events.length === 0) {
                  this.props.onClose();
                } else {
                  this.setState({checkedIn: true});
                }
              }
            }} style={{
              margin: 25,
              backgroundColor: 'rgb(101,88,245)',
              padding: 10,
              borderRadius: 6,
              marginBottom: 35,
              textAlign: 'center',
              paddingLeft: 30,
              paddingRight: 30,
            }}>
              <Text style={{color: 'white'}}>
                {this.state.checkedIn ? (events.length === 0 ? 'Close' : 'Collect Field Notes') : 'Check in'}
              </Text>
            </TouchableOpacity>
          </View>
          {
            notes.length > 0 && (
              <View>
                {
                  notes.map(note =>
                    <TouchableOpacity key={note.note_id} onPress={() =>
                      this.props.onSelectNote(note)
                    } style={{padding: 5}}>
                      <Text>Note by {note.user.display_name}</Text>
                    </TouchableOpacity>
                  )
                }
              </View>
            )
          }
        </View>
      </View>
    );
  }
}
