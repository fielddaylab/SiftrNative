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
import {loadMedia, CacheMedia} from "./media";
import { StatusSpace } from "./status-space";
import { StemportsPicker } from "./stemports-picker";
import { NativeSettings } from "./native-settings";
import { deserializeGame } from "./aris";

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

    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <ScrollView style={{flex: 1}}>
          <View style={{justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center'}}>
            {
              this.props.inQuest ? (
                <TouchableOpacity onPress={() => this.setState({sideMenu: true})}>
                  <Image
                    style={{
                      width: 44 * 1,
                      height: 44 * 1,
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
                  width: 44 * 1,
                  height: 44 * 1,
                  margin: 15,
                }}
                source={require("../web/assets/img/icon-gear.png")}
              />
            </TouchableOpacity>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: 15,
            borderBottomWidth: 2,
            borderColor: 'rgb(223,230,237)',
          }}>
            <View style={{flex: 1, alignItems: 'flex-start'}}>
              <Text style={{
                fontWeight: 'bold',
                fontSize: 20,
              }}>
                {this.props.auth.authToken.display_name || this.props.auth.authToken.username}
              </Text>
              {
                this.props.currentQuest && (
                  <View style={{
                    backgroundColor: 'rgb(101,88,245)',
                    padding: 5,
                    borderRadius: 5,
                    marginTop: 10,
                    marginBottom: 10,
                  }}>
                    <Text style={{color: 'white'}}>
                      Playing: {this.props.currentQuest.name}
                    </Text>
                  </View>
                )
              }
              {
                this.props.game && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Image source={require('../web/assets/img/stemports-station.png')} style={{
                      width: 70 * 0.5,
                      height: 66 * 0.5,
                      marginRight: 5,
                    }} />
                    <Text>
                      at: {this.props.game.name}
                    </Text>
                  </View>
                )
              }
            </View>
            <View style={{flex: 1, alignItems: 'center'}}>
              <CacheMedia
                media_id={this.props.auth.authToken.media_id}
                auth={this.props.auth}
                online={this.props.online}
                withURL={url =>
                  <Image source={url} style={{
                    height: 100,
                    width: 100,
                    resizeMode: 'contain',
                  }} />
                }
              />
            </View>
          </View>
          <View style={{
            padding: 25,
            borderBottomWidth: 2,
            borderColor: 'rgb(223,230,237)',
            flexDirection: 'row',
            alignItems: 'stretch',
          }}>
            <TouchableOpacity onPress={() =>
              this.setState({questList: true})
            } style={{
              alignItems: 'center',
              flex: 1,
            }}>
              <Image style={{
                height: 35,
                margin: 10,
                resizeMode: 'contain',
              }} source={require('../web/assets/img/stemports-home-quest.png')} />
              <Text style={{
                fontSize: 17,
              }}>
                My Quests
              </Text>
            </TouchableOpacity>
            <View style={{
              backgroundColor: 'rgb(223,230,237)',
              width: 2,
            }} />
            <TouchableOpacity onPress={() =>
              this.setState({stationList: true})
            } style={{
              alignItems: 'center',
              flex: 1,
            }}>
              <Image style={{
                height: 35,
                margin: 10,
                resizeMode: 'contain',
              }} source={require('../web/assets/img/stemports-home-station.png')} />
              <Text style={{
                fontSize: 17,
              }}>
                Stations
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{
            padding: 25,
            borderBottomWidth: 2,
            borderColor: 'rgb(223,230,237)',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgb(247,249,250)',
          }}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={{
                fontSize: 17,
                margin: 3,
                fontWeight: 'bold',
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
                  backgroundColor: 'white',
                  padding: 10,
                  borderRadius: 4,
                  borderColor: 'rgb(205,202,248)',
                  borderWidth: 2,
                }}>
                  <Text style={{color: 'rgb(101,88,245)'}}>Sync Game</Text>
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
              style={{
                width: 140 * 0.45,
                height: 140 * 0.45,
                margin: 5,
              }}
              source={require("../web/assets/img/quest-close.png")}
            />
          </TouchableOpacity>
        </View>
        {
          this.state.sideMenu && (
            <Modal transparent={true} onRequestClose={() => this.setState({sideMenu: false})}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                flex: 1,
              }}>
                <View style={{
                  backgroundColor: 'white',
                  paddingTop: 50,
                }}>
                  <TouchableOpacity onPress={this.props.onToggleWarp} style={{
                    padding: 20,
                  }}>
                    <Text style={{fontSize: 17}}>
                      {this.props.warpOn ? 'Stop Warping to Station' : 'Warp to Station'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={this.props.onResetProgress} style={{
                    padding: 20,
                  }}>
                    <Text style={{fontSize: 17}}>
                      Reset Progress
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableWithoutFeedback onPress={() => this.setState({sideMenu: false})}>
                  <View style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    flex: 1,
                  }} />
                </TouchableWithoutFeedback>
              </View>
            </Modal>
          )
        }
      </View>
    );
  }
}
