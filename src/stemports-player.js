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
    if (this.state.viewingComic != null) {
      return (
        <ComicView
          startPage={this.state.viewingComic}
          onClose={() => this.setState({viewingComic: null})}
          closeButton={true}
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
          mode="quests"
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
            Reset Progress
          </Text>
        </TouchableOpacity>
      </View>
    );

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
              <CacheMedia
                media_id={920}
                auth={this.props.auth}
                online={true}
                withURL={(url) =>
                  <View pointerEvents="none" style={{flex: 1, alignItems: 'center'}}>
                    <ModelView
                      source={{ zip: url }}
                      style={{
                        width: 100,
                        height: 150,
                      }}
                      autoPlay={true}
                    />
                  </View>
                }
              />
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
                  My Quests
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
            <Text style={{padding: 30, fontSize: 20, fontWeight: 'bold'}}>Story Panels</Text>
            <View style={{
              justifyContent: 'center',
              flexWrap: 'wrap',
              flexDirection: 'row',
            }}>
              {
                ComicPages.map((page, i) =>
                  <TouchableOpacity key={i} style={{
                    margin: 10,
                  }} onPress={() => this.setState({viewingComic: i})}>
                    <Image
                      style={{
                        width: 80,
                        height: 100,
                        resizeMode: 'contain',
                      }}
                      source={page}
                    />
                  </TouchableOpacity>
                )
              }
            </View>
          </ScrollView>
          <View style={{
            alignItems: 'center',
          }}>
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

const ComicPages = [
  require('../web/assets/img/comic/01.jpg'),
  require('../web/assets/img/comic/02.jpg'),
  require('../web/assets/img/comic/03.jpg'),
  require('../web/assets/img/comic/04.jpg'),
  require('../web/assets/img/comic/05.jpg'),
  require('../web/assets/img/comic/06.jpg'),
  require('../web/assets/img/comic/07.jpg'),
  require('../web/assets/img/comic/08.jpg'),
  require('../web/assets/img/comic/09.jpg'),
  require('../web/assets/img/comic/10.jpg'),
  require('../web/assets/img/comic/11.jpg'),
  require('../web/assets/img/comic/12.jpg'),
  require('../web/assets/img/comic/13.jpg'),
  require('../web/assets/img/comic/14.jpg'),
];

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
          if (this.state.page >= ComicPages.length - 1) {
            this.props.onClose();
          } else {
            this.setState(prevState => {
              const newPage = prevState.page + 1;
              if (newPage > ComicPages.length) {
                newPage = ComicPages.length - 1;
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
            source={ComicPages[this.state.page]}
          />
        </TouchableOpacity>
        {
          this.props.closeButton && (
            <View style={{
              alignItems: 'center',
              paddingTop: 30,
            }}>
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
