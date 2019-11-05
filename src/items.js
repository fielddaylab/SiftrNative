'use strict';

import React from 'react';
import {
  Text
, View
, TouchableOpacity
, ScrollView
, Image
, Animated
, PanResponder
} from 'react-native';
import {CacheMedia} from './media';
import {WebView} from 'react-native-webview';
import ModelView from '../react-native-3d-model-view/lib/ModelView';
import update from "immutability-helper";

export class FullWidthWebView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <View
        style={this.props.style}
        onLayout={event => {
          this.setState({webViewWidth: event.nativeEvent.layout.width});
        }}
      >
        <WebView
          style={{
            flex: 1,
            width: this.state.webViewWidth,
          }}
          source={this.props.source}
          originWhitelist={this.props.originWhitelist}
          useWebKit={true}
        />
      </View>
    );
  }
}

export function webViewBoilerplate(str) {
  return `
    <html>
    <head>
      <style type='text/css'>
      html { margin:0; padding:0; }
      body {
          color:#000000;
          font-size:20px;
          font-family:HelveticaNeue-Light;
          margin:0;
          padding:10;
          zoom:2.0;
      }
      a { color: #000000; text-decoration: underline; }
      </style>
    </head>
    <body>${str}</body>
    </html>
  `;
}

export const ItemScreen = (props) => (
  <View style={{
    flex: 1,
    backgroundColor: 'rgb(149,169,153)',
    flexDirection: 'column',
    paddingLeft: 10,
    paddingRight: 10,
  }}>
    <CacheMedia
      media_id={props.item.media_id}
      auth={props.auth}
      online={true}
      withURL={(url) => {
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
        } else {
          return (
            <View style={{marginTop: 20, marginBottom: 20}}>
              <Image
                source={url}
                style={{
                  height: 150,
                  resizeMode: 'contain',
                }}
              />
            </View>
          );
        }
      }}
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
        {props.item.name}
      </Text>
      <FullWidthWebView
        style={{
          flex: 1,
          alignSelf: 'stretch',
          margin: 10,
        }}
        source={{html: webViewBoilerplate(props.item.description)}}
        originWhitelist={["*"]}
      />
      {
        props.type === 'trigger' ? (
          <View style={{alignItems: 'center'}}>
            <TouchableOpacity onPress={() => {
              props.onPickUp(props.trigger);
              props.onClose();
            }} style={{
              margin: 15,
              padding: 10,
              backgroundColor: 'rgb(114,236,222)',
              borderRadius: 10,
              fontSize: 20,
            }}>
              <Text>Add to Codex</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
        )
      }
    </View>
  </View>
);

function groupBy(n, xs) {
  let ys = [];
  while (true) {
    if (xs.length === 0) break;
    if (xs.length <= n) {
      ys.push(xs);
      break;
    }
    ys.push(xs.slice(0, n));
    xs = xs.slice(n);
  }
  return ys;
}

