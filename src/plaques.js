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
import {CacheMedia, CacheMedias} from './media';
import {ItemScreen} from './items';
import Markdown from "react-native-simple-markdown";
import {SquareImage, GalleryModal} from './note-view';

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
      }}>
        <View style={{
          backgroundColor: 'white',
          flex: 1,
          alignItems: 'center',
        }}>
          <Text style={{
            margin: 15,
            fontSize: 24,
          }}>
            {this.state.checkedIn ? 'Nice! You found:' : this.props.plaque.name}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'stretch'}}>
            <CacheMedias
              medias={[this.props.plaque.media_id, this.props.plaque.media_id_2, this.props.plaque.media_id_3].filter(x => parseInt(x)).map(media_id =>
                ({media_id: media_id, auth: this.props.auth, online: true})
              )}
              withURLs={(urls) => {
                const url = urls[0];
                if (url && url.uri && url.uri.match(/\.zip$/)) {
                  return (
                    <View style={{marginTop: 20, marginBottom: 20, flexDirection: 'column', alignItems: 'center'}}>
                      <ModelView
                        source={{ zip: url }}
                        style={{
                          width: 200,
                          height: 150,
                        }}
                        autoPlay={true}
                      />
                    </View>
                  );
                } else if (url && url.uri) {
                  return <React.Fragment>
                    <SquareImage
                      sources={urls}
                      margin={urls.length > 1 ? 10 : 0}
                      peek={urls.length > 1 ? 20 : 0}
                      onGallery={({uri}) => this.setState({gallery: uri})}
                    />
                    {
                      this.state.gallery != null && (
                        <GalleryModal
                          onClose={() => this.setState({gallery: null})}
                          initialPage={urls.map(x => x.uri).indexOf(this.state.gallery)}
                          images={urls.map((url) => ({source: url}))}
                        />
                      )
                    }
                  </React.Fragment>;
                } else {
                  return null;
                }
              }}
            />
          </View>
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
              <ScrollView style={{flex: 1, alignSelf: 'stretch', margin: 10}}>
                <Markdown>
                  {this.props.plaque.description}
                </Markdown>
              </ScrollView>
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
