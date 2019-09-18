"use strict";

import React from "react";
import update from "immutability-helper";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Image,
  SafeAreaView
} from "react-native";
import { styles, Text } from "./styles";
import { NativeCard } from './native-browser';
import {deserializeGame} from "./aris";
import {loadMedia, CacheMedia} from "./media";
import { StatusSpace } from "./status-space";
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';

const RNFS = require("react-native-fs");

export class StemportsPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      games: [],
      downloadedGames: [],
    };
  }

  componentDidMount() {
    RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/siftrs`, {NSURLIsExcludedFromBackupKey: true}).then(() => {
      this.getGames(1, 0);
      this.loadDownloadedGames();
    });
  }

  getGames(game_id, missed) {
    if (missed >= 20) {
      return;
    }
    this.props.auth.getGame({game_id}, res => {
      if (res.returnCode === 0) {
        let game = res.data;
        this.props.auth.call('quests.getQuestsForGame', {game_id}, resQuests => {
          if (resQuests.returnCode === 0) {
            game = update(game, {quests: {$set: resQuests.data}});
          }
          this.setState(state => update(state, {games: {$push: [game]}}));
          this.getGames(game_id + 1, 0);
        });
      } else {
        this.getGames(game_id + 1, missed + 1);
      }
    });
  }

  loadDownloadedGames() {
    this.setState({downloadedGames: [], gameModal: null}, () => {
      RNFS.readDir(`${RNFS.DocumentDirectoryPath}/siftrs`).then(items => {
        items.forEach(item => {
          RNFS.exists(`${item.path}/download_timestamp.txt`).then(exist => {
            if (exist) {
              Promise.all([
                RNFS.readFile(`${item.path}/game.txt`),
                RNFS.readFile(`${item.path}/quests.txt`),
              ]).then(([json, quests]) => {
                const game = update(
                  deserializeGame(JSON.parse(json)),
                  {quests: {$set: JSON.parse(quests)}}
                );
                this.setState(state => update(state, {downloadedGames: {$push: [game]}}));
              });
            }
          });
        });
      });
    });
  }

  initializeGame(game) {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${game.game_id}`;
    return RNFS.mkdir(siftrDir, {NSURLIsExcludedFromBackupKey: true}).then(() => {
      const writeJSON = (name) => {
        return (data) => RNFS.writeFile(`${siftrDir}/${name}.txt`, JSON.stringify(data));
      }
      return Promise.all([

        this.props.auth.promise('call', 'plaques.getPlaquesForGame', {
          game_id: game.game_id,
        }).then(writeJSON('plaques')),

        this.props.auth.promise('call', 'items.getItemsForGame', {
          game_id: game.game_id,
        }).then(writeJSON('items')),

        this.props.auth.promise('getTagsForGame', {
          game_id: game.game_id,
        }).then(writeJSON('tags')),

        this.props.auth.promise('call', 'tags.getObjectTagsForGame', {
          game_id: game.game_id,
        }).then(writeJSON('object_tags')),

        this.props.auth.promise('call', 'quests.getQuestsForGame', {
          game_id: game.game_id,
        }).then(writeJSON('quests')),

        this.props.auth.promise('call', 'requirements.getRequirementRootPackagesForGame', {
          game_id: game.game_id,
        }).then(writeJSON('requirement_root_packages')),

        this.props.auth.promise('call', 'requirements.getRequirementAndPackagesForGame', {
          game_id: game.game_id,
        }).then(writeJSON('requirement_and_packages')),

        this.props.auth.promise('call', 'requirements.getRequirementAtomsForGame', {
          game_id: game.game_id,
        }).then(writeJSON('requirement_atoms')),

        this.props.auth.promise('call', 'client.touchItemsForPlayer', {
          game_id: game.game_id,
        }).then(() =>
          this.props.auth.promise('call', 'instances.getInstancesForGame', {
            game_id: game.game_id,
            owner_id: this.props.auth.authToken.user_id,
          })
        ).then(writeJSON('inventory')),

        this.props.auth.promise('call', 'instances.getInstancesForGame', {
          game_id: game.game_id,
        }).then(writeJSON('instances')),

        this.props.auth.promise('call', 'client.getLogsForPlayer', {
          game_id: game.game_id,
        }).then(writeJSON('logs')),

        this.props.auth.promise('call', 'factories.getFactoriesForGame', {
          game_id: game.game_id,
        }).then(writeJSON('factories')),

        this.props.auth.promise('call', 'triggers.getTriggersForGame', {
          game_id: game.game_id,
        }).then(writeJSON('triggers')),

        this.props.auth.promise('getFieldsForGame', {
          game_id: game.game_id,
        }).then(writeJSON('fields')),

        this.props.auth.promise('getUsersForGame', {
          game_id: game.game_id,
        }).then(writeJSON('authors')),

        this.props.auth.promise('getTheme', {
          theme_id: game.theme_id != null ? game.theme_id : 1,
        }).then(writeJSON('theme')),

        this.props.auth.promise('getColors', {
          colors_id: game.colors_id != null ? game.colors_id : 1,
        }).then(writeJSON('colors')),

        this.props.auth.promise('call', 'events.getEventsForGame', {
          game_id: game.game_id,
        }).then(writeJSON('events')),

        this.props.auth.promise('call', 'events.getEventPackagesForGame', {
          game_id: game.game_id,
        }).then(writeJSON('event_packages')),

        this.props.auth.promise('siftrSearch', {
          game_id: game.game_id,
          order: "recent",
          map_data: false,
        }).then(({notes}) =>
          Promise.all(notes.map(note => this.props.auth.promise('getFieldDataForNote', {
            note_id: note.note_id,
          }))).then(field_data => {
            return writeJSON('notes')(notes.map((note, i) =>
              update(note, {field_data: {$set: field_data[i]}})
            ));
          })
        ),

        this.props.auth.promise('call', 'media.getMediaForGame', {
          game_id: game.game_id,
        }).then(medias =>
          Promise.all(medias.map(media => new Promise((resolve, reject) => {
            loadMedia({
              media_id: media.media_id,
              auth: this.props.auth,
            }, resolve);
          })))
        ),

        writeJSON('game')(game),

      ]).then(() =>
        RNFS.writeFile(`${siftrDir}/download_timestamp.txt`, Date.now())
      );
    });
  }

  render() {
    let games = {};
    this.state.games.forEach(g => {
      if (!games[g.game_id]) games[g.game_id] = {};
      games[g.game_id].online = g;
    });
    this.state.downloadedGames.forEach(g => {
      if (!games[g.game_id]) games[g.game_id] = {};
      games[g.game_id].offline = g;
    });
    let gameList = [];
    for (let g in games) {
      gameList.push(games[g]);
    }
    return (
      <View style={{flex: 1}}>
        <MapView
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            // TODO change these
            latitude: 0,
            longitude: -90,
            latitudeDelta: 180,
            longitudeDelta: 180,
          }}
          style={{
            flex: 1,
          }}
          showsUserLocation={true}
          mapType="standard"
        >
          {
            gameList.map(obj => {
              const game = obj.online || obj.offline;
              return (
                <MapView.Marker
                  key={game.game_id}
                  tracksViewChanges={false}
                  coordinate={{
                    latitude: game.latitude,
                    longitude: game.longitude,
                  }}
                  onPress={() => this.setState({gameModal: obj})}
                >
                  <MapView.Callout tooltip={true} />
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: 'rgb(40,80,120)',
                      borderRadius: 15,
                      borderWidth: 2,
                      borderColor: 'white',
                    }}
                  />
                </MapView.Marker>
              );
            })
          }
        </MapView>
        {
          this.state.gameModal && (() => {
            const obj = this.state.gameModal;
            const game = obj.online || obj.offline;
            const newVersion = obj.online && obj.offline && obj.online.version !== obj.offline.version;
            return (
              <Modal transparent={true} onRequestClose={() => this.setState({gameModal: null})}>
                <SafeAreaView style={{flex: 1}}>
                  <StatusSpace
                    backgroundColor="rgba(0,0,0,0)"
                    leaveBar={true}
                  />
                  <View style={{
                    flex: 1,
                    backgroundColor: 'white',
                    alignItems: 'stretch',
                  }}>
                    <View style={{alignItems: 'center', padding: 10}}>
                      <CacheMedia
                        media_id={game.icon_media_id}
                        auth={this.props.auth}
                        online={true}
                        withURL={(url) =>
                          <View style={{margin: 10, alignItems: 'stretch', alignSelf: 'stretch'}}>
                            <Image
                              source={url}
                              style={{
                                height: 125,
                                resizeMode: 'contain',
                              }}
                            />
                          </View>
                        }
                      />
                      <View style={{margin: 10}}>
                        <Text style={{fontWeight: 'bold'}}>{game.name}</Text>
                      </View>
                      <View style={{margin: 10}}>
                        <Text>{game.description}</Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: 'rgb(155,186,242)',
                      borderColor: 'black',
                      borderWidth: 1,
                      padding: 10,
                      alignItems: 'center',
                    }}>
                      <Text>Quests</Text>
                    </View>
                    <ScrollView style={{flex: 1, borderColor: 'black', borderWidth: 1}}>
                      {
                        (game.quests || []).filter(quest =>
                          !parseInt(quest.parent_quest_id)
                        ).map(quest =>
                          <View key={quest.quest_id} style={{margin: 5}}>
                            <Text>{quest.name}</Text>
                          </View>
                        )
                      }
                    </ScrollView>
                    <View style={{alignItems: 'center', padding: 10}}>
                      {
                        obj.offline && (
                          <TouchableOpacity onPress={() => this.props.onSelect(game)} style={{
                            width: 200,
                            padding: 10,
                            borderColor: 'black',
                            borderWidth: 1,
                            backgroundColor: 'white',
                          }}>
                            <Text>Launch</Text>
                          </TouchableOpacity>
                        )
                      }
                      {
                        obj.online && (
                          <TouchableOpacity onPress={() =>
                            this.initializeGame(game).then(() => this.loadDownloadedGames())
                          } style={{
                            width: 200,
                            padding: 10,
                            borderColor: 'black',
                            borderWidth: 1,
                            backgroundColor: 'white',
                          }}>
                            <Text>{newVersion ? "Download (update!)" : "Download"}</Text>
                          </TouchableOpacity>
                        )
                      }
                      <TouchableOpacity onPress={() => this.setState({gameModal: null})} style={{
                        width: 200,
                        padding: 10,
                        borderColor: 'black',
                        borderWidth: 1,
                        backgroundColor: 'white',
                      }}>
                        <Text>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </SafeAreaView>
              </Modal>
            );
          })()
        }
      </View>
    );
  }
}
