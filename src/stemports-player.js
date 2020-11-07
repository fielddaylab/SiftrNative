"use strict";

import React from "react";
import update from "immutability-helper";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  SafeAreaView,
  TouchableWithoutFeedback
} from "react-native";
import { styles, Text } from "./styles";
import { globalstyles } from "./global-styles";
import {loadMedia, CacheMedia} from "./media";
import { StatusSpace } from "./status-space";
import { StemportsPicker } from "./stemports-picker";
import { NativeSettings } from "./native-settings";
import { deserializeGame } from "./aris";
import { PhotoImages, PhotoItemIDs } from "./items";
import ModelView from '../react-native-3d-model-view/lib/ModelView';
import SideMenu from 'react-native-side-menu-updated';

const RNFS = require("react-native-fs");

export class StemportsPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: false,
      games: [],
    };
  }

  componentDidMount() {
    this.loadGames();
  }

  loadGames() {
    this.setState({games: []}, () => {
      RNFS.readDir(`${RNFS.DocumentDirectoryPath}/siftrs`).then(items => {
        items.forEach(item => {
          RNFS.exists(`${item.path}/download_timestamp.txt`).then(exist => {
            if (exist) {
              Promise.all([
                RNFS.readFile(`${item.path}/game.txt`),
                RNFS.readFile(`${item.path}/fields.txt`),
                RNFS.readFile(`${item.path}/guides.txt`),
                RNFS.readFile(`${item.path}/inventory.txt`),
                RNFS.readFile(`${item.path}/quests-sorted.txt`).catch(() => null),
              ]).then(([json, fields, guides, inventory, quests]) => {
                const game = update(
                  deserializeGame(JSON.parse(json)),
                  {
                    fields: {$set: JSON.parse(fields)},
                    guides: {$set: JSON.parse(guides)},
                    inventory: {$set: JSON.parse(inventory)},
                    quests: {$set: quests && JSON.parse(quests)},
                  }
                );
                this.setState(state => update(state, {games: {$push: [game]}}));
              });
            }
          });
        });
      });
    });
  }

  getCompleteGuides() {
    let guides = [];
    this.state.games.forEach(game => {
      game.guides.forEach(guide => {
        const field = game.fields.find(field => parseInt(field.field_id) === parseInt(guide.field_id));
        if (!field) return;
        const complete = field.options.every(option =>
          !parseInt(option.remnant_id) || game.inventory.find(inst =>
            inst.object_type === 'ITEM'
            && inst.owner_type === 'USER'
            && parseInt(inst.object_id) === parseInt(option.remnant_id)
            && parseInt(inst.qty) > 0
          )
        );
        if (complete) {
          guides.push({game: game, guide: guide, field: field});
        }
      });
    });
    return guides;
  }

  getCompleteQuests() {
    let quests = [];
    this.state.games.forEach(game => {
      game.quests && game.quests.complete.forEach(quest => {
        quests.push({game: game, quest: quest});
      });
    });
    return quests;
  }

  currentLevel() {
    const cutoffs = [0, 10, 50, 100, 250, 500, 1000];
    const instance = (this.props.inventory_zero || []).find(inst =>
      inst.object_type === 'ITEM' && parseInt(inst.object_id) === 35
    );
    const xp = instance ? parseInt(instance.qty) : 0;
    const level = cutoffs.filter(cutoff => xp >= cutoff).length;
    return {
      level: level,
      xp: xp,
      this_cutoff: cutoffs[level - 1],
      next_cutoff: cutoffs[level],
    };
  }

  render() {
    if (this.state.viewingPhoto != null) {
      return (
        <PhotoView
          photoID={this.state.viewingPhoto}
          items={this.props.items}
          onClose={() => this.setState({viewingPhoto: null})}
        />
      );
    }

    if (this.state.settings) {
      return (
        <NativeSettings
          onClose={() => this.setState({settings: false})}
          onLogout={this.props.onLogout}
          auth={this.props.auth}
          onChangePassword={this.props.onChangePassword}
          onEditProfile={this.props.onEditProfile}
          queueMessage={this.props.queueMessage}
          online={this.props.online}
        />
      );
    }

    if (this.state.stationList) {
      return (
        <StemportsPicker
          auth={this.props.auth}
          onLogout={this.props.onLogout}
          onSelect={this.props.onSelect}
          online={this.props.online}
          onChangePassword={this.props.onChangePassword}
          onEditProfile={this.props.onEditProfile}
          queueMessage={this.props.queueMessage}
          location={this.props.location}
          onClose={() => this.setState({stationList: false})}
          mode="list"
        />
      );
    }

    if (this.state.questList) {
      return (
        <StemportsPicker
          auth={this.props.auth}
          onLogout={this.props.onLogout}
          onSelect={this.props.onSelect}
          online={this.props.online}
          onChangePassword={this.props.onChangePassword}
          onEditProfile={this.props.onEditProfile}
          queueMessage={this.props.queueMessage}
          location={this.props.location}
          onClose={() => this.setState({questList: false})}
          mode="list"
          onlyDownloaded={true}
        />
      );
    }

    const xpStuff = this.currentLevel();

    const menu = (
      <View style={{
        backgroundColor: '#333',
        flex: 1,
      }}>
        <TouchableOpacity onPress={this.props.onToggleWarp} style={{
          padding: 20,
        }}>
          <Text style={{fontSize: 17, color: 'white'}}>
            {this.props.warpOn ? 'Stop Warping to Station' : 'Warp to Station'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.props.onResetProgress} style={{
          padding: 20,
        }}>
          <Text style={{fontSize: 17, color: 'white'}}>
            Reset Station Progress
          </Text>
        </TouchableOpacity>
      </View>
    );

    let globalItems = {};
    (this.props.inventory_zero || []).forEach(inst => {
      if (inst.object_type === 'ITEM') {
        globalItems[inst.object_id] = inst.qty;
      }
    });

    return (
      <SideMenu menu={menu} isOpen={this.state.sideMenu} onChange={sideMenu => this.setState({sideMenu})}>
        <View style={{flex: 1, backgroundColor: 'white'}}>
          <ScrollView style={{flex: 1}}>
            <View style={{justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center'}}>
              {
                this.props.inQuest ? (
                  <TouchableOpacity onPress={() => this.setState({sideMenu: true})}>
                    <Image
                      style={{
                        width: 30 * 1,
                        height: 30 * 1,
                        margin: 15,
                      }}
                      source={require("../web/assets/img/menu-black.png")}
                    />
                  </TouchableOpacity>
                ) : (
                  <View />
                )
              }
              <TouchableOpacity onPress={() => this.setState({settings: true})}>
                <Image
                  style={{
                    width: 30 * 1,
                    height: 30 * 1,
                    margin: 15,
                  }}
                  source={require("../web/assets/img/icon-gear.png")}
                />
              </TouchableOpacity>
            </View>
            <View style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: 15,
            }}>
              <View style={{flex: 1, alignItems: 'flex-start'}}>
                <Text style={{
                  fontWeight: 'bold',
                  fontSize: 30,
                  letterSpacing: 1,
                  color: '#373535',
                  borderBottomWidth: 2,
                  borderColor: 'rgb(223,230,237)',
                }}>
                  {this.props.auth.authToken.display_name || this.props.auth.authToken.username}
                </Text>
                <TouchableOpacity style={{
                  marginTop: 10,
                  marginBottom: 10,
                }} onPress={() =>
                  this.props.currentQuest
                    ? this.props.onClose()
                    : this.setState({stationList: true})
                }>
                  <Text style={{
                    fontWeight: 'bold',
                    fontSize: 16,
                    color: 'rgb(106,125,27)',
                  }}>
                    {
                      this.props.currentQuest
                        ? `Currently Playing: \n${this.props.currentQuest.name}`
                        : 'Start a Quest!'
                    }
                  </Text>
                </TouchableOpacity>
                {
                  this.props.game && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Image source={require('../web/assets/img/pin.png')} style={{
                        width: 50 * 0.25,
                        height: 70 * 0.25,
                        marginRight: 5,
                      }} />
                      <Text style={{
                        color: '#B5AEAE',
                      }}>
                        {this.props.game.name}
                      </Text>
                    </View>
                  )
                }
              </View>
              <View pointerEvents="none" style={{flex: 1, alignItems: 'center'}}>
                <Image
                  source={require('../web/assets/img/player-static.png')}
                  style={{
                    width: 100,
                    height: 150,
                    resizeMode: 'contain',
                  }}
                />
              </View>
            </View>
            <View style={{
              padding: 15,
              flexDirection: 'row',
              alignItems: 'stretch',
            }}>
              <TouchableOpacity onPress={() =>
                this.setState({questList: true})
              } style={{
                alignItems: 'center',
                flex: 1,
                padding: 15,
                borderRadius: 10,
                backgroundColor: 'rgb(243,235,219)',
                marginRight: 5,
              }}>
                <Image style={{
                  height: 95,
                  margin: 10,
                  marginTop: -10,
                  resizeMode: 'contain',
                }} source={require('../web/assets/img/illustration-flags.png')} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#373535',
                }}>
                  My Stations
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() =>
                this.setState({stationList: true})
              } style={{
                alignItems: 'center',
                flex: 1,
                padding: 15,
                borderRadius: 10,
                backgroundColor: 'rgb(243,235,219)',
                marginLeft: 5,
              }}>
                <Image style={{
                  height: 95,
                  margin: 10,
                  marginTop: -10,
                  resizeMode: 'contain',
                }} source={require('../web/assets/img/illustration-stations.png')} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#373535',
                }}>
                  Stations
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{
              padding: 30,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={{
                  fontSize: 24,
                  margin: 3,
                  fontWeight: 'bold',
                  color: '#373535',
                }}>
                  Game Sync
                </Text>
                <Text style={{
                  margin: 3,
                }}>
                  {this.props.syncMessage}
                </Text>
              </View>
              {
                this.props.canSync && (
                  <TouchableOpacity onPress={this.props.onSync} style={{
                    padding: 10,
                    borderRadius: 5,
                    backgroundColor: 'rgb(106,125,27)',
                  }}>
                    <Text style={{
                      fontWeight: 'bold', color: '#ffffff',}}>Sync Game</Text>
                  </TouchableOpacity>
                )
              }
            </View>
            <Text style={{padding: 30, fontSize: 20, fontWeight: 'bold'}}>Photo Album</Text>
            <View style={{
              justifyContent: 'center',
              flexWrap: 'wrap',
              flexDirection: 'row',
            }}>
              {
                PhotoItemIDs.map((item_id, photoIndex) => {
                  if (parseInt(globalItems[item_id]) > 0) {
                    return (
                      <TouchableOpacity key={item_id} style={{
                        margin: 10,
                      }} onPress={() => this.setState({viewingPhoto: item_id})}>
                        <Image
                          style={{
                            width: 80,
                            height: 100,
                            resizeMode: 'contain',
                          }}
                          source={PhotoImages[photoIndex]}
                        />
                      </TouchableOpacity>
                    );
                  } else {
                    return (
                      <Image
                        key={item_id}
                        style={{
                          width: 80,
                          height: 100,
                          resizeMode: 'contain',
                          opacity: 0.3,
                          margin: 10,
                        }}
                        source={PhotoImages[photoIndex]}
                      />
                    );
                  }
                })
              }
            </View>
          </ScrollView>
          <View style={globalstyles.closeContainer} pointerEvents="box-none">
            <TouchableOpacity onPress={this.props.onClose}>
              <Image
                style={globalstyles.closeButton}
                source={require("../web/assets/img/quest-close.png")}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SideMenu>
    );
  }
}

export class ComicView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: props.startPage || 0,
    };
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <TouchableOpacity onPress={() => {
          if (this.state.page >= this.props.pages.length - 1) {
            this.props.onClose();
          } else {
            this.setState(prevState => {
              const newPage = prevState.page + 1;
              if (newPage > this.props.pages.length) {
                newPage = this.props.pages.length - 1;
              }
              return update(prevState, {page: {$set: newPage}});
            });
          }
        }} style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Image
            style={{flex: 1, resizeMode: 'contain'}}
            source={this.props.pages[this.state.page]}
          />
        </TouchableOpacity>
        {
          this.props.closeButton && (
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
      </View>
    );
  }
}

export class PhotoView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Image
            style={{flex: 1, resizeMode: 'contain'}}
            source={PhotoImages[PhotoItemIDs.indexOf(this.props.photoID)]}
          />
        </View>
        <View style={globalstyles.closeContainer} pointerEvents="box-none">
          <TouchableOpacity onPress={this.props.onClose}>
            <Image
              style={globalstyles.closeButton}
              source={require("../web/assets/img/quest-close.png")}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