export class InventoryScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewing: null,
    };
    this._itemSlots = {};
  }

  render() {
    if (this.state.viewing) {
      return (
        <ItemScreen
          type="inventory"
          item={this.state.viewing.item}
          auth={this.props.auth}
          onClose={() => this.setState({viewing: null})}
        />
      );
    }

    const itemInstances = this.props.inventory.filter(inst =>
      inst.object_type === 'ITEM'
      && inst.owner_type === 'USER'
      && parseInt(inst.qty) > 0
    );

    const tags = (this.props.tags || []).map(tag => {
      let taggedItems = [];
      (this.props.object_tags || []).forEach(object_tag => {
        if (object_tag.object_type !== 'ITEM') return;
        if (parseInt(object_tag.tag_id) === parseInt(tag.tag_id)) {
          const item = (this.props.items || []).find(x => parseInt(x.item_id) === parseInt(object_tag.object_id));
          if (!item) return;
          taggedItems.push({
            item: item,
            instance: itemInstances.find(inst => parseInt(inst.object_id) === parseInt(item.item_id)),
          });
        }
      });
      return {tag: tag, items: taggedItems};
    }).sort((a, b) => {
      const a_empty = !a.items.some(item => item.instance);
      const b_empty = !b.items.some(item => item.instance);
      if (true /* a_empty === b_empty */) {
        const a_tag = parseInt(a.tag.sort_index);
        const b_tag = parseInt(b.tag.sort_index);
        if (a_tag === b_tag) {
          return parseInt(a.tag.tag_id) - parseInt(b.tag.tag_id);
        } else {
          return a_tag - b_tag;
        }
      }
      if (a_empty) return 1;
      if (b_empty) return -1;
    });

    const untaggedInstances = itemInstances.filter(inst =>
      !(tags.some(tag => tag.items.some(item => item.instance === inst)))
    );

    return (
      <View style={{
        backgroundColor: 'rgb(243,237,225)',
        flex: 1,
        alignItems: 'stretch',
      }}>
        <ScrollView style={{flex: 1}}>
          {
            untaggedInstances.map(inst => {
              const item = (this.props.items || []).find(x => parseInt(x.item_id) === parseInt(inst.object_id));
              return (
                <TouchableOpacity key={inst.instance_id} onPress={() =>
                  this.setState({viewing: {item: item, instance: inst}})
                }>
                  <Text style={{
                    margin: 10,
                    textAlign: 'center',
                  }}>
                    {inst.qty} x {item ? item.name : '???'}
                  </Text>
                </TouchableOpacity>
              );
            })
          }
          {
            tags.map(o => {
              const tag = o.tag;
              const items = o.items;
              return (
                <View key={tag.tag_id} ref={slot => this._itemSlots[tag.tag_id] = slot}>
                  <Text style={{
                    textAlign: 'center',
                    margin: 10,
                    fontWeight: 'bold',
                  }}>
                    {tag.tag}
                  </Text>
                  {
                    groupBy(4, items).map((row, i) =>
                      <View key={i} style={{
                        flexDirection: 'row',
                        alignItems: 'stretch',
                      }}>
                        {
                          row.map(o => {
                            const isPlaced = o.instance;
                            return (
                              <TouchableOpacity key={o.item.item_id} style={{
                                flex: 1,
                              }} onPress={() =>
                                isPlaced && this.setState({viewing: {item: o.item, instance: o.instance}})
                              }>
                                <CacheMedia
                                  media_id={o.item.icon_media_id || o.item.media_id}
                                  auth={this.props.auth}
                                  online={true}
                                  withURL={(url) => (
                                    isPlaced ? (
                                      <Image
                                        source={url}
                                        style={{
                                          height: 60,
                                          margin: 10,
                                          resizeMode: 'contain',
                                        }}
                                      />
                                    ) : (
                                      <View
                                        style={{
                                          height: 60,
                                          margin: 10,
                                          backgroundColor: 'gray',
                                          borderRadius: 999,
                                        }}
                                      />
                                    )
                                  )}
                                />
                                <Text style={{
                                  margin: 10,
                                  textAlign: 'center',
                                }}>
                                  {isPlaced ? o.item.name : '???'}
                                </Text>
                              </TouchableOpacity>
                            );
                          })
                        }
                      </View>
                    )
                  }
                </View>
              );
            })
          }
        </ScrollView>
        <View style={{height: 100, alignItems: 'stretch', borderColor: 'black', borderWidth: 1}}>
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch'}}>
            {
              this.props.pickedUpRemnants.map(item_id => {
                const item = (this.props.items || []).find(x => parseInt(x.item_id) === parseInt(item_id));
                if (!item) return null;
                const object_tag = (this.props.object_tags || []).find(otag =>
                  otag.object_type === 'ITEM' && parseInt(otag.object_id) === parseInt(item.item_id)
                );
                if (!object_tag) return null;
                const tag_id = object_tag.tag_id;
                return (
                  <DraggableItem
                    key={item_id}
                    auth={this.props.auth}
                    item={item}
                    onRelease={(gestureState, cb) => {
                      if (this._itemSlots[tag_id]) {
                        this._itemSlots[tag_id].measure((ox, oy, width, height, px, py) => {
                          const inBounds =
                            px <= gestureState.moveX && gestureState.moveX <= px + width &&
                            py <= gestureState.moveY && gestureState.moveY <= py + height;
                          if (inBounds) {
                            this.props.onPlace(item_id);
                          }
                          cb(inBounds);
                        });
                      } else {
                        cb(false); // probably shouldn't happen
                      }
                    }}
                  />
                );
              })
            }
          </View>
        </View>
        <View style={{
          margin: 15,
          alignItems: 'center',
        }}>
          <TouchableOpacity onPress={this.props.onClose}>
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
    );
  }
}

export class DraggableItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this._val = {x: 0, y: 0}
    this._pan = new Animated.ValueXY();
    this._pan.addListener(value => this._val = value);
    this._pan.setValue({x: 0, y: 0});
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderMove: (evt, gestureState) => {
        this._lastMoveX = gestureState.moveX;
        this._lastMoveY = gestureState.moveY;
        Animated.event([
          null, { dx: this._pan.x, dy: this._pan.y }
        ])(evt, gestureState);
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.props.onRelease({moveX: this._lastMoveX, moveY: this._lastMoveY}, (inBounds) => {
          if (!inBounds) {
            Animated.spring(this._pan, {
              toValue: { x: 0, y: 0 },
              friction: 5
            }).start();
          }
        });
      },
    });
  }

  render() {
    return (
      <Animated.View
        {...this._panResponder.panHandlers}
        style={{transform: this._pan.getTranslateTransform()}}
      >
        <CacheMedia
          media_id={this.props.item.icon_media_id || this.props.item.media_id}
          auth={this.props.auth}
          online={true}
          withURL={(url) => (
            <Image
              source={url}
              style={{
                flex: 1,
                margin: 10,
                resizeMode: 'contain',
              }}
            />
          )}
        />
        <Text style={{
          margin: 10,
        }}>
          {this.props.item.name}
        </Text>
      </Animated.View>
    );
  }
}
