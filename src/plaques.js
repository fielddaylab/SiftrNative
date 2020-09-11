'use strict';

import React from 'react';
import {
  Text
, View
, TouchableOpacity
, ScrollView
, Image
, ImageBackground
} from 'react-native';
import {
  FullWidthWebView
, webViewBoilerplate
} from './items';
import {CacheMedia, CacheMedias} from './media';
import {ItemScreen, CacheContents} from './items';
import {FixedMarkdown} from './styles';
import {SquareImage, GalleryModal} from './note-view';
import { globalstyles } from "./global-styles";

export class PlaqueScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phase: 'start', // start, details, cache-closed, cache-open
    };
  }

  render() {
    const event_package_id = this.props.plaque.event_package_id;
    let events = [];
    if (event_package_id) {
      events = this.props.events.filter(event => event.event_package_id === event_package_id);
    }

    if (this.state.phase === 'cache-open') {
      return (
        <CacheContents
          mode='tour-stop'
          items={this.props.items}
          events={events}
          auth={this.props.auth}
          onClose={this.props.onClose}
          addChip={this.props.addChip}
          selectPhoto={this.props.selectPhoto}
          givePhoto={this.props.givePhoto}
          giveSnack={this.props.giveSnack}
          onPickUp={(event) => {
            this.props.onPickup([event]);
          }}
        />
      );
    }

    const hasCheckinLog = this.props.logs && this.props.instance && this.props.logs.some(log =>
      log.event_type === 'VIEW_PLAQUE' && parseInt(log.content_id) === parseInt(this.props.instance.object_id)
    );

    if (this.state.phase === 'details') {
      return (
        <View style={{
          flex: 1,
          backgroundColor: '#FFFDF8',
          marginTop: 10,
          marginLeft: 10,
          marginRight: 10,
          borderColor: 'rgb(85,61,43)',
          borderTopWidth: 10,
          borderLeftWidth: 10,
          borderRightWidth: 10,
        }}>
          <View style={{
            height: 10,
            backgroundColor: 'rgb(194,184,158)',
          }} />
          <View style={{
            padding: 10,
          }}>
            <Text style={{
              fontSize: 24,
              textAlign: 'center',
            }}>
              {this.props.plaque.name}
            </Text>
          </View>
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
          <ScrollView style={{flex: 1, alignSelf: 'stretch', margin: 10}}>
            <FixedMarkdown text={this.props.plaque.description} />
          </ScrollView>
          <View style={globalstyles.closeContainer} pointerEvents="box-none">
            <TouchableOpacity onPress={() => {
              if (hasCheckinLog) {
                this.props.onClose();
              } else {
                this.props.onCheckin();
                if (events.length === 0) {
                  this.props.onClose();
                } else {
                  this.setState({phase: 'cache-closed'});
                }
              }
            }}>
              <Image
                style={globalstyles.closeButton}
                source={require("../web/assets/img/quest-close.png")}
              />
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return (
      <ImageBackground source={require('../web/assets/img/tour-stop.png')} style={{
        backgroundColor: 'white',
        flex: 1,
        alignItems: 'center',
      }} imageStyle={{
        resizeMode: 'stretch',
      }}>
        <View style={{
          width: `${((803 - 135) / 910) * 100}%`,
          height: `${((306 - 135) / 1624) * 100}%`,
          left: `${(135 / 910) * 100}%`,
          top: `${(135 / 1624) * 100}%`,
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: 24,
          }}>
            {this.props.plaque.name}
          </Text>
        </View>
        <CacheMedias
          medias={[this.props.plaque.media_id].filter(x => parseInt(x)).map(media_id =>
            ({media_id: media_id, auth: this.props.auth, online: true})
          )}
          withURLs={(urls) => {
            const url = urls[0];
            return (
              <Image
                source={url}
                style={{
                  width: `${(420 / 910) * 100}%`,
                  height: `${(420 / 1624) * 100}%`,
                  left: `${(246 / 910) * 100}%`,
                  top: `${(435 / 1624) * 100}%`,
                  position: 'absolute',
                  resizeMode: 'contain',
                }}
              />
            );
          }}
        />
        {
          this.state.phase === 'start' && (
            <TouchableOpacity onPress={() => {
              this.setState({phase: 'details'});
            }} style={{
              backgroundColor: 'white',
              padding: 8,
              borderRadius: 5,
              position: 'absolute',
              bottom: '20%',
            }}>
              <Text style={{
                color: '#647033',
                fontWeight: 'bold',
                fontSize: 20,
                textTransform: 'uppercase',
              }}>
                {
                  hasCheckinLog ? 'View' : 'Check in'
                }
              </Text>
            </TouchableOpacity>
          )
        }
        {
          this.state.phase === 'cache-closed' ? (
            <TouchableOpacity onPress={() => {
              this.setState({phase: 'cache-open'});
            }} style={{
              width: '80%',
              height: '30%',
              left: '10%',
              top: '60%',
              position: 'absolute',
            }}>
              <Image source={require('../web/assets/img/tour-stop-cache.png')} style={{
                width: '100%',
                height: '100%',
                left: 0,
                top: 0,
                position: 'absolute',
                resizeMode: 'contain',
              }} />
            </TouchableOpacity>
          ) : (
            <View style={globalstyles.closeContainer} pointerEvents="box-none">
              <TouchableOpacity onPress={this.props.onClose}>
                <Image
                  style={globalstyles.closeButton}
                  source={require("../web/assets/img/quest-close.png")}
                />
              </TouchableOpacity>
            </View>
          )
        }
      </ImageBackground>
    );
  }
}
