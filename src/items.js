'use strict';

import React from 'react';
import {
  Text
, View
, TouchableOpacity
, ScrollView
, Image
} from 'react-native';
import {CacheMedia} from './media';
import {WebView} from 'react-native-webview';

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
      instances: null,
      viewing: null,
    };
  }

  componentWillMount() {
    this.props.auth.call('instances.getInstancesForGame', {
      game_id: this.props.game.game_id,
      owner_id: this.props.auth.authToken.user_id,
    }, (res) => {
      if (res.returnCode === 0) {
        this.setState({instances: res.data});
      }
    });
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

    const itemInstances = this.state.instances == null ? [] : this.state.instances.filter(inst =>
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
      if (a_empty === b_empty) {
        const a_tag = parseInt(a.tag.sort_index);
        const b_tag = parseInt(b.tag.sort_index);
        return a_tag - b_tag;
      }
      if (a_empty) return 1;
      if (b_empty) return -1;
    });

    return (
      <View style={{
        backgroundColor: 'rgb(243,237,225)',
        flex: 1,
      }}>
        <ScrollView style={{flex: 1}}>
          {
            tags.map(o => {
              const tag = o.tag;
              const items = o.items;
              return (
                <View key={tag.tag_id}>
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
                          row.map(o =>
                            <TouchableOpacity key={o.item.item_id} style={{
                              flex: 1,
                            }} onPress={o.instance && (() => {
                              this.setState({viewing: {item: o.item, instance: o.instance}});
                            })}>
                              <CacheMedia
                                media_id={o.item.media_id}
                                auth={this.props.auth}
                                online={true}
                                withURL={(url) => (
                                  <Image
                                    source={url}
                                    style={{
                                      height: 60,
                                      margin: 10,
                                      resizeMode: 'contain',
                                      opacity: o.instance ? 1 : 0.4,
                                    }}
                                  />
                                )}
                              />
                              <Text style={{
                                margin: 10,
                              }}>
                                {o.item.name}
                              </Text>
                            </TouchableOpacity>
                          )
                        }
                      </View>
                    )
                  }
                </View>
              );
            })
          }
          {
            null
            /*
            itemInstances.map(inst => {
              const item = (this.props.items || []).find(x => parseInt(x.item_id) === parseInt(inst.object_id));
              return (
                <TouchableOpacity key={inst.instance_id} style={{
                  padding: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                }} onPress={() =>
                  this.setState({viewing: {item: item, instance: inst}})
                }>
                  <CacheMedia
                    media_id={item.media_id}
                    auth={this.props.auth}
                    online={true}
                    withURL={(url) => (
                      <Image
                        source={url}
                        style={{
                          height: 100,
                          width: 100,
                          margin: 10,
                          resizeMode: 'contain',
                        }}
                      />
                    )}
                  />
                  <View style={{flex: 1}}>
                    <Text style={{fontWeight: 'bold'}}>{item ? item.name : '…'}</Text>
                    <Text>Quantity: {inst.qty}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
            */
          }
        </ScrollView>
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
