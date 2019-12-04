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
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import { styles, Text } from "./styles";
import {deserializeGame} from "./aris";
import {loadMedia, CacheMedia} from "./media";
import { StatusSpace } from "./status-space";
import { StemportsPlayer } from "./stemports-player";
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import {addXP, meterDistance} from './siftr-view';
import {loadQueue, uploadNote} from './upload-queue';

const RNFS = require("react-native-fs");

function addTo(xs, f, offset = 1000000) {
  // make new object with sequential ID
  const new_id = offset + xs.length;
  xs.push(f(new_id));
  return new_id;
}

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
    this.loadXP();
  }

  loadXP() {
    RNFS.readFile(`${RNFS.DocumentDirectoryPath}/siftrs/inventory-zero.txt`).then(str => {
      this.setState({inventory_zero: JSON.parse(str)});
    });
  }

  addXP(xp, inv, cb) {
    addXP(xp, inv, (new_inventory_zero) =>
      this.setState({inventory_zero: new_inventory_zero}, cb)
    );
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
    let gameToReload;
    this.setState(prevState => {
      gameToReload = prevState.gameModal;
      if (gameToReload) {
        return update(prevState, {gameModal: {$set: 'loading'}});
      } else {
        return prevState;
      }
    }, () => {
      RNFS.readDir(`${RNFS.DocumentDirectoryPath}/siftrs`).then(items => {
        Promise.all(items.map(item => {
          return RNFS.exists(`${item.path}/download_timestamp.txt`).then(exist => {
            if (exist) {
              return Promise.all([
                RNFS.readFile(`${item.path}/game.txt`),
                RNFS.readFile(`${item.path}/quests.txt`),
              ]).then(([json, quests]) => {
                const game = update(
                  deserializeGame(JSON.parse(json)),
                  {quests: {$set: JSON.parse(quests)}}
                );
                this.setState(state => update(state, {downloadedGames: {$push: [game]}}));
                return game;
              });
            } else {
              return null;
            }
          });
        })).then(games => {
          if (!gameToReload) return;
          let foundGame = false;
          games.forEach(game => {
            if (!game) return;
            if (parseInt(game.game_id) === parseInt(gameToReload.game.game_id)) {
              this.setState({gameModal: update(gameToReload, {offline: {$set: game}})});
              foundGame = true;
            }
          });
          if (!foundGame) {
            // probably shouldn't happen, but just to make sure spinner goes away
            this.setState({gameModal: null});
          }
        });
      });
    });
  }

  uploadGame(game) {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${game.game_id}`;
    return Promise.all([
      loadQueue().then(notes => {
        const uploadRemaining = (rem) => {
          if (rem.length === 0) {
            return notes;
          } else {
            return uploadNote(this.props.auth, rem[0]).then(() => {
              return uploadRemaining(rem.slice(1));
            });
          }
        }
        return uploadRemaining(notes);
      }),
      Promise.all([
        RNFS.readFile(`${RNFS.DocumentDirectoryPath}/siftrs/inventory-zero.txt`),
        RNFS.readFile(`${siftrDir}/inventory.txt`),
      ]).then(([inv0, inv]) => {
        const instances = JSON.parse(inv0).concat(JSON.parse(inv));
        return Promise.all(instances.map(inst =>
          this.props.auth.promise('call', 'client.setQtyForInstance', {
            instance_id: inst.instance_id,
            qty: inst.qty,
          })
        ));
      }),
      RNFS.readFile(`${siftrDir}/logs.txt`).then(str => {
        const logs = JSON.parse(str);
        return Promise.all(logs.map(log => {
          if (parseInt(log.user_log_id)) {
            return null;
          } else if (log.event_type === 'VIEW_PLAQUE') {
            return this.props.auth.promise('call', 'client.logPlayerViewedContent', {
              game_id: game.game_id,
              content_type: 'PLAQUE',
              content_id: log.content_id,
            });
          } else if (log.event_type === 'COMPLETE_QUEST') {
            return this.props.auth.promise('call', 'client.logPlayerCompletedQuest', {
              game_id: game.game_id,
              quest_id: log.content_id,
            });
          } else {
            return null;
          }
        }).filter(x => x));
      }),
    ]);
  }

  initializeGame(game, hasOffline) {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${game.game_id}`;
    return RNFS.mkdir(siftrDir, {NSURLIsExcludedFromBackupKey: true}).then(() => {
      const writeJSON = (name) => {
        return (data) => {
          return RNFS.writeFile(
            `${siftrDir}/${name}.txt`,
            JSON.stringify(data)
          ).then(() =>
            ({key: name, data: data}) // return object to generate quests
          );
        };
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

        this.props.auth.promise('call', 'client.touchItemsForPlayer', {
          game_id: 0,
        }).then(() =>
          this.props.auth.promise('call', 'instances.getInstancesForGame', {
            game_id: 0,
            owner_id: this.props.auth.authToken.user_id,
          })
        ).then(data =>
          new Promise((resolve, reject) => this.addXP((hasOffline ? 0 : 2), data, resolve))
        ),

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
        }).then(obj =>
          Promise.all([
            writeJSON('fields')(obj.fields),
            writeJSON('guides')(obj.guides),
          ])
        ),

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

      ]).then(objs => {
        // organize the data we got for the game
        let allData = {};
        objs.forEach(o => {
          [o].flat(Infinity).forEach(x => {
            if (x && x.key) {
              allData[x.key] = x.data;
            }
          });
        });

        // generate quests

        /*
        for each quest that is referred to by at least one guide's quest_id:
          make a "get the remnants" quest
          make a "do observations" quest
        */

        let new_quests = [];
        let new_requirement_root_packages = [];
        let new_requirement_and_packages = [];
        let new_requirement_atoms = [];
        allData.quests.forEach(quest => {
          const guides = allData.guides.filter(guide =>
            parseInt(guide.quest_id) === parseInt(quest.quest_id)
          );
          if (guides.length > 0) {
            const fields = guides.map(guide =>
              allData.fields.find(field => parseInt(field.field_id) === parseInt(guide.field_id))
            );

            // make the "get the remnants" subquest
            const remnant_root_id = addTo(new_requirement_root_packages, root_id => ({
              requirement_root_package_id: root_id,
              game_id: game.game_id,
            }));
            const remnant_and_id = addTo(new_requirement_and_packages, and_id => ({
              requirement_and_package_id: and_id,
              game_id: game.game_id,
              requirement_root_package_id: remnant_root_id,
            }));
            fields.forEach(field => {
              field.options.forEach(opt =>
                addTo(new_requirement_atoms, atom_id => ({
                  requirement_atom_id: atom_id,
                  game_id: game.game_id,
                  requirement_and_package_id: remnant_and_id,
                  bool_operator: 1,
                  requirement: 'PLAYER_HAS_ITEM',
                  content_id: opt.remnant_id,
                  qty: 1,
                }))
              );
            });
            addTo(new_quests, quest_id => ({
              quest_id: quest_id,
              game_id: game.game_id,
              name: 'Collect',
              description: `Collect the ${quest.name} remnants and stops.`,
              prompt: `The first thing you need to do is collect the ${quest.name} remnants and stops.`,
              stars: 0,
              quest_type: 'QUEST',
              parent_quest_id: quest.quest_id,
              active_requirement_root_package_id: 0,
              complete_requirement_root_package_id: remnant_root_id,
            }));

            // make the "do observations" subquest
            const observe_root_id = addTo(new_requirement_root_packages, root_id => ({
              requirement_root_package_id: root_id,
              game_id: game.game_id,
            }));
            const observe_and_id = addTo(new_requirement_and_packages, and_id => ({
              requirement_and_package_id: and_id,
              game_id: game.game_id,
              requirement_root_package_id: observe_root_id,
            }));
            addTo(new_requirement_atoms, atom_id => ({
              requirement_atom_id: atom_id,
              game_id: game.game_id,
              requirement_and_package_id: observe_and_id,
              bool_operator: 1,
              requirement: 'PLAYER_HAS_NOTE_WITH_QUEST', // custom req type
              content_id: quest.quest_id,
              qty: 3,
            }))
            addTo(new_quests, quest_id => ({
              quest_id: quest_id,
              game_id: game.game_id,
              name: 'Observe',
              description: `Make 3 observations with ${quest.name} field notes.`,
              prompt: `Great! Now, make 3 observations using your ${quest.name} field notes.`,
              stars: 0,
              quest_type: 'QUEST',
              parent_quest_id: quest.quest_id,
              active_requirement_root_package_id: 0,
              complete_requirement_root_package_id: observe_root_id,
            }));
          }
        });

        if (new_quests.length > 0) {
          return Promise.all([
            writeJSON('quests')(allData.quests.concat(new_quests)),
            writeJSON('requirement_root_packages')(allData.requirement_root_packages.concat(new_requirement_root_packages)),
            writeJSON('requirement_and_packages')(allData.requirement_and_packages.concat(new_requirement_and_packages)),
            writeJSON('requirement_atoms')(allData.requirement_atoms.concat(new_requirement_atoms)),
          ]).then(() => update(allData, {
            requirement_root_packages: {$push: new_requirement_root_packages},
            requirement_and_packages: {$push: new_requirement_and_packages},
            requirement_atoms: {$push: new_requirement_atoms},
          }));
        } else {
          return allData; // nothing to do
        }

      }).then(allData => {
        // generate tags
        if (allData.tags.length === 0) {
          // generate tags and object_tags from remnants
          let new_tags = [];
          let new_object_tags = [];
          allData.guides.forEach(guide => {
            const field = allData.fields.find(field =>
              parseInt(field.field_id) === parseInt(guide.field_id)
            );
            if (!field) return;
            const tag_id = addTo(new_tags, tag_id => ({
              tag_id: tag_id,
              game_id: game.game_id,
              tag: field.label,
              media_id: 0,
              visible: 1,
              curated: 0,
              sort_index: 0,
              color: '',
            }));
            field.options.forEach(opt => {
              addTo(new_object_tags, object_tag_id => ({
                object_tag_id: object_tag_id,
                game_id: game.game_id,
                object_type: 'ITEM',
                object_id: opt.remnant_id,
                tag_id: tag_id,
              }));
            });
          });

          return Promise.all([
            writeJSON('tags')(allData.tags.concat(new_tags)),
            writeJSON('object_tags')(allData.object_tags.concat(new_object_tags)),
          ]).then(() => allData);
        } else {
          return allData; // nothing to do
        }

      }).then(allData => {
        // generate factories
        if (allData.factories.length === 0) {
          // generate factories from remnants
          let new_factories = [];
          let new_instances = [];
          let new_triggers = [];
          let event_items = [];
          let new_requirement_root_packages = [];
          let new_requirement_and_packages = [];
          let new_requirement_atoms = [];
          allData.events.forEach(event => {
            if (event.event === 'GIVE_ITEM') { // GIVE_ITEM_PLAYER in database
              event_items.push(parseInt(event.content_id));
            }
          });
          allData.fields.forEach(field => {
            field.options.forEach(opt => {
              if (!opt.remnant_id) return;
              if (event_items.indexOf(opt.remnant_id) !== -1) return;
              const factory_root_id = addTo(new_requirement_root_packages, root_id => ({
                requirement_root_package_id: root_id,
                game_id: game.game_id,
              }), 1500000);
              const factory_and_id = addTo(new_requirement_and_packages, and_id => ({
                requirement_and_package_id: and_id,
                game_id: game.game_id,
                requirement_root_package_id: factory_root_id,
              }), 1500000);
              addTo(new_requirement_atoms, atom_id => ({
                requirement_atom_id: atom_id,
                game_id: game.game_id,
                requirement_and_package_id: factory_and_id,
                bool_operator: 0,
                requirement: 'PLAYER_HAS_ITEM',
                content_id: opt.remnant_id,
                qty: 1,
              }), 1500000)
              addTo(new_factories, factory_id => ({
                factory_id: factory_id,
                game_id: game.game_id,
                name: `Factory for item ${opt.remnant_id}`,
                object_type: 'ITEM',
                object_id: opt.remnant_id,
                seconds_per_production: 10,
                production_probability: 1,
                max_production: 2,
                produce_expiration_time: 60,
                produce_expire_on_view: 1,
                production_bound_type: 'PER_PLAYER',
                location_bound_type: 'PLAYER',
                min_production_distance: 10,
                max_production_distance: 40,
                requirement_root_package_id: 0,
                trigger_latitude: 0,
                trigger_longitude: 0,
                trigger_distance: 25,
                trigger_infinite_distance: 0,
                trigger_on_enter: 0,
                trigger_hidden: 0,
                trigger_wiggle: 0,
                trigger_title: '',
                trigger_icon_media_id: 0,
                trigger_show_title: 1,
                trigger_requirement_root_package_id: factory_root_id,
                trigger_scene_id: 0,
              }));
            });
          });
          new_factories.forEach(fact => {
            addTo(new_instances, instance_id => ({
              instance_id: instance_id,
              game_id: game.game_id,
              object_type: 'FACTORY',
              object_id: fact.factory_id,
              qty: 1,
              infinite_qty: 1,
              factory_id: 0,
              owner_type: 'GAME_CONTENT',
              owner_id: 0,
            }));
          });
          new_instances.forEach(inst => {
            addTo(new_triggers, trigger_id => ({
              trigger_id: trigger_id,
              game_id: game.game_id,
              instance_id: inst.instance_id,
              scene_id: 1,
              requirement_root_package_id: 0,
              type: 'IMMEDIATE',
            }));
          });
          return Promise.all([
            writeJSON('factories')(allData.factories.concat(new_factories)),
            writeJSON('instances')(allData.instances.concat(new_instances)),
            writeJSON('triggers')(allData.triggers.concat(new_triggers)),
            writeJSON('requirement_root_packages')(allData.requirement_root_packages.concat(new_requirement_root_packages)),
            writeJSON('requirement_and_packages')(allData.requirement_and_packages.concat(new_requirement_and_packages)),
            writeJSON('requirement_atoms')(allData.requirement_atoms.concat(new_requirement_atoms)),
          ]);
        } else {
          return;
        }

      }).then(() =>
        RNFS.writeFile(`${siftrDir}/download_timestamp.txt`, Date.now())
      );
    });
  }

  render() {
    if (this.state.player) {
      return (
        <StemportsPlayer
          onClose={() => this.setState({player: false})}
          onLogout={this.props.onLogout}
          auth={this.props.auth}
          onChangePassword={this.props.onChangePassword}
          onEditProfile={this.props.onEditProfile}
          queueMessage={this.props.queueMessage}
          online={this.props.online}
          onSelect={this.props.onSelect}
          inventory_zero={this.state.inventory_zero}
        />
      );
    }

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
    for (let game_id in games) {
      const obj = games[game_id];
      const game = obj.online || obj.offline;
      const distance = this.props.location ? meterDistance(game, this.props.location.coords) : Infinity;
      gameList.push(update(obj, {game: {$set: game}, distance: {$set: distance}}));
    }

    if (!this.state.mapLocation) {
      const gamesByDistance = gameList.slice(0);
      gamesByDistance.sort((a, b) => a.distance - b.distance);
      return (
        <View style={{flex: 1}}>
          <Text style={{margin: 10, fontSize: 25}}>
            Get to a Science Station
          </Text>
          <View style={{flexDirection: 'row', padding: 5}}>
            <View style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 5,
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 7,
              paddingRight: 7,
              borderColor: 'black',
              borderWidth: 1,
            }}>
              <Text>
                {
                  gamesByDistance.length > 0 && gamesByDistance[0].distance < 1000
                  ? `It looks like you're at the ${gamesByDistance[0].game.name} Science Station. Download Quests to get started!`
                  : 'You need to be at a science station to start a quest. Here are the closest ones.'
                }
              </Text>
            </View>
            <Image
              style={{margin: 10, width: 36, height: 39}}
              source={require('../web/assets/img/puffin.png')}
            />
          </View>
          <ScrollView style={{flex: 1}}>
            {
              gamesByDistance.map(o =>
                <View key={o.game.game_id} style={{margin: 10, flexDirection: 'row'}}>
                  <TouchableOpacity style={{flex: 1}} onPress={() => {
                    this.setState({mapLocation: o.game, gameModal: o});
                  }}>
                    <Text style={{fontWeight: 'bold', margin: 5}}>
                      {o.game.name}
                    </Text>
                    <Text style={{fontStyle: 'italic', margin: 5}}>
                      {(o.distance / 1000).toFixed(2)} km away
                    </Text>
                  </TouchableOpacity>
                  <View>
                    <TouchableOpacity onPress={() => {
                      this.setState({mapLocation: o.game});
                    }} style={{
                      backgroundColor: 'rgb(101,88,245)',
                      padding: 5,
                    }}>
                      <Text style={{color: 'white'}}>Map it</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            }
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={{flex: 1}}>
        <MapView
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: this.state.mapLocation.latitude,
            longitude: this.state.mapLocation.longitude,
            latitudeDelta: 1,
            longitudeDelta: 1,
          }}
          style={{
            flex: 1,
          }}
          showsUserLocation={true}
          mapType="standard"
        >
          {
            // separate markers drawn first for the text labels
            gameList.map(obj => {
              const game = obj.game;
              return (
                <MapView.Marker
                  key={'text' + game.game_id}
                  tracksViewChanges={false}
                  coordinate={{
                    latitude: game.latitude,
                    longitude: game.longitude,
                  }}
                  anchor={{x: 0.5, y: 0.5}}
                >
                  <MapView.Callout tooltip={true} />
                  <View style={{
                    alignItems: 'center',
                  }}>
                    <Text style={{opacity: 0}}>
                      {game.name}
                    </Text>
                    <View
                      style={{
                        opacity: 0,
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        borderWidth: 2,
                      }}
                    />
                    <Text>
                      {game.name}
                    </Text>
                  </View>
                </MapView.Marker>
              );
            })
          }
          {
            gameList.map(obj => {
              const game = obj.game;
              return (
                <MapView.Marker
                  key={game.game_id}
                  tracksViewChanges={false}
                  coordinate={{
                    latitude: game.latitude,
                    longitude: game.longitude,
                  }}
                  anchor={{x: 0.5, y: 0.5}}
                  onPress={() => this.setState({gameModal: obj})}
                >
                  <MapView.Callout tooltip={true} />
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      backgroundColor: 'rgb(40,80,120)',
                      borderRadius: 13,
                      borderWidth: 2,
                      borderColor: 'white',
                    }}
                  />
                </MapView.Marker>
              );
            })
          }
        </MapView>
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            flexDirection: 'row',
          }}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 5,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 7,
            paddingRight: 7,
          }}>
            <Text>
              You need to be at a science station to start a quest.
              Check the list to find ones near you!
            </Text>
          </View>
          <Image
            style={{margin: 10, width: 36, height: 39}}
            source={require('../web/assets/img/puffin.png')}
          />
        </View>
        <TouchableOpacity onPress={() =>
          this.setState({mapLocation: null})
        } style={{
          position: 'absolute',
          padding: 8,
          backgroundColor: 'white',
          borderColor: 'black',
          borderWidth: 1,
          borderRadius: 5,
          left: 10,
          bottom: 10,
        }}>
          <Text>back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() =>
          this.setState({player: true})
        } style={{
          position: 'absolute',
          padding: 8,
          backgroundColor: 'white',
          borderColor: 'black',
          borderWidth: 1,
          borderRadius: 5,
          right: 10,
          bottom: 10,
        }}>
          <Text>player</Text>
        </TouchableOpacity>
        {
          this.state.gameModal && (() => {
            const obj = this.state.gameModal;
            if (obj === 'loading') {
              return (
                <Modal transparent={true} onRequestClose={() => this.setState({gameModal: null})}>
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    backgroundColor: 'white',
                  }}>
                    <ActivityIndicator
                      size="large"
                      color="black"
                    />
                  </View>
                </Modal>
              );
            }
            const game = obj.game;
            return (
              <Modal transparent={true} onRequestClose={() => this.setState({gameModal: null})}>
                <SafeAreaView style={{flex: 1}}>
                  <StatusSpace
                    backgroundColor="rgba(0,0,0,0)"
                    leaveBar={true}
                  />
                  <StemportsOutpost
                    game={game}
                    obj={obj}
                    auth={this.props.auth}
                    onUpload={() => this.uploadGame(game).then(() => this.loadDownloadedGames())}
                    onDownload={() => this.initializeGame(game, obj.offline).then(() => this.loadDownloadedGames())}
                    onClose={() => this.setState({gameModal: null})}
                    onSelect={this.props.onSelect}
                  />
                </SafeAreaView>
              </Modal>
            );
          })()
        }
      </View>
    );
  }
}

export class StemportsOutpost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentQuestID: null,
      tab: null,
    };
  }

  componentDidMount() {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${this.props.game.game_id}`;
    RNFS.readFile(`${siftrDir}/current_quest.txt`).then(str => {
      this.setState({currentQuestID: parseInt(str), tab: 'current'});
    }).catch(() => {
      this.setState({currentQuestID: 'none', tab: 'all'});
    });
    RNFS.readFile(`${siftrDir}/quests-sorted.txt`).then(str => {
      this.setState({sortedQuests: JSON.parse(str)});
    }).catch(() => {
      this.setState({sortedQuests: 'unknown'});
    });
  }

  launchQuest(game, quest) {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${this.props.game.game_id}`;
    RNFS.writeFile(`${siftrDir}/current_quest.txt`, quest.quest_id);
    this.setState({currentQuestID: parseInt(quest.quest_id)});
    this.props.onSelect(game, quest);
  }

  render() {
    const game = this.props.game;
    const obj = this.props.obj;
    const newVersion = obj.online && obj.offline && obj.online.version !== obj.offline.version;
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'stretch',
      }}>
        <View style={{alignItems: 'center', padding: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <CacheMedia
              media_id={game.icon_media_id}
              auth={this.props.auth}
              online={true}
              withURL={(url) =>
                <View style={{margin: 10, alignItems: 'stretch', alignSelf: 'stretch'}}>
                  <Image
                    source={url}
                    style={{
                      width: 90,
                      height: 90,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
              }
            />
            <View style={{margin: 10, flex: 1}}>
              <Text style={{fontSize: 25}}>{game.name}</Text>
            </View>
          </View>
          <View style={{margin: 10}}>
            <Text>{game.description}</Text>
          </View>
        </View>
        {
          obj.offline ? (
            <View style={{flex: 1}}>
              <View style={{
                alignItems: 'center',
                justifyContent: 'space-around',
                flexDirection: 'row',
              }}>
                <TouchableOpacity
                  onPress={() => this.setState({tab: 'current'})}
                  style={{padding: 10}}
                >
                  <Text style={{
                    textDecorationLine: 'underline',
                    color: this.state.tab === 'current' ? 'rgb(101,88,245)' : 'black',
                  }}>
                    Current Quest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => this.setState({tab: 'all'})}
                  style={{padding: 10}}
                >
                  <Text style={{
                    textDecorationLine: 'underline',
                    color: this.state.tab === 'all' ? 'rgb(101,88,245)' : 'black',
                  }}>
                    All Quests
                  </Text>
                </TouchableOpacity>
              </View>
              {
                this.state.currentQuestID == null ? (
                  <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <ActivityIndicator
                      size="large"
                      color="black"
                    />
                  </View>
                ) : this.state.tab === 'current' ? (() => {
                  const quests = (obj.offline ? obj.offline.quests : obj.online.quests);
                  const quest = quests.find(q => parseInt(q.quest_id) === this.state.currentQuestID);
                  if (quest) {
                    return (
                      <ScrollView style={{flex: 1, borderColor: 'black', borderTopWidth: 1, borderBottomWidth: 1}}>
                        <View style={{
                          flexDirection: 'row',
                        }}>
                          <Text style={{flex: 1, margin: 10, fontSize: 20}}>{quest.name}</Text>
                          <TouchableOpacity onPress={() =>
                            obj.offline && this.launchQuest(game, quest)
                          } style={{
                            backgroundColor: 'rgb(101,88,245)',
                            padding: 5,
                            margin: 10,
                          }}>
                            <Text style={{color: 'white'}}>resume</Text>
                          </TouchableOpacity>
                        </View>
                        {
                          (() => {
                            const details = this.state.sortedQuests &&
                              this.state.sortedQuests.displayInfo &&
                              this.state.sortedQuests.displayInfo.find(o =>
                                parseInt(o.quest.quest_id) === this.state.currentQuestID
                              );
                            if (details) {
                              return (
                                <View>
                                  {
                                    details.reqRoots.map(root => {
                                      if (!root.req) return;
                                      // this is all hacked for now, to match how generated quests look
                                      const requirement = root.req.ands[0].atoms[0].requirement;
                                      let done = root.ands[0].atoms.filter(o => o.bool).length;
                                      let total = root.ands[0].atoms.length;
                                      if (requirement === 'PLAYER_HAS_NOTE_WITH_QUEST') {
                                        done = root.ands[0].atoms[0].qty;
                                        total = root.ands[0].atoms[0].atom.qty;
                                      }
                                      let subquestLabel = root.req.ands[0].atoms[0].requirement;
                                      if (subquestLabel === 'PLAYER_HAS_ITEM') {
                                        subquestLabel = 'Explore and Collect Remnants';
                                      } else if (subquestLabel === 'PLAYER_HAS_NOTE_WITH_QUEST') {
                                        subquestLabel = `Make ${total} Observations`;
                                      }
                                      let circles = [];
                                      for (let i = 0; i < total; i++) {
                                        circles.push(i < done);
                                      }
                                      return (
                                        <View key={root.req.requirement_root_package_id} style={{
                                          padding: 15,
                                          borderColor: 'black',
                                          borderTopWidth: 1,
                                          marginLeft: 10,
                                          marginRight: 10,
                                          paddingLeft: 5,
                                          paddingRight: 5,
                                        }}>
                                          <Text style={{margin: 5}}>
                                            {subquestLabel}
                                          </Text>
                                          <View style={{flexDirection: 'row'}}>
                                            {circles.map((b, i) =>
                                              <View
                                                key={i}
                                                style={{
                                                  backgroundColor: b ? 'rgb(178,172,250)' : 'white',
                                                  borderColor: 'black',
                                                  borderWidth: 2,
                                                  width: 20,
                                                  height: 20,
                                                  borderRadius: 10,
                                                  margin: 3,
                                                }}
                                              />
                                            )}
                                          </View>
                                        </View>
                                      );
                                    }).filter(x => x)
                                  }
                                </View>
                              );
                            } else {
                              return (
                                <Text>Launch this quest to refresh its progress information.</Text>
                              );
                            }
                          })()
                        }
                      </ScrollView>
                    );
                  } else {
                    return (
                      <View style={{flex: 1, borderColor: 'black', borderTopWidth: 1, borderBottomWidth: 1}}>
                        <Text>You haven't started a quest from this outpost.</Text>
                        <Text>Find one to start from the All Quests tab.</Text>
                      </View>
                    );
                  }
                })() : (
                  <ScrollView style={{flex: 1, borderColor: 'black', borderTopWidth: 1, borderBottomWidth: 1}}>
                    {
                      (obj.offline ? obj.offline.quests : obj.online.quests).filter(quest =>
                        !parseInt(quest.parent_quest_id)
                      ).map(quest =>
                        <View key={quest.quest_id} style={{flexDirection: 'row'}}>
                          <Text style={{flex: 1, margin: 5}}>{quest.name}</Text>
                          <TouchableOpacity onPress={() =>
                            obj.offline && this.launchQuest(game, quest)
                          } style={{
                            backgroundColor: 'rgb(101,88,245)',
                            padding: 5,
                            margin: 5,
                          }}>
                            <Text style={{color: 'white'}}>start</Text>
                          </TouchableOpacity>
                        </View>
                      )
                    }
                  </ScrollView>
                )
              }
            </View>
          ) : (
            <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
              <Text style={{fontSize: 25, margin: 5, textAlign: 'center'}}>
                Download Quests
              </Text>
              <Text style={{margin: 5, textAlign: 'center'}}>
                It looks like you're at the {game.name} Science Station.
                Download Quests to get started!
              </Text>
              <TouchableOpacity style={{
                backgroundColor: 'rgb(101,88,245)',
                padding: 5,
                margin: 5,
              }} onPress={this.props.onDownload}>
                <Text style={{color: 'white'}}>
                  Download Quests
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        <View style={{alignItems: 'center', padding: 10}}>
          {
            obj.offline && (
              <TouchableOpacity onPress={this.props.onUpload} style={{
                width: 200,
                padding: 10,
                borderColor: 'black',
                borderWidth: 1,
                backgroundColor: 'white',
              }}>
                <Text>Upload</Text>
              </TouchableOpacity>
            )
          }
          {
            obj.online && (
              <TouchableOpacity onPress={this.props.onDownload} style={{
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
          <TouchableOpacity onPress={this.props.onClose} style={{
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
    );
  }
}
