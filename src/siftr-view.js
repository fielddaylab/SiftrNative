"use strict";

var ref, ref1;

const modulo = function(a, b) {
  return ((+a % (b = +b)) + b) % b;
};
const indexOf = [].indexOf;

import React from "react";
import T from "prop-types";
import update from "immutability-helper";
import createClass from "create-react-class";

// @ifdef NATIVE
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  BackHandler,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  SafeAreaView,
  Alert
} from "react-native";
const RNFS = require("react-native-fs");
import { styles, Text } from "./styles";
import { StatusSpace } from "./status-space";
import { KeyboardAwareView } from "react-native-keyboard-aware-view";
import SideMenu from "react-native-side-menu";
import Markdown from "react-native-simple-markdown";
import firebase from "react-native-firebase";
import { NativeSettings } from "./native-settings";
import { NativeCard } from "./native-browser";
import {CacheMedia} from './media';
import ProgressCircle from 'react-native-progress-circle';
import {ItemScreen, InventoryScreen} from './items';
import {PlaqueScreen} from './plaques';
import {QuestsScreen, QuestDetails} from './quests';
import {evalReqPackage} from './requirements';
import ModelView from '../react-native-3d-model-view/lib/ModelView';
// @endif

// @ifdef WEB
import { markdown } from "markdown";
// @endif

import { fitBounds } from "google-map-react/utils";

import {
  Auth,
  Game,
  Tag,
  Note,
  FieldData,
  FieldOption,
  Colors,
  Field,
  Theme,
  User,
  deserializeNote,
  arisPromise
} from "./aris";

import { timeToARIS } from "./time-slider";

import { SearchNotes } from "./search-notes";
import { SiftrMap, makeClusters } from "./map";
import { SiftrThumbnails } from "./thumbnails";
import { SiftrNoteView } from "./note-view";
// @ifdef WEB
import {
  CreateStep1,
  CreateStep2,
  CreateStep3,
  CreateStep5
} from "./create-note-web";
// @endif
// @ifdef NATIVE
import { CreatePhoto, CreateData, Blackout } from "./create-note-native";
// @endif

import { clicker, withSuccess } from "./utils";

function fixLongitude(longitude) {
  longitude = modulo(longitude, 360);
  if (longitude > 180) {
    longitude -= 360;
  }
  return longitude;
}

const viewModeSize = 92 / 3.5;

function hexToRGBA(hex) {
  if (hex[0] === '#' && hex.length === 7) {
    const red   = parseInt(hex[1] + hex[2], 16);
    const green = parseInt(hex[3] + hex[4], 16);
    const blue  = parseInt(hex[5] + hex[6], 16);
    return [red, green, blue, 255];
  } else {
    return [255, 255, 255, 255];
  }
}

// @ifdef NATIVE
const SiftrInfo = createClass({
  displayName: "SiftrInfo",
  propTypes: function() {
    return {
      game: T.instanceOf(Game),
      tags: T.arrayOf(T.instanceOf(Tag)),
      notes: T.arrayOf(T.instanceOf(Note)),
      isOpen: T.bool,
      onChange: T.func,
      getColor: T.func,
      followed: T.arrayOf(T.instanceOf(Game)),
      followGame: T.func,
      unfollowGame: T.func
    };
  },
  getDefaultProps: function() {
    return {
      onChange: function() {},
      isOpen: false,
      notes: null,
      followed: [],
      followGame: function() {},
      unfollowGame: function() {}
    };
  },
  render: function() {
    var isFollowing, matches, note, ref, ref1, ref2, ref3, tag;
    isFollowing =
      this.props.game != null
        ? (ref = this.props.followed) != null
          ? ref.some(game => {
              return game.game_id === this.props.game.game_id;
            })
          : void 0
        : false;
    return (
      <View style={{flex: 1}}>
        {this.props.children}
        {
          this.props.isOpen ? (
            <Modal onRequestClose={() => this.props.onChange(false)}>
              <SafeAreaView style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'white',
                    margin: 10,
                    borderRadius: 5,
                    borderWidth: 2,
                    borderColor: 'black',
                  }}
                >
                  <StatusSpace leaveBar={true} backgroundColor="rgba(0,0,0,0)" />
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    margin: 22,
                  }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      fontFamily: 'League Spartan',
                    }}>
                      About
                    </Text>
                    <TouchableOpacity onPress={() => this.props.onChange(false)}>
                      <Image
                        style={{
                          width: 112 * 0.22,
                          height: 69 * 0.22
                        }}
                        source={require("../web/assets/img/disclosure-arrow-up.png")}
                      />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={{flex: 1}}
                    contentContainerStyle={{backgroundColor: "white"}}
                  >
                    <NativeCard
                      cardMode="modal"
                      game={this.props.game}
                      auth={this.props.auth}
                      online={this.props.online}
                      isFollowing={isFollowing}
                      followGame={this.props.followGame}
                      unfollowGame={this.props.unfollowGame}
                    />
                    {this.props.viola && (
                      <View style={{alignItems: "center"}}>
                        <TouchableOpacity
                          onPress={this.props.onViolaSettings}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 4,
                            borderColor: "black",
                            borderRadius: 20,
                            borderWidth: 2,
                            marginBottom: 10
                          }}
                        >
                          <Text>Settings</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={{
                      margin: 22,
                    }}>
                      <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        fontFamily: 'League Spartan',
                      }}>
                        Categories
                      </Text>
                      {function() {
                        var i, len, ref4, ref5, results;
                        ref5 = (ref4 = this.props.tags) != null ? ref4 : [];
                        results = [];
                        for (i = 0, len = ref5.length; i < len; i++) {
                          tag = ref5[i];
                          results.push(
                            <View
                              key={tag.tag_id}
                              style={{
                                justifyContent: "space-between",
                                flexDirection: "row",
                                alignItems: "center",
                                paddingTop: 10,
                              }}
                            >
                              <Text
                                style={{
                                  margin: 5,
                                }}
                              >
                                {tag.tag}
                              </Text>
                              <View
                                style={{
                                  margin: 5,
                                  backgroundColor: this.props.getColor(tag),
                                  padding: 3,
                                  minWidth: 24,
                                  borderRadius: 999,
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={{
                                    color: "white",
                                    fontSize: 15,
                                  }}
                                >
                                  {this.props.notes != null
                                    ? ((matches = function() {
                                        var j, len1, ref6, results1;
                                        ref6 = this.props.notes;
                                        results1 = [];
                                        for (j = 0, len1 = ref6.length; j < len1; j++) {
                                          note = ref6[j];
                                          if (note.tag_id !== tag.tag_id) {
                                            continue;
                                          }
                                          results1.push(note);
                                        }
                                        return results1;
                                      }.call(this)),
                                      matches.length)
                                    : "…"}
                                </Text>
                              </View>
                            </View>
                          );
                        }
                        return results;
                      }.call(this)}
                    </View>
                  </ScrollView>
                </View>
              </SafeAreaView>
            </Modal>
          ) : null
        }
      </View>
    );
  }
});

export function addXP(xp, inventory_zero, cb) {
  const new_inventory_zero = inventory_zero.map(inst => {
    if (inst.object_type === 'ITEM' && parseInt(inst.object_id) === 35) {
      return update(inst, {qty: {$apply: (cur) => parseInt(cur) + xp}});
    } else {
      return inst;
    }
  });
  RNFS.writeFile(
    `${RNFS.DocumentDirectoryPath}/siftrs/inventory-zero.txt`,
    JSON.stringify(new_inventory_zero)
  ).then(() => cb(new_inventory_zero));
}

const LOAD_OBJECTS = [
  {name: 'quests'},
  {name: 'plaques'},
  {name: 'items'},
  {name: 'object_tags'},
  {name: 'tags', load: obj => obj.map(tag => Object.assign(new Tag(), tag))},
  {name: 'requirement_root_packages'},
  {name: 'requirement_and_packages'},
  {name: 'requirement_atoms'},
  {name: 'logs'},
  {name: 'inventory'},
  {name: 'instances'},
  {name: 'factories'},
  {name: 'triggers'},
  {name: 'events'},
  {name: 'event_packages'},
  {name: 'fields', load: obj => obj.map(field => Object.assign(new Field(), field))},
  {name: 'guides'},
  {name: 'authors', load: obj => obj.map(author => author.display_name)},
  {name: 'theme', load: obj => Object.assign(new Theme(), obj)},
  {name: 'colors', load: obj => Object.assign(new Colors(), obj)},
  {name: 'notes', load: obj => obj.map(deserializeNote)},
];

class SiftrViewLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${this.props.game.game_id}`;
    LOAD_OBJECTS.forEach(({name, load}) => {
      if (!load) {
        load = (x) => x;
      }
      RNFS.readFile(`${siftrDir}/${name}.txt`).then(str => {
        this.setState({[name]: load(JSON.parse(str))});
      });
    });
    RNFS.readFile(`${RNFS.DocumentDirectoryPath}/siftrs/inventory-zero.txt`).then(str => {
      this.setState({inventory_zero: JSON.parse(str)});
    });
  }

  loadAfterUpload(...args) {
    return this.siftrView && this.siftrView.loadAfterUpload(...args);
  }

  render() {
    if (LOAD_OBJECTS.some(({name}) => this.state[name] == null)) {
      return null;
    } else if (this.state.inventory_zero == null) {
      return null;
    } else {
      return <SiftrView
        {...this.props}
        {...this.state}
        addXP={(xp) =>
          addXP(xp, this.state.inventory_zero, (new_inventory_zero) =>
            this.setState({inventory_zero: new_inventory_zero})
          )
        }
        ref={(sv) => this.siftrView = sv}
      />;
    }
  }
}

export class SiftrViewPW extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      asking: false,
      password: '',
      display: false,
    };
  }

  componentDidMount() {
    if (this.props.online) {
      this.tryPassword();
    } else {
      this.setState({display: true});
    }
  }

  loadAfterUpload(...args) {
    return this.siftrView && this.siftrView.loadAfterUpload(...args);
  }

  tryPassword() {
    const password = this.state.password;
    this.props.auth.searchNotes({
      game_id: this.props.game.game_id,
      note_count: 1,
      password: password,
    }, res => {
      if (res.returnCode != null && res.returnCode !== 0) {
        this.setState({asking: true, wrong: password !== ''});
      } else {
        this.setState({display: true});
      }
    });
  }

  render() {
    if (this.state.display) {
      return (
        <SiftrViewLoader
          {...this.props}
          auth={
            this.state.password != null
            ? update(this.props.auth, {password: {$set: this.state.password}})
            : this.props.auth
          }
          ref={(sv) => this.siftrView = sv}
        />
      );
    } else if (this.state.asking) {
      return (
        <KeyboardAwareView style={{
          alignItems: 'stretch',
          flex: 1,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}>
            <TouchableOpacity onPress={this.props.onExit}>
              <Image
                source={require('../web/assets/img/disclosure-arrow-left.png')}
                style={{
                  width: 69 * 0.25,
                  height: 112 * 0.25,
                  margin: 15,
                }}
              />
            </TouchableOpacity>
          </View>
          <View style={{
            flex: 1,
            alignItems: 'stretch',
            justifyContent: 'center',
            padding: 15,
          }}>
            <View style={{
              alignItems: 'center',
              marginBottom: 25,
            }}>
              <CacheMedia
                media_id={this.props.game.icon_media_id}
                size="thumb_url"
                auth={this.props.auth}
                online={this.props.online}
                withURL={(url) => (
                  <View style={{
                    height: 46 * 2,
                    width: 46 * 2,
                    borderRadius: 14 * 2,
                    alignItems: 'stretch',
                    marginBottom: 10,
                  }}>
                    <Image
                      source={url}
                      style={{
                        flex: 1,
                        resizeMode: 'contain',
                        borderRadius: 11,
                      }}
                    />
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Image
                        source={require('../web/assets/img/lock.png')}
                        style={{
                          width: 35,
                          height: 35,
                        }}
                      />
                    </View>
                  </View>
                )}
              />
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                fontFamily: 'League Spartan',
                marginBottom: 3,
              }}>
                {this.props.game.name}
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgb(171,182,194)',
                fontWeight: 'bold',
                letterSpacing: 0.2,
              }}>
                This Siftr is locked
              </Text>
            </View>
            <View style={{
              alignItems: 'center',
            }}>
              <Text>Enter password to unlock this Siftr</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                value={this.state.password}
                onChangeText={password => this.setState({password, wrong: false})}
                secureTextEntry={true}
                style={{
                  padding: 15,
                  backgroundColor: 'rgb(244,245,247)',
                  margin: 8,
                  borderRadius: 5,
                  alignSelf: 'stretch',
                }}
                placeholder="Enter password..."
                onSubmitEditing={this.tryPassword.bind(this)}
              />
              {
                <Text style={{
                  color: 'red',
                  fontStyle: 'italic',
                }}>
                  {this.state.wrong ? 'That password was incorrect' : ' '}
                </Text>
              }
            </View>
          </View>
        </KeyboardAwareView>
      );
    } else {
      return null;
    }
  }
}

SiftrViewPW.defaultProps = {
  online: true,
};

export function downloadGame(auth, game, callbacks = {}) {
  const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${game.game_id}`;
  RNFS.mkdir(siftrDir, {NSURLIsExcludedFromBackupKey: true}).then(() => {
    RNFS.writeFile(`${siftrDir}/game.txt`, JSON.stringify(game));
    auth.getTagsForGame({game_id: game.game_id}, withSuccess(tags => {
      if (callbacks.tags) callbacks.tags(tags);
      RNFS.writeFile(`${siftrDir}/tags.txt`, JSON.stringify(tags));
    }));
    auth.getColors({colors_id: game.colors_id || 1}, withSuccess(colors => {
      if (callbacks.colors) callbacks.colors(colors);
      RNFS.writeFile(`${siftrDir}/colors.txt`, JSON.stringify(colors));
    }));
    auth.getTheme({theme_id: game.theme_id || 1}, withSuccess(theme => {
      if (callbacks.theme) callbacks.theme(theme);
      RNFS.writeFile(`${siftrDir}/theme.txt`, JSON.stringify(theme));
    }));
    auth.getFieldsForGame({game_id: game.game_id}, withSuccess(obj => {
      const fields = obj.fields;
      if (callbacks.fields) callbacks.fields(fields);
      RNFS.writeFile(`${siftrDir}/fields.txt`, JSON.stringify(fields));
    }));
    auth.siftrSearch({game_id: game.game_id, order: "recent", map_data: false}, withSuccess(({notes}) => {
      if (callbacks.notes) callbacks.notes(notes);
      RNFS.writeFile(`${siftrDir}/notes.txt`, JSON.stringify(notes));
    }));
    auth.getUsersForGame({game_id: game.game_id}, withSuccess((authors) => {
      if (callbacks.authors) callbacks.authors(authors);
      RNFS.writeFile(`${siftrDir}/authors.txt`, JSON.stringify(authors));
    }));
  });
}

// @endif

export function meterDistance(posn1, posn2) {
  // Haversine formula code from https://stackoverflow.com/a/14561433/509936

  const toRad = function(n) {
     return n * Math.PI / 180;
  }

  var lat2 = parseFloat(posn2.latitude);
  var lon2 = parseFloat(posn2.longitude);
  var lat1 = parseFloat(posn1.latitude);
  var lon1 = parseFloat(posn1.longitude);

  var R = 6371; // km
  var x1 = lat2-lat1;
  var dLat = toRad(x1);
  var x2 = lon2-lon1;
  var dLon = toRad(x2);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;

  return d * 1000;
}

export const SiftrView = createClass({
  displayName: "SiftrView",
  propTypes: {
    game: T.instanceOf(Game).isRequired,
    auth: T.instanceOf(Auth).isRequired,
    isAdmin: T.bool,
    onExit: T.func,
    onPromptLogin: T.func,
    following: T.arrayOf(T.instanceOf(Game)),
    followGame: T.func,
    unfollowGame: T.func,
    // nomenData
    clearNomenData: T.func,
    online: T.bool,
    // @ifdef NATIVE
    aris: T.bool
    // @endif
  },
  getDefaultProps: function() {
    return {
      isAdmin: false,
      onExit: function() {},
      onPromptLogin: function() {},
      nomenData: null,
      clearNomenData: function() {},
      following: null,
      followGame: function() {},
      unfollowGame: function() {},
      onViolaIdentify: function() {}
    };
  },
  getInitialState: function() {
    var corners, fitted, h, ref, ref1, ref2, ref3, ref4, ref5, w;
    fitted = null;
    // @ifdef NATIVE
    if (this.props.bounds != null) {
      fitted = {
        center: {
          lat:
            (this.props.bounds.max_latitude + this.props.bounds.min_latitude) /
            2,
          lng:
            (this.props.bounds.max_longitude +
              this.props.bounds.min_longitude) /
            2
        },
        delta: {
          lat:
            Math.abs(
              this.props.bounds.max_latitude - this.props.bounds.min_latitude
            ) * 1.1,
          lng:
            Math.abs(
              this.props.bounds.max_longitude - this.props.bounds.min_longitude
            ) * 1.1
        }
      };
    }
    // @endif
    // @ifdef WEB
    if (this.props.bounds != null) {
      w =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;
      h =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight;
      h -= 150;
      corners = {
        nw: {
          lat: this.props.bounds.max_latitude,
          lng: this.props.bounds.min_longitude
        },
        se: {
          lat: this.props.bounds.min_latitude,
          lng: this.props.bounds.max_longitude
        }
      };
      fitted = fitBounds(corners, {
        width: w,
        height: h
      });
    }
    // @endif
    return {
      center: {
        lat:
          (ref =
            fitted != null
              ? (ref1 = fitted.center) != null
                ? ref1.lat
                : void 0
              : void 0) != null
            ? ref
            : this.props.game.latitude,
        lng:
          (ref2 =
            fitted != null
              ? (ref3 = fitted.center) != null
                ? ref3.lng
                : void 0
              : void 0) != null
            ? ref2
            : this.props.game.longitude
      },
      // @ifdef NATIVE
      delta:
        (ref4 = fitted != null ? fitted.delta : void 0) != null
          ? ref4
          : (() => {
              var delta;
              // more research needed, this is a hack
              delta = 26 / Math.pow(2, this.props.game.zoom - 4);
              delta = Math.min(90, delta);
              return {
                lat: delta,
                lng: delta
              };
            })(),
      // @endif
      // @ifdef WEB
      zoom:
        (ref5 = fitted != null ? fitted.zoom : void 0) != null
          ? ref5
          : this.props.game.zoom,
      // @endif
      map_notes: [],
      map_clusters: [],
      notes: [],
      allNotes: null,
      loadedAll: true,
      viewingNote: null,
      createNote: null,
      searchParams: {
        sort: "recent"
      },
      searchOpen: false,
      mainView: "map", // 'hybrid', 'map', 'thumbs'
      infoOpen: false,
      primaryMenuOpen: false,
      modals: [],
      logs: this.props.logs,
      inventory: this.props.inventory,
      factoryObjects: [],
      factoryProductionTimestamps: {},
      pickedUpRemnants: [],
    };
  },
  getAllNotes: function(cb) {
    this.props.auth.siftrSearch(
      {
        game_id: this.props.game.game_id,
        order: "recent",
        map_data: false,
      },
      withSuccess(({notes}) => {
        if (!this.isMounted) return;
        Promise.all(notes.map(note => arisPromise(cb => {
          this.props.auth.getFieldDataForNote({
            note_id: note.note_id,
          }, cb);
        }))).then(field_data => {
          notes = notes.map((note, i) =>
            update(note, {field_data: {$set: field_data[i]}})
          );
          this.setState({allNotes: notes});
          cb && cb(notes);
        });
      })
    );
  },
  addLog: function(logEntry) {
    this.setState(oldState => update(oldState, {
      logs: {
        $push: [logEntry],
      },
    }), () => {
      const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${
        this.props.game.game_id
      }`;
      RNFS.writeFile(`${siftrDir}/logs.txt`, JSON.stringify(this.state.logs));
    });
  },
  /*
  checkinLogs: function() {
    this.props.auth.call('client.getLogsForPlayer', {
      game_id: this.props.game.game_id,
    }, (resLogs) => {
      if (resLogs.returnCode === 0) {
        const serverLastLog = resLogs[resLogs.length - 1];
        const expectedLastLog = this.state.logsServer[this.state.logsServer.length - 1];
        if (serverLastLog.user_log_id === expectedLastLog.user_log_id) {
          // all good, report our logs and sync everything up
        } else {
          // progress diverged between the server and the client!
          // popup a dialog asking which to keep
        }
      } else {
        // popup an error
      }
    });
  },
  */
  evalReqPackage: function(id) {
    const root = this.getReqRoot(id);
    if (!root) {
      if (parseInt(id) === 0) {
        return true;
      } else {
        console.warn(`Requirement root package ${id} not found`);
        return false;
      }
    }
    return evalReqPackage(root, {
      log: this.state.logs,
      instances: this.state.inventory,
      notes: (() => {
        let notes = this.props.notes;
        if (this.props.pendingNotes) {
          notes = notes.concat(this.props.pendingNotes.map(pnote =>
            JSON.parse(pnote.json)
          ));
        }
        return notes;
      })(),
      game: this.props.game,
      auth: this.props.auth,
    });
  },
  getReqRoot: function(id) {
    const root = this.props.requirement_root_packages.find(root => root.requirement_root_package_id === id);
    if (!root) return null;
    const ands = this.props.requirement_and_packages.filter(and => and.requirement_root_package_id === id).map(and => {
      const atoms = this.props.requirement_atoms.filter(atom => atom.requirement_and_package_id === and.requirement_and_package_id);
      return update(and, {atoms: {$set: atoms}});
    });
    return update(root, {ands: {$set: ands}});
  },
  checkQuestsOffline: function() {
    if (!this.isMounted) {
      // do nothing
    } else {
      let active = [];
      let complete = [];
      this.props.quests.forEach(quest => {
        if (parseInt(quest.parent_quest_id)) return;
        const is_active = this.evalReqPackage(quest.active_requirement_root_package_id);
        let is_complete = this.evalReqPackage(quest.complete_requirement_root_package_id);
        if (quest.quest_type === 'COMPOUND') {
          const subquests = this.props.quests.filter(sub =>
            parseInt(sub.parent_quest_id) === parseInt(quest.quest_id)
          );
          let sub_active = [];
          let sub_complete = [];
          subquests.forEach(sub => {
            const is_sub_complete = this.evalReqPackage(sub.complete_requirement_root_package_id);
            if (is_sub_complete) {
              sub_complete.push(sub);
            } else {
              sub_active.push(sub);
            }
          });
          quest = update(quest, {
            sub_active: {$set: sub_active},
            sub_complete: {$set: sub_complete},
          });
          is_complete = is_complete && sub_active.length === 0;
        }
        if (is_active) {
          if (is_complete) {
            complete.push(quest);
          } else {
            active.push(quest);
          }
        }
      });
      const oldQuests = this.state.quests;
      const newQuests = {active: active, complete: complete};
      const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${this.props.game.game_id}`;
      RNFS.writeFile(`${siftrDir}/quests-sorted.txt`, JSON.stringify(newQuests));
      let o = {quests: newQuests};
      if (this.props.currentQuest && !newQuests.active.some(q => q.quest_id === this.props.currentQuest.quest_id)) {
        // TODO close this quest because it's complete?
      }
      this.setState(o);
      if (oldQuests) {
        newQuests.active.forEach(quest => {
          if (!oldQuests.active.some(old => old.quest_id === quest.quest_id)) {
            this.pushModal({type: 'quest-available', quest: quest});
          }
        });
        newQuests.complete.forEach(quest => {
          if (!oldQuests.complete.some(old => old.quest_id === quest.quest_id)) {
            this.pushModal({type: 'quest-complete', quest: quest});
            this.addLog({
              event_type: 'COMPLETE_QUEST',
              game_id: this.props.game.game_id,
              content_id: quest.quest_id,
            });
          }
        });
      }
    }
    setTimeout(() => this.checkQuestsOffline(), 5000);
  },
  checkQuests: function() {
    if (!this.isMounted) return;
    this.props.auth.call('client.checkForCascadingLogs', {
      game_id: this.props.game.game_id,
    }, () => {
      this.props.auth.call('client.getQuestsForPlayer', {
        game_id: this.props.game.game_id,
      }, (resQuests) => {
        if (resQuests.returnCode === 0) {
          const oldQuests = this.state.quests;
          const newQuests = resQuests.data;
          this.setState({quests: newQuests});
          if (oldQuests) {
            newQuests.active.forEach(quest => {
              if (!oldQuests.active.some(old => old.quest_id === quest.quest_id)) {
                this.pushModal({type: 'quest-available', quest: quest});
              }
            });
            newQuests.complete.forEach(quest => {
              if (!oldQuests.complete.some(old => old.quest_id === quest.quest_id)) {
                this.pushModal({type: 'quest-complete', quest: quest});
              }
            });
          }
          setTimeout(() => this.checkQuests(), 5000);
        }
      });
    });
  },
  getTriggers: function() {
    return this.props.triggers.concat(this.state.factoryObjects.map(x => x.trigger));
  },
  getInstances: function() {
    return this.props.instances.concat(this.state.factoryObjects.map(x => x.instance));
  },
  getTrigger: function(trigger_id) {
    return this.getTriggers().find(trig => trig.trigger_id === trigger_id);
  },
  getTriggersForInstance: function(instance) {
    return this.getTriggers().filter(trig => trig.instance_id === instance.instance_id);
  },
  getInstance: function(instance_id) {
    return this.getInstances().find(inst => inst.instance_id === instance_id);
  },
  getObjectInstances: function(object_type, object_id) {
    return this.getInstances().filter(inst => inst.object_type === object_type && parseInt(inst.object_id) === parseInt(object_id));
  },
  tickTriggersOffline: function() {
    this.setState(oldState => {
      const now = Date.now();
      let nextFactoryObjects = [];
      let nextFactoryProductionTimestamps = {};
      this.props.factories.forEach(factory => {
        let objects = oldState.factoryObjects.filter(o => o.instance.factory_id === factory.factory_id);
        // delete any expired
        objects = objects.filter(o =>
          now - new Date(o.instance.created).getTime() < parseInt(factory.produce_expiration_time) * 1000
        );
        // create any new
        // this doesn't actually use scenes but named to match the PHP code
        const inValidScene = this.getObjectInstances('FACTORY', factory.factory_id).some(inst =>
          this.getTriggersForInstance(inst).some(trig =>
            this.evalReqPackage(trig.requirement_root_package_id)
          )
        );
        let updated = oldState.factoryProductionTimestamps[factory.factory_id] || 0;
        if (   inValidScene
            && now - updated >= parseInt(factory.seconds_per_production) * 1000
            && objects.length < parseInt(factory.max_production)
            ) {
          if (Math.random() < parseFloat(factory.production_probability)) {
            // make a new object
            let lat = 0;
            let lon = 0;
            if (factory.location_bound_type === 'PLAYER') {
              if (this.props.location) {
                lat = this.props.location.coords.latitude;
                lon = this.props.location.coords.longitude;
              }
            } else if (factory.location_bound_type === 'LOCATION') {
              lat = factory.trigger_latitude;
              lon = factory.trigger_longitude;
            }

            const dist = (Math.random() * (factory.max_production_distance-factory.min_production_distance)) + factory.min_production_distance;
            const theta = (Math.random() * 360) / (2 * Math.PI);
            let latdelta = dist * Math.sin(theta);
            let londelta = dist * Math.cos(theta);

            latdelta /= 111111;
            londelta /= 111111 * Math.cos(lat + latdelta);

            lat += latdelta;
            lon += londelta;

            const instance_id = Math.random() * 100000000000; // TODO do this better
            const trigger_id = Math.random() * 100000000000; // TODO do this better
            objects.push({
              instance: {
                instance_id: instance_id,
                game_id: this.props.game.game_id,
                object_id: factory.object_id,
                object_type: factory.object_type,
                qty: 1,
                infinite_qty: 0,
                factory_id: factory.factory_id,
                created: new Date(), // TODO make actual string
              },
              trigger: {
                trigger_id: trigger_id,
                game_id: this.props.game.game_id,
                instance_id: instance_id,
                scene_id: 0, // doesn't matter currently
                requirement_root_package_id: factory.trigger_requirement_root_package_id,
                type: 'LOCATION',
                name: factory.trigger_title,
                title: factory.trigger_title,
                latitude: lat,
                longitude: lon,
                distance: factory.trigger_distance,
                infinite_distance: factory.trigger_infinite_distance,
                wiggle: factory.trigger_wiggle,
                show_title: factory.trigger_show_title,
                hidden: factory.trigger_hidden,
                trigger_on_enter: factory.trigger_on_enter,
                icon_media_id: factory.trigger_icon_media_id,
                created: new Date(), // TODO make actual string
              },
            });
          }
          updated = now;
        }
        nextFactoryObjects = nextFactoryObjects.concat(objects);
        nextFactoryProductionTimestamps[factory.factory_id] = updated;
      });
      return update(oldState, {
        factoryObjects: {$set: nextFactoryObjects},
        factoryProductionTimestamps: {$set: nextFactoryProductionTimestamps},
      });
    }, () => {
      setTimeout(this.tickTriggersOffline/*.bind(this)*/, 5000);
    });
  },
  tickTriggers: function() {
    if (!this.isMounted) return;
    this.props.auth.call('client.touchSceneForPlayer', {
      game_id: this.props.game.game_id,
    }, () => {
      const tick = () => {
        this.props.auth.call('triggers.assignClusters', {
          game_id: this.props.game.game_id,
        }, () => {
          this.props.auth.call('client.getTriggersForPlayer', {
            game_id: this.props.game.game_id,
            tick_factories: true,
          }, (triggers) => {
            this.props.auth.call('instances.getInstancesForGame', {
              game_id: this.props.game.game_id,
            }, (instances) => {
              this.setState({triggers: triggers.data, instances: instances.data});
              setTimeout(() => this.tickTriggers(), 5000);
            });
          });
        });
      };
      if (this.state && this.state.center) {
        let lat = this.state.center.lat;
        let lng = this.state.center.lng;
        if (this.props.location) {
          lat = this.props.location.coords.latitude;
          lng = this.props.location.coords.longitude;
        }
        this.props.auth.call('client.logPlayerMoved', {
          game_id: this.props.game.game_id,
          latitude: lat,
          longitude: lng,
        }, tick);
      } else {
        tick();
      }
    });
  },
  componentDidMount: function() {
    // stuff that used to be in componentWillMount
    var hash, n, ref, ref1;
    this.isMounted = true;
    // @ifdef NATIVE
    firebase.analytics().logEvent("view_siftr", {
      game_id: this.props.game.game_id
    });
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${
      this.props.game.game_id
    }`;
    RNFS.mkdir(siftrDir, {
      NSURLIsExcludedFromBackupKey: true
    });
    this.hardwareBack = () => {
      if (this.state.searchOpen) {
        if (this.isMounted) {
          this.setState({
            searchOpen: false
          });
        }
      } else {
        this.props.onExit();
      }
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", this.hardwareBack);
    this.keyboardShow = () => {
      this.setState({
        keyboardUp: true
      });
    };
    this.keyboardHide = () => {
      this.setState({
        keyboardUp: false
      });
    };
    Keyboard.addListener("keyboardWillShow", this.keyboardShow);
    Keyboard.addListener("keyboardWillHide", this.keyboardHide);
    // @endif
    // @ifdef WEB
    // web code removed
    // @endif
    if (this.props.nomenData != null) {
      this.applyNomenData({
        nomenData: this.props.nomenData,
        saved_note: this.props.saved_note
      });
    }
    this.tickTriggersOffline();
    this.checkQuestsOffline();

    // rest
    this.nomenTimer = setInterval(() => {
      this.checkNomenFieldData();
    }, 1000);
    if (this.props.createOnLaunch) {
      if (this.props.clearCreate) this.props.clearCreate();
      this.startCreate();
    }
    setTimeout(() => {
      if (this.props.location) {
        this.refs.theSiftrMap.moveToPoint({
          lat: this.props.location.coords.latitude,
          lng: this.props.location.coords.longitude,
        });
      }
    }, 2000);
  },
  componentWillUnmount: function() {
    this.isMounted = false;
    clearInterval(this.nomenTimer);
    // @ifdef NATIVE
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
    Keyboard.removeListener("keyboardWillShow", this.keyboardShow);
    Keyboard.removeListener("keyboardWillHide", this.keyboardHide);
    // @endif
    // @ifdef WEB
    window.removeEventListener("popstate", this.handleHistory);
    // @endif
  },
  componentWillReceiveProps: function(nextProps) {
    var newAuth, newGame, ref, ref1;
    newAuth = null;
    newGame = null;
    if (
      ((ref = this.props.auth.authToken) != null ? ref.user_id : void 0) !==
      ((ref1 = nextProps.auth.authToken) != null ? ref1.user_id : void 0)
    ) {
      // if we log in or out, reload the note search
      newAuth = nextProps.auth;
      if (this.state.viewingNote != null && this.props.auth.authToken != null) {
        // if we were logged in, close the open note
        if (this.isMounted) {
          this.setState({
            viewingNote: null
          });
          // TODO supposed to be web-only?
          history.pushState(null, "", "#");
        }
      }
      if (nextProps.auth.authToken == null) {
        // cancel note creation on logout
        if (this.isMounted) {
          this.setState({
            createNote: null
          });
        }
      }
    }
    if (this.props.nomenData == null && nextProps.nomenData != null) {
      this.applyNomenData({
        nomenData: nextProps.nomenData,
        saved_note: nextProps.saved_note
      });
    }
    if (this.props.game.game_id !== nextProps.game.game_id) {
      newGame = nextProps.game;
      // TODO: should also reset map position, tags, basically everything
      this.setState({
        map_notes: [],
        map_clusters: [],
        notes: []
      });
    }
    if (newAuth != null || newGame != null) {
      this.loadResults({
        auth: newAuth != null ? newAuth : void 0,
        game: newGame != null ? newGame : void 0
      });
    }
    if (
      this.props.queueMessage != null &&
      this.props.queueMessage !== nextProps.queueMessage &&
      this.props.online
    ) {
      // we uploaded a note, refresh tag totals
      this.getAllNotes();
    }
  },
  applyNomenData: function({ nomenData, saved_note }) {
    if (this.state.createNote != null) {
      // continue note filling in data
      if (this.isMounted) {
        this.setState({ nomenData });
      }
    } else {
      this.startCreate({ nomenData, saved_note });
    }
    this.props.clearNomenData();
  },
  checkNomenFieldData: function() {
    var field, field_data, matchingFields;
    // check if there is nomenData to make into field_data
    if (this.state.nomenData != null) {
      if (this.state.createNote != null) {
        if (this.state.createNote.field_data != null) {
          matchingFields = function() {
            var i, len, ref, results;
            ref = this.props.fields;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              field = ref[i];
              if (
                field.field_type === "NOMEN" &&
                parseInt(field.label) === this.state.nomenData.nomen_id
              ) {
                results.push(field);
              }
            }
            return results;
          }.call(this);
          if (matchingFields.length === 0) {
            return;
          }
          field = matchingFields[0];
          field_data = this.state.createNote.field_data.filter(fieldData => {
            return fieldData.field_id !== field.field_id;
          });
          field_data.push(
            new FieldData({
              field_id: field.field_id,
              field_data: this.state.nomenData.species_id
            })
          );
          if (this.isMounted) {
            this.setState({
              nomenData: null,
              createNote: update(this.state.createNote, {
                field_data: {
                  $set: field_data
                }
              })
            });
          }
        }
      } else {
        if (this.isMounted) {
          this.setState({
            nomenData: null
          });
        }
      }
    }
  },
  getColor: function(x) {
    let tag, index;
    if (!(this.props.tags != null && this.props.colors != null && x != null)) {
      return "white";
    }
    function numberField(field, value) {
      value = parseFloat(value);
      if (isNaN(value)) {
        return {color: 'white'};
      } else {
        const rgbaMin = hexToRGBA(field.min_color);
        const rgbaMax = hexToRGBA(field.max_color);
        const frac = (value - field.min) / (field.max - field.min);
        const mix = (a, b) => {
          const n = Math.round(a + (b - a) * frac);
          let s = n.toString(16);
          if (n < 16) s = '0' + s;
          return s;
        }
        return {
          color: '#' + [0, 1, 2].map((i) => mix(rgbaMin[i], rgbaMax[i])).join(''),
        };
      }
    }
    if (x instanceof Tag) {
      tag = x;
      index = this.props.tags.indexOf(tag);
    } else if (x instanceof FieldOption) {
      tag = x;
      const field = this.props.fields.find((field) => field.field_id === this.props.game.field_id_pin);
      index = field && field.options.indexOf(tag);
    } else if (this.props.game.newFormat() && x.field_data != null) {
      const option_id = x.field_data[this.props.game.field_id_pin];
      const field = this.props.fields.find((field) => field.field_id === this.props.game.field_id_pin);
      if (field && field.field_type === 'NUMBER') {
        tag = numberField(field, option_id);
      } else {
        tag = field && field.options.find((opt) => opt.field_option_id === parseInt(option_id));
        index = field && field.options.indexOf(tag);
      }
    } else if (x.tag_id != null) {
      tag = this.props.tags.find((tag) => tag.tag_id === parseInt(x.tag_id));
      index = this.props.tags.indexOf(tag);
    } else if (typeof x === "number" || typeof x === "string") {
      if (this.props.game.newFormat()) {
        const field = this.props.fields.find((field) => field.field_id === this.props.game.field_id_pin);
        if (field && field.field_type === 'NUMBER') {
          tag = numberField(field, x);
        } else {
          tag = field && field.options.find((opt) => opt.field_option_id === parseInt(x));
          index = field && field.options.indexOf(tag);
        }
      } else {
        tag = this.props.tags.find((tag) => tag.tag_id === parseInt(x));
        index = this.props.tags.indexOf(tag);
      }
    } else {
      return "white";
    }
    if (!tag) return 'white';
    if (tag.color) {
      return tag.color;
    }
    let ref1;
    return (ref1 = this.props.colors[
      `tag_${(index % 8) + 1}`
    ]) != null
      ? ref1
      : "white";
  },
  // @ifdef NATIVE
  getGoogleZoom: function() {
    var h, ref, ref1, ref2, ref3, w;
    if (this.state.bounds == null) {
      return 1;
    }
    w =
      ((ref = (ref1 = this.layout) != null ? ref1.width : void 0) != null
        ? ref
        : 400) * 2;
    h =
      ((ref2 = (ref3 = this.layout) != null ? ref3.height : void 0) != null
        ? ref2
        : 400) * 2;
    return fitBounds(this.state.bounds, {
      width: w,
      height: h
    }).zoom;
  },
  // @endif

  // @ifdef WEB
  getGoogleZoom: function() {
    return this.state.zoom;
  },
  // @endif
  commonSearchParams: function(
    filterByMap = true,
    { auth = this.props.auth, game = this.props.game } = {}
  ) {
    var o, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
    o = {
      game_id: game.game_id,
      search: (ref = this.state.searchParams.text) != null ? ref : "",
      order: (ref1 = this.state.searchParams.sort) != null ? ref1 : "recent",
      filter:
        auth.authToken != null && this.state.searchParams.mine
          ? "mine"
          : void 0,
      tag_ids: (ref2 = this.state.searchParams.tags) != null ? ref2 : void 0,
      min_time: timeToARIS(this.state.searchParams.min_time),
      max_time: timeToARIS(this.state.searchParams.max_time),
      zoom: this.getGoogleZoom()
    };
    if (filterByMap) {
      o.min_latitude =
        (ref3 = this.state.bounds) != null
          ? (ref4 = ref3.se) != null
            ? ref4.lat
            : void 0
          : void 0;
      o.max_latitude =
        (ref5 = this.state.bounds) != null
          ? (ref6 = ref5.nw) != null
            ? ref6.lat
            : void 0
          : void 0;
      o.min_longitude =
        (ref7 = this.state.bounds) != null
          ? (ref8 = ref7.nw) != null
            ? ref8.lng
            : void 0
          : void 0;
      o.max_longitude =
        (ref9 = this.state.bounds) != null
          ? (ref10 = ref9.se) != null
            ? ref10.lng
            : void 0
          : void 0;
    }
    return o;
  },
  loadAfterUpload: function() {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${
      this.props.game.game_id
    }`;
    this.loadResults();
    this.props.auth.siftrSearch({
      game_id: this.props.game.game_id,
      order: "recent",
      map_data: false,
    }, withSuccess(({notes}) => {
      this.setState({allNotes: notes});
      RNFS.writeFile(`${siftrDir}/notes.txt`, JSON.stringify(notes));
    }));
  },
  loadResults: function(authGame) {
    this.loadResultsSingle(true, authGame);
    this.loadResultsSingle(false, authGame);
  },
  loadResultsSingle: function(
    filterByMap,
    { auth = this.props.auth, game = this.props.game } = {}
  ) {
    var cluster,
      filteredNotes,
      lats,
      loadedAllKey,
      loadingKey,
      lons,
      map_clusters,
      map_notes,
      max_latitude,
      max_longitude,
      min_latitude,
      min_longitude,
      note,
      notesKey,
      params,
      ref,
      ref1,
      searchMatched,
      tags,
      word,
      words,
      xhrKey;
    notesKey = filterByMap ? "notes" : "notesEverywhere";
    loadedAllKey = filterByMap ? "loadedAll" : "loadedAllEverywhere";
    xhrKey = filterByMap ? "lastResultsXHR" : "lastResultsXHREverywhere";
    loadingKey = filterByMap ? "loading" : "loadingEverywhere";
    if (!this.props.online) {
      if (this.state.allNotes != null) {
        words = ((ref = this.state.searchParams.text) != null ? ref : "")
          .split(/\s+/)
          .filter(w => {
            return w.length;
          })
          .map(w => {
            return w.toLowerCase();
          });
        filteredNotes = function() {
          var i,
            j,
            len,
            len1,
            ref1,
            ref10,
            ref11,
            ref12,
            ref2,
            ref3,
            ref4,
            ref5,
            ref6,
            ref7,
            ref8,
            ref9,
            results;
          ref1 = this.state.allNotes;
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            note = ref1[i];
            if (filterByMap) {
              // filter by map
              if (
                (min_latitude =
                  (ref2 = this.state.bounds) != null
                    ? (ref3 = ref2.se) != null
                      ? ref3.lat
                      : void 0
                    : void 0) != null &&
                (max_latitude =
                  (ref4 = this.state.bounds) != null
                    ? (ref5 = ref4.nw) != null
                      ? ref5.lat
                      : void 0
                    : void 0) != null
              ) {
                if (
                  !(
                    min_latitude <= (ref6 = note.latitude) &&
                    ref6 <= max_latitude
                  )
                ) {
                  continue;
                }
              }
              if (
                (min_longitude =
                  (ref7 = this.state.bounds) != null
                    ? (ref8 = ref7.nw) != null
                      ? ref8.lng
                      : void 0
                    : void 0) != null &&
                (max_longitude =
                  (ref9 = this.state.bounds) != null
                    ? (ref10 = ref9.se) != null
                      ? ref10.lng
                      : void 0
                    : void 0) != null
              ) {
                if (min_longitude <= max_longitude) {
                  if (
                    !(
                      min_longitude <= (ref11 = note.longitude) &&
                      ref11 <= max_longitude
                    )
                  ) {
                    continue;
                  }
                } else {
                  if (
                    !(
                      min_longitude <= note.longitude ||
                      note.longitude <= max_longitude
                    )
                  ) {
                    // the international date line is inside the 2 longitudes
                    continue;
                  }
                }
              }
            }
            // filter by text
            searchMatched = true;
            for (j = 0, len1 = words.length; j < len1; j++) {
              word = words[j];
              if (
                !(
                  note.description.toLowerCase().indexOf(word) !== -1 ||
                  note.user.display_name.toLowerCase().indexOf(word) !== -1
                )
              ) {
                searchMatched = false;
                break;
              }
            }
            if (!searchMatched) {
              continue;
            }
            // filter by mine
            if (this.state.searchParams.mine) {
              if (note.user.user_id !== auth.authToken.user_id) {
                continue;
              }
            }
            // filter by tag
            if (!note.tag_id) {
              continue;
            }
            if ((tags = this.state.searchParams.tags) != null) {
              if (
                !(
                  tags.length === 0 ||
                  ((ref12 = note.tag_id), indexOf.call(tags, ref12) >= 0)
                )
              ) {
                continue;
              }
            }
            // filter by time
            if (
              this.state.searchParams.min_time != null &&
              this.state.searchParams.min_time > note.created.getTime()
            ) {
              continue;
            }
            if (
              this.state.searchParams.max_time != null &&
              this.state.searchParams.max_time < note.created.getTime()
            ) {
              continue;
            }
            results.push(note);
          }
          return results;
        }.call(this);
        ({ map_notes, map_clusters } = makeClusters(
          filteredNotes,
          35,
          this.getGoogleZoom()
        ));
        this.setState({
          map_notes: map_notes,
          map_clusters: (function() {
            var i, j, len, len1, name1, results;
            results = [];
            for (i = 0, len = map_clusters.length; i < len; i++) {
              cluster = map_clusters[i];
              lats = (function() {
                var j, len1, results1;
                results1 = [];
                for (j = 0, len1 = cluster.length; j < len1; j++) {
                  note = cluster[j];
                  results1.push(note.latitude);
                }
                return results1;
              })();
              lons = (function() {
                var j, len1, results1;
                results1 = [];
                for (j = 0, len1 = cluster.length; j < len1; j++) {
                  note = cluster[j];
                  results1.push(note.longitude);
                }
                return results1;
              })();
              let fields = {};
              cluster.forEach(note => {
                for (let k in note.field_data) {
                  let v = note.field_data[k];
                  if (v != null) {
                    if (!fields[k]) fields[k] = {};
                    if (fields[k][v] == null) {
                      fields[k][v] = 1;
                    } else {
                      fields[k][v] += 1;
                    }
                  }
                }
              });
              results.push({
                min_latitude: Math.min.apply(Math, lats),
                max_latitude: Math.max.apply(Math, lats),
                min_longitude: Math.min.apply(Math, lons),
                max_longitude: Math.max.apply(Math, lons),
                note_count: cluster.length,
                fields: fields,
                note_ids: (function() {
                  var k, len2, results1;
                  results1 = [];
                  for (k = 0, len2 = cluster.length; k < len2; k++) {
                    note = cluster[k];
                    results1.push(note.note_id);
                  }
                  return results1;
                })()
              });
            }
            return results;
          })(),
          [`${notesKey}`]: filteredNotes
        });
      }
      // otherwise, need to wait for notes to be deserialized
      return;
    }
    this[loadingKey] = true;
    if ((ref1 = this[xhrKey]) != null) {
      ref1.abort();
    }
    params = update(this.commonSearchParams(filterByMap, { auth, game }), {
      limit: {
        $set: 50
      }
    });
    return (this[xhrKey] = auth.siftrSearch(
      params,
      withSuccess(({ map_notes, map_clusters, notes }) => {
        var ref2;
        this[xhrKey] = null;
        if ((ref2 = this.refs.thumbs) != null) {
          ref2.scrollTop();
        }
        this[loadingKey] = false;
        if (this.isMounted) {
          this.setState({
            map_notes: map_notes,
            map_clusters: map_clusters,
            [`${notesKey}`]: notes,
            [`${loadedAllKey}`]: false
          });
        }
      })
    ));
  },
  loadMoreResults: function() {
    this.loadMoreResultsSingle(true);
    this.loadMoreResultsSingle(false);
  },
  loadMoreResultsSingle: function(filterByMap) {
    var currentNotes, loadedAllKey, loadingKey, notesKey, params, ref, xhrKey;
    notesKey = filterByMap ? "notes" : "notesEverywhere";
    loadedAllKey = filterByMap ? "loadedAll" : "loadedAllEverywhere";
    xhrKey = filterByMap ? "lastResultsXHR" : "lastResultsXHREverywhere";
    loadingKey = filterByMap ? "loading" : "loadingEverywhere";
    if (!this.props.online) {
      return;
    }
    currentNotes = this.state[notesKey];
    if (this[loadingKey] || this.state[loadedAllKey] || currentNotes == null) {
      return;
    }
    this[loadingKey] = true;
    if ((ref = this[xhrKey]) != null) {
      ref.abort();
    }
    params = update(this.commonSearchParams(filterByMap), {
      offset: {
        $set: currentNotes.length
      },
      map_data: {
        $set: false
      },
      limit: {
        $set: 50
      }
    });
    return (this[xhrKey] = this.props.auth.siftrSearch(
      params,
      withSuccess(({ notes }) => {
        this[xhrKey] = null;
        this[loadingKey] = false;
        if (this.isMounted) {
          this.setState({
            [`${notesKey}`]: currentNotes.concat(notes),
            [`${loadedAllKey}`]: notes.length < 50
          });
        }
      })
    ));
  },
  moveMap: function(obj) {
    if (this.isMounted) {
      this.setState(obj, () => {
        this.loadResults();
      });
    }
  },
  loadNoteByID: function(note_id, from_history = false) {
    this.props.auth.searchNotes(
      {
        game_id: this.props.game.game_id,
        note_id: note_id
      },
      withSuccess(data => {
        if (!this.isMounted) {
          return;
        }
        this.setState(
          {
            viewingNote: data[0],
            createNote: null,
            viewPopup: false,
          },
          () => {
            // @ifdef WEB
            if (!from_history) {
              history.pushState(note_id, "", "#" + note_id);
            }
            // @endif
          }
        );
      })
    );
  },
  selectNote: function(note) {
    if (note.pending) {
      this.setState({
        viewingNote: note,
        searchOpen: false,
        createNote: null,
        viewPopup: false,
      });
      return;
    }
    if (note.note_id === 0) {
      return;
    }
    if (this.props.online) {
      this.loadNoteByID(note.note_id);
      this.setState({
        searchOpen: false,
        createNote: null,
        viewPopup: false,
      });
    } else if (this.isMounted) {
      this.setState({
        viewingNote: note,
        searchOpen: false,
        createNote: null,
        viewPopup: false,
      });
    }
  },
  deleteNote: function(note) {
    this.props.auth.call(
      "notes.deleteNote",
      {
        note_id: note.note_id
      },
      withSuccess(() => {
        if (!this.isMounted) {
          return;
        }
        this.setState({
          viewingNote: null
        });
        this.loadResults();
      })
    );
  },
  flagNote: function(note) {
    this.props.auth.call(
      "notes.flagNote",
      {
        note_id: note.note_id
      },
      withSuccess(() => {
        if (!this.isMounted) {
          return;
        }
        this.setState({
          viewingNote: null
        });
        this.loadResults();
      })
    );
  },
  renderSearch: function() {
    let tags = [];
    if (this.props.game.newFormat()) {
      if (this.props.fields != null) {
        const field = this.props.fields.find((field) => field.field_id === this.props.game.field_id_pin);
        if (field) {
          tags = field.options;
        }
      }
    } else {
      if (this.props.tags != null) {
        tags = this.props.tags;
      }
    }
    return (
      <SearchNotes
        auth={this.props.auth}
        game={this.props.game}
        tags={tags}
        searchParams={this.state.searchParams}
        onSearch={searchParams => {
          if (!this.isMounted) {
            return;
          }
          this.setState({ searchParams }, () => {
            this.loadResults();
          });
        }}
        getColor={this.getColor}
        allNotes={this.state.allNotes}
      />
    );
  },
  closeNote: function() {
    if (this.isMounted) {
      this.setState({
        viewingNote: null
      });
      // @ifdef WEB
      history.pushState(null, "", "#");
      // @endif
    }
  },
  renderNoteView: function() {
    if (this.state.viewingNote != null) {
      return (
        <SiftrNoteView
          ref={noteView => {
            return (this.noteView = noteView);
          }}
          note={this.state.viewingNote}
          onClose={() => {
            this.closeNote();
          }}
          auth={this.props.auth}
          onDelete={this.deleteNote}
          onFlag={this.flagNote}
          onEdit={this.startEdit}
          onReload={note => {
            this.loadNoteByID(note.note_id);
          }}
          isAdmin={this.props.isAdmin}
          onPromptLogin={this.props.onPromptLogin}
          getColor={this.getColor}
          fields={this.props.fields}
          game={this.props.game}
          tag={(() => {
            var i, len, ref, ref1, tag;
            ref1 = (ref = this.props.tags) != null ? ref : [];
            for (i = 0, len = ref1.length; i < len; i++) {
              tag = ref1[i];
              if (tag.tag_id === this.state.viewingNote.tag_id) {
                return tag;
              }
            }
          })()}
          online={this.props.online}
        />
      );
    }
  },
  pushModal: function(modal) {
    this.setState(old => update(old, {
      modals: {$apply: (ary) => [modal].concat(ary)}
    }));
  },
  popModal: function() {
    this.setState(old => update(old, {
      modals: {$apply: (ary) => ary.slice(1)}
    }));
  },
  renderMap: function() {
    var ref;
    return (
      <SiftrMap
        location={this.props.location}
        map_notes={(() => {
          var pin;
          // @ifdef WEB
          if (this.state.createNote != null && this.state.createStep === 5) {
            pin = new Note();
            pin.note_id = 0;
            pin.latitude = this.state.createNote.location.lat;
            pin.longitude = this.state.createNote.location.lng;
            pin.description = this.state.createNote.caption;
            pin.tag_id = this.state.createNote.category ? this.state.createNote.category.tag_id : 0;
            return [pin];
          } else if (this.state.createNote != null) {
            return []; // pin gets shown by CreateStep3 instead
          } else {
            return this.state.map_notes;
          }
          // @endif
          // @ifdef NATIVE
          if (this.state.createNote != null && this.state.createStep > 1) {
            pin = new Note();
            pin.note_id = 0;
            pin.latitude = this.state.center.lat;
            pin.longitude = this.state.center.lng;
            pin.description = this.state.createNote.caption;
            pin.tag_id = this.state.createNote.category ? this.state.createNote.category.tag_id : 0;
            return [pin];
          } else {
            return this.state.map_notes;
          }
          // @endif
        })()}
        triggers={this.getTriggers()}
        instances={this.getInstances()}
        plaques={this.props.plaques}
        items={this.props.items}
        auth={this.props.auth}
        logs={this.state.logs}
        onSelectItem={(o) => {
          if (!this.props.location) return;
          const distance = Math.ceil(meterDistance(o.trigger, this.props.location.coords));
          if (distance > 100 && false) {
            Alert.alert(
              'Too far',
              `You are ${distance}m away. Walk ${distance - 100}m closer`,
              [
                {text: 'OK'},
              ],
            );
          } else {
            this.pushModal(update(o, {type: {$set: 'trigger'}}));
          }
        }}
        pendingNotes={(() => {
          // @ifdef WEB
          return [];
          // @endif
          // @ifdef NATIVE
          if (this.state.createNote != null && this.state.createStep > 1) {
            return [];
          } else {
            var ref;
            return (ref = this.props.pendingNotes) != null ? ref : [];
          }
          // @endif
        })()}
        map_clusters={(() => {
          if (this.state.createNote != null) {
            return [];
          } else {
            return this.state.map_clusters;
          }
        })()}
        onMove={this.moveMap}
        onLayout={event => {
          return (this.layout = event.nativeEvent.layout);
        }}
        center={this.state.center}
        zoom={this.state.zoom}
        delta={this.state.delta}
        getColor={this.getColor}
        colors={this.props.colors}
        theme={this.props.theme}
        onSelectNote={this.selectNote}
        key={1}
        ref="theSiftrMap"
        onMouseEnter={obj => {
          this.setState({
            mapHover: obj
          });
        }}
        onMouseLeave={obj => {
          if (this.state.mapHover === obj) {
            this.setState({
              mapHover: null
            });
          }
        }}
        thumbHover={this.state.thumbHover && this.state.thumbHover.note_id}
        tags={this.props.tags}
        game={this.props.game}
        fields={this.props.fields}
      />
    );
  },
  renderThumbnails: function() {
    var filterByMap, loadedAllKey, note_id, note_ids, notesKey, ref, ref1;
    filterByMap = this.state.mainView === "hybrid";
    notesKey = filterByMap ? "notes" : "notesEverywhere";
    loadedAllKey = filterByMap ? "loadedAll" : "loadedAllEverywhere";
    return (
      <SiftrThumbnails
        ref="thumbs"
        view={this.state.mainView}
        online={this.props.online}
        auth={this.props.auth}
        notes={this.state[notesKey]}
        game={this.props.game}
        pendingNotes={(() => {
          // @ifdef WEB
          return [];
          // @endif
          // @ifdef NATIVE
          return this.props.pendingNotes || [];
          // @endif
        })()}
        getColor={this.getColor}
        onSelectNote={this.selectNote}
        key={2}
        hasMore={!this.state[loadedAllKey]}
        loadMore={this.loadMoreResults}
        onMouseEnter={note => {
          this.setState({
            thumbHover: note
          });
        }}
        onMouseLeave={note => {
          if (this.state.thumbHover === note) {
            this.setState({
              thumbHover: null
            });
          }
        }}
        mapHover={
          (note_id =
            (ref = this.state.mapHover) != null ? ref.note_id : void 0) != null
            ? [note_id]
            : (note_ids =
                (ref1 = this.state.mapHover) != null
                  ? ref1.note_ids
                  : void 0) != null
              ? note_ids.map(x => {
                  return parseInt(x);
                })
              : []
        }
      />
    );
  },
  locateNote: function(exif, cb) {
    // first use existing center
    if (this.state.createNote.location != null) {
      cb(this.state.createNote.location);
      return;
    }
    // then get location from exif. first, complicated form from exif.js
    let lat = exif != null ? exif.GPSLatitude : void 0;
    let lng = exif != null ? exif.GPSLongitude : void 0;
    if (lat != null && lng != null) {
      const readRat = function(rat) {
        return rat.numerator / rat.denominator;
      };
      const readGPS = function([deg, min, sec]) {
        return readRat(deg) + readRat(min) / 60 + readRat(sec) / 3600;
      };
      lat = readGPS(lat);
      if (exif.GPSLatitudeRef === "S") {
        lat *= -1;
      }
      lng = readGPS(lng);
      if (exif.GPSLongitudeRef === "W") {
        lng *= -1;
      }
      cb({ lat, lng });
      return;
    }
    // simple form returned by RN CameraRoll
    lat = exif != null ? exif.latitude : void 0;
    lng = exif != null ? exif.longitude : void 0;
    if (lat != null && lng != null) {
      cb({ lat, lng });
      return;
    }
    // try geolocation api for user's current location
    if (this.props.location) {
      cb({
        lat: this.props.location.coords.latitude,
        lng: this.props.location.coords.longitude,
      });
      return;
    }
    // or just use game's location
    cb({
      lat: this.props.game.latitude,
      lng: this.props.game.longitude
    });
  },
  startLocatingNote: function({ exif } = {}) {
    if (!this.isMounted) return;
    this.locateNote(exif, center => {
      if (!this.isMounted) return;
      this.setState({center});
      // @ifdef NATIVE
      if (this.refs.theSiftrMap) {
        this.refs.theSiftrMap.moveToPoint(center);
      }
      // @endif
    });
  },
  startCreate: function({ nomenData, saved_note } = {}) {
    if (this.props.fields == null) {
      setTimeout(() => {
        this.startCreate({nomenData, saved_note});
      }, 500);
      return;
    }
    var loc, note, obj;
    if (this.state.createNote != null) {
      return;
    }
    if (this.props.auth.authToken != null || !this.props.online) {
      obj = {
        createNote: {files: []},
        createStep: 3,
        searchOpen: false,
        viewingNote: null,
        primaryMenuOpen: false,
        nomenData: nomenData
      };
      // @ifdef WEB
      obj.createStep = 1;
      // @endif
      if ((note = saved_note != null ? saved_note.note : void 0) != null) {
        obj.createNote = note;
        obj.createStep = 2;
      }
      if ((loc = saved_note != null ? saved_note.location : void 0) != null) {
        obj.resumedNote = true;
        obj.center = loc;
        setTimeout(() => {
          var ref;
          return (ref = this.refs.theSiftrMap) != null
            ? ref.moveToPoint(loc)
            : void 0;
        }, 1000);
      } else {
        obj.resumedNote = false;
      }
      this.setState(obj);
      this.closeNote();
    } else {
      this.props.onPromptLogin();
    }
  },
  startEdit: function(note, field_data) {
    var obj;
    if (this.props.auth.authToken != null || !this.props.online) {
      obj = {
        createNote: {
          note_id: note.note_id,
          caption: note.description,
          category: (() => {
            var i, len, ref, tag;
            ref = this.props.tags;
            for (i = 0, len = ref.length; i < len; i++) {
              tag = ref[i];
              if (tag.tag_id === note.tag_id) {
                return tag;
              }
            }
          })(),
          location: {
            lat: note.latitude,
            lng: note.longitude
          },
          field_data: field_data
        },
        createStep: (this.props.game.newFormat() ? 3 : 2),
        searchOpen: false,
        viewingNote: null,
        primaryMenuOpen: false
      };
      this.setState(obj, () => {
        this.startLocatingNote();
      });
      // @ifdef WEB
      history.pushState(null, "", "#");
      // @endif
    } else {
      this.props.onPromptLogin();
    }
  },
  renderCreateNote: function() {
    var ref, ref1, ref2, ref3;
    // @ifdef NATIVE
    if (this.state.createNote == null) {
      return null;
    } else if (this.state.createStep === 1) {
      return (
        <CreatePhoto
          game={this.props.game}
          onCancel={() => {
            this.setState({
              createNote: null
            });
          }}
          onSelectImage={(file, location) => {
            this.setState({
              createNote: {
                files: [
                  {
                    field_id: this.props.game.field_id_preview,
                    file: file
                  }
                ],
                caption: "",
                category: this.props.tags[0],
                field_data: [],
                online: false,
                exif: location
              },
              createStep: 2
            });
          }}
        />
      );
    } else {
      return (
        <CreateData
          game={this.props.game}
          createNote={this.state.createNote}
          onUpdateNote={(createNote, cb) => {
            this.setState({ createNote }, cb);
          }}
          getLocation={(cb) => {
            this.locateNote(this.state.createNote.exif, cb);
          }}
          onStartLocation={(center) => {
            if (center) {
              this.setState({center});
              // @ifdef NATIVE
              if (this.refs.theSiftrMap) {
                this.refs.theSiftrMap.moveToPoint(center);
              }
              // @endif
            }
          }}
          selectLocation={() => {
            return this.state.center;
          }}
          categories={(ref = this.props.tags) != null ? ref : []}
          fields={(ref1 = this.props.fields) != null ? ref1 : []}
          onFinish={this.finishNoteCreation}
          onCancel={() => {
            this.setState({
              createNote: null
            });
          }}
          onBack={() => {
            this.setState({
              createNote: {},
              createStep: 1
            });
          }}
          getColor={this.getColor}
          progress={this.state.progress}
          onViolaIdentify={this.props.onViolaIdentify}
          resumedNote={this.state.resumedNote}
          quests={this.state.quests}
          isGuideComplete={this.isGuideComplete/*.bind(this)*/}
        />
      );
    }
    // @endif
    // @ifdef WEB
    if (this.state.createNote == null) {
      return null;
    } else if (this.state.createStep === 1) {
      return (
        <CreateStep1
          auth={this.props.auth}
          game={this.props.game}
          onCancel={() => {
            this.setState({
              createNote: null
            });
          }}
          onStartUpload={() => {
            this.setState((oldState) => update(oldState, {
              createNote: {
                caption: {
                  $set: "",
                },
              },
              createStep: {
                $set: this.props.game.newFormat() ? 3 : 2,
              },
            }));
          }}
          onProgress={n => {
            var t;
            if (!(this.isMounted && this.state.createNote != null)) {
              return;
            }
            t = Date.now();
            if (
              this.state.progressTime == null ||
              t - this.state.progressTime > 300
            ) {
              this.setState({
                progress: n,
                progressTime: t
              });
            }
          }}
          onCreateMedia={({ media, exif }, fieldMedia) => {
            var ref2, ref3, ref4, ref5;
            if (!(this.isMounted && this.state.createNote != null)) {
              return;
            }
            this.setState((oldState) => update(oldState, {
              createNote: {
                media: {$set: media},
                exif: {$set: exif},
                field_media: {$set: fieldMedia},
              }
            }));
          }}
          fields={(ref2 = this.props.fields) != null ? ref2 : []}
        />
      );
    } else if (this.state.createStep === 2) {
      return (
        <CreateStep2
          game={this.props.game}
          categories={(ref3 = this.props.tags) != null ? ref3 : []}
          note={this.state.createNote}
          onEnterCaption={({ text, category }) => {
            this.setState(
              {
                createNote: update(this.state.createNote, {
                  caption: {
                    $set: text
                  },
                  category: {
                    $set: category
                  }
                }),
                createStep: 3
              },
              () => {
                this.startLocatingNote({
                  exif: this.state.createNote.exif
                });
              }
            );
          }}
          onCancel={() => {
            this.setState({
              createNote: null
            });
          }}
          onBack={() => {
            this.setState({
              createNote: {},
              createStep: 1
            });
          }}
          getColor={this.getColor}
          progress={
            (this.state.createNote.media != null || this.state.createNote.field_media != null) ||
            this.state.createNote.note_id != null
              ? null
              : this.state.progress
          }
        />
      );
    } else if (this.state.createStep === 3) {
      return (
        <CreateStep3
          note={this.state.createNote}
          onPickLocation={() => {
            this.setState({
              createNote: update(this.state.createNote, {
                location: {
                  $set: this.state.center
                }
              }),
              createStep: 5
            });
          }}
          onCancel={() => {
            this.setState({
              createNote: null
            });
          }}
          onBack={() => {
            this.setState({
              createNote: this.props.game.newFormat() ? {} : undefined,
              createStep: this.props.game.newFormat() ? 1 : 2,
            });
          }}
          progress={
            (this.state.createNote.media != null || this.state.createNote.field_media != null) ||
            this.state.createNote.note_id != null
              ? null
              : this.state.progress
          }
        />
      );
    } else {
      return (
        <CreateStep5
          onChangeData={field_data => {
            this.setState({
              createNote: update(this.state.createNote, {
                field_data: {
                  $set: field_data
                }
              })
            });
          }}
          onFinish={this.finishNoteCreation}
          onCancel={() => {
            this.setState({
              createNote: null
            });
          }}
          onBack={() => {
            this.setState({
              center: this.state.createNote.location,
              createStep: 3
            });
          }}
          fields={this.props.fields}
          field_data={this.state.createNote.field_data}
          progress={
            (this.state.createNote.media != null || this.state.createNote.field_media != null) ||
            this.state.createNote.note_id != null
              ? null
              : this.state.progress
          }
        />
      );
    }
    // @endif
  },
  finishNoteCreation: function(
    field_data = (this.state.createNote && this.state.createNote.field_data) || [],
    location
  ) {
    var caption,
      category,
      createArgs,
      f,
      field_media,
      files,
      filesToCopy,
      i,
      len,
      media,
      name,
      note_id,
      queueDir,
      updateArgs;
    if (!location) {
      // @ifdef WEB
      location = this.state.createNote.location;
      // @endif
      // @ifdef NATIVE
      location = this.state.center;
      // @endif
    }
    if (this.state.createNote.note_id != null) {
      // editing an existing note
      ({ note_id, caption, category } = this.state.createNote);
      updateArgs = {
        note_id: note_id,
        game_id: this.props.game.game_id,
        description: caption,
        trigger: {
          latitude: location.lat,
          longitude: fixLongitude(location.lng)
        },
        tag_id: category && category && category.tag_id,
        field_data: field_data
      };
      this.props.auth.call(
        "notes.updateNote",
        updateArgs,
        withSuccess(note => {
          this.setState({
            createNote: null
          });
          this.loadResults();
          this.loadNoteByID(note.note_id);
        })
      );
    } else {
      // creating a new note
      ({
        media,
        files,
        caption,
        category,
        field_media
      } = this.state.createNote);
      createArgs = {
        game_id: this.props.game.game_id,
        description: caption,
        trigger: {
          latitude: location.lat,
          longitude: fixLongitude(location.lng)
        },
        tag_id: category && category.tag_id,
        field_data: field_data.concat(field_media || []),
        password: this.props.auth.password,
      };
      if (media != null || field_media != null) {
        // we've already uploaded media, now create note
        createArgs.media_id = (media ? media.media_id : 0);
        this.props.auth.call(
          "notes.createNote",
          createArgs,
          withSuccess(note => {
            this.setState({
              createNote: null
            });
            this.loadResults();
            this.loadNoteByID(note.note_id);
          })
        );
      } else {
        // @ifdef NATIVE
        // save note for later upload queue
        this.props.addXP(2);
        queueDir = `${RNFS.DocumentDirectoryPath}/siftrqueue/${Date.now()}`;
        filesToCopy = [];
        for (i = 0, len = files.length; i < len; i++) {
          f = files[i];
          if (f.file == null) {
            continue;
          }
          name = f.file.name;
          if (f.field_id != null) {
            name = `${f.field_id}.${name.split(".").pop()}`;
          }
          if (createArgs.files == null) {
            createArgs.files = [];
          }
          createArgs.files.push({
            field_id: f.field_id,
            filename: name,
            mimetype: f.file.type,
            game_id: this.props.game.game_id
          });
          filesToCopy.push({
            copyFrom: f.file.uri,
            copyTo: `${queueDir}/${name}`
          });
        }
        return RNFS.mkdir(queueDir)
          .then(() => {
            return RNFS.writeFile(
              `${queueDir}/createNote.json`,
              JSON.stringify(createArgs)
            );
          })
          .then(() => {
            var fileToCopy;
            return Promise.all(
              (function() {
                var j, len1, results;
                results = [];
                for (j = 0, len1 = filesToCopy.length; j < len1; j++) {
                  fileToCopy = filesToCopy[j];
                  if (fileToCopy.copyFrom.match(/^assets-library/)) {
                    results.push(
                      RNFS.copyAssetsFileIOS(
                        fileToCopy.copyFrom,
                        fileToCopy.copyTo,
                        0,
                        0
                      )
                    );
                  } else {
                    results.push(
                      RNFS.copyFile(fileToCopy.copyFrom, fileToCopy.copyTo)
                    );
                  }
                }
                return results;
              })()
            );
          })
          .then(() => {
            this.setState({
              createNote: null
            });
          })
          .catch(err => {
            return console.warn(JSON.stringify(err));
          });
        // @endif
      }
    }
  },
  hasCards: function() {
    return this.props.game.field_id_preview || this.props.game.field_id_caption;
  },
  // @ifdef NATIVE
  saveInventory: function() {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${
      this.props.game.game_id
    }`;
    RNFS.writeFile(`${siftrDir}/inventory.txt`, JSON.stringify(this.state.inventory));
  },
  isGuideComplete: function(field_guide) {
    if (['number', 'string'].indexOf(typeof field_guide) !== -1) {
      field_guide = this.props.guides.find(guide => parseInt(guide.field_guide_id) === parseInt(field_guide));
    }
    const field = this.props.fields.find(field => parseInt(field.field_id) === parseInt(field_guide.field_id));
    if (!field) return false;
    return field.options.every(option =>
      !parseInt(option.remnant_id) || this.state.inventory.find(inst =>
        inst.object_type === 'ITEM'
        && inst.owner_type === 'USER'
        && parseInt(inst.object_id) === parseInt(option.remnant_id)
        && parseInt(inst.qty) > 0
      )
    );
  },
  render: function() {
    var hasOptions, ref2, ref3, ref4;
    if (this.state.settingsInViola) {
      return (
        <NativeSettings
          onClose={() => {
            this.setState({
              settingsInViola: false
            });
          }}
          onLogout={this.props.onLogout}
          auth={this.props.auth}
          onChangePassword={this.props.onChangePassword}
          onEditProfile={this.props.onEditProfile}
          queueMessage={this.props.queueMessage}
          online={this.props.online}
        />
      );
    }
    let authorNames = '…';
    if (this.props.authors) {
      authorNames = this.props.authors.join(', ');
    }
    return (
      <KeyboardAwareView
        style={{
          flexDirection: "column",
          flex: 1,
          backgroundColor: "white"
        }}
      >
        {
          <SiftrInfo
            game={this.props.game}
            isOpen={this.state.infoOpen}
            onChange={b => {
              this.setState({
                infoOpen: b
              });
            }}
            tags={this.props.tags}
            getColor={this.getColor}
            notes={this.state.allNotes}
            followed={this.props.followed}
            followGame={() => {
              this.props.followGame(this.props.game);
            }}
            unfollowGame={() => {
              this.props.unfollowGame(this.props.game);
            }}
            viola={this.props.viola}
            onViolaSettings={() => {
              this.setState({
                settingsInViola: true
              });
            }}
            auth={this.props.auth}
            online={this.props.online}
          >
            <StatusSpace
              queueMessage={this.props.queueMessage}
            />
            {
              this.state.viewingNote &&
              <Blackout isFocused={false} keyboardUp={this.state.keyboardUp}>
                {
                  this.state.createNote ? null :
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "white"
                    }}
                  >
                    {
                      <TouchableOpacity
                        onPress={
                          this.state.viewingNote != null
                            ? (() => this.closeNote())
                            : this.state.searchOpen
                              ? (() => this.setState({searchOpen: false}))
                              : this.state.createNote != null
                                ? (() => this.setState({createNote: null}))
                                : this.props.onExit
                        }
                      >
                        <Image
                          style={{
                            margin: 15,
                            resizeMode: "contain",
                            width: 69 * 0.18,
                            height: 112 * 0.18,
                            opacity:
                              Platform.OS === "ios" &&
                              this.props.aris &&
                              this.state.viewingNote == null &&
                              !this.state.searchOpen
                                ? 0
                                : 1
                          }}
                          source={require("../web/assets/img/disclosure-arrow-left.png")}
                        />
                      </TouchableOpacity>
                    }
                    <View
                      style={{
                        flex: 1,
                        alignItems: "flex-start",
                      }}
                    >
                      {
                        this.state.viewingNote != null
                        ? [ <Text key={1} style={{
                              fontWeight: 'bold',
                            }}>
                              {this.props.game.name}
                            </Text>
                          , <Text key={2} style={{
                              color: 'rgb(140,140,140)',
                            }}>
                              {`Post by: ${this.state.viewingNote.user.display_name}`}
                            </Text>
                          ]
                        : this.state.createNote != null
                          ? [ <Text key={1} style={{
                                fontWeight: 'bold',
                              }}>
                                {`Posting to: ${this.props.game.name}`}
                              </Text>
                            , <Text key={2} numberOfLines={1} style={{
                                color: 'rgb(140,140,140)',
                              }}>
                                {authorNames}
                              </Text>
                            ]
                          : [ <Text key={1} style={{
                                fontWeight: 'bold',
                              }}>
                                {this.props.game.name}
                              </Text>
                            , <Text key={2} numberOfLines={1} style={{
                                color: 'rgb(140,140,140)',
                              }}>
                                {authorNames}
                              </Text>
                            ]
                      }
                    </View>
                    {this.state.viewingNote != null ? (
                      ((hasOptions = false),
                      hasOptions ||
                        (hasOptions =
                          this.state.viewingNote.user.user_id ===
                          ((ref2 = this.props.auth.authToken) != null
                            ? ref2.user_id
                            : void 0)),
                      hasOptions ||
                        (hasOptions =
                          this.state.viewingNote.published === "AUTO" &&
                          ((ref3 = this.props.auth.authToken) != null
                            ? ref3.user_id
                            : void 0) !== this.state.viewingNote.user.user_id),
                      hasOptions ||
                        (hasOptions =
                          this.state.viewingNote.user.user_id ===
                            ((ref4 = this.props.auth.authToken) != null
                              ? ref4.user_id
                              : void 0) || this.props.isAdmin),
                      hasOptions ? (
                        <TouchableOpacity
                          onPress={() => {
                            var ref5;
                            return (ref5 = this.noteView) != null
                              ? ref5.openNoteOptions()
                              : void 0;
                          }}
                        >
                          <Image
                            style={{
                              resizeMode: "contain",
                              height: 5,
                              margin: 10
                            }}
                            source={require("../web/assets/img/icon-3dots.png")}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={{
                            opacity: 0
                          }}
                        >
                          <Image
                            style={{
                              resizeMode: "contain",
                              height: 5,
                              margin: 10
                            }}
                            source={require("../web/assets/img/icon-3dots.png")}
                          />
                        </View>
                      ))
                    ) : (
                      <View style={{flexDirection: 'row'}}>
                        <TouchableOpacity
                          onPress={() => this.pushModal({type: 'quests'})}
                        >
                          <View style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 7,
                            paddingRight: 7,
                            margin: 10,
                            borderColor: 'black',
                            borderWidth: 1,
                            borderRadius: 5,
                          }}>
                            <Text>quests</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => this.pushModal({type: 'inventory'})}
                        >
                          <View style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 7,
                            paddingRight: 7,
                            margin: 10,
                            borderColor: 'black',
                            borderWidth: 1,
                            borderRadius: 5,
                          }}>
                            <Text>items</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            this.props.auth.call('client.logPlayerResetGame', {
                              game_id: this.props.game.game_id,
                            });
                          }}
                        >
                          <View style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 7,
                            paddingRight: 7,
                            margin: 10,
                            borderColor: 'black',
                            borderWidth: 1,
                            borderRadius: 5,
                          }}>
                            <Text style={{color: 'red'}}>reset</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                }
              </Blackout>
            }
            <View
              style={{
                flex: 1
              }}
            >
              {
                this.state.createNote != null
                ? this.renderMap()
                : this.hasCards()
                  ? ( this.state.mainView === "thumbs" || this.state.mainView === "hybrid"
                      ? [this.renderMap(), this.renderThumbnails()]
                      : [this.renderThumbnails(), this.renderMap()]
                    )
                  : this.renderMap()
              }
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  right: 10,
                  backgroundColor: 'white',
                  borderRadius: 5,
                  paddingTop: 3,
                  paddingBottom: 3,
                  paddingLeft: 7,
                  paddingRight: 7,
                  alignItems: 'flex-start',
                }}
              >
                {
                  this.props.currentQuest && (
                    <Text style={{margin: 10}}>
                      { this.props.currentQuest.prompt || this.props.currentQuest.name }
                    </Text>
                  )
                }
                <TouchableOpacity
                  onPress={() => this.pushModal({type: 'quests'})}
                  style={{
                    margin: 10,
                    padding: 10,
                    backgroundColor: 'rgb(114,236,222)',
                    borderRadius: 10,
                    fontSize: 20,
                  }}
                >
                  <Text>View Quests</Text>
                </TouchableOpacity>
              </View>
              <CacheMedia
                media_id={63}
                auth={this.props.auth}
                online={true}
                withURL={(url) =>
                  <View pointerEvents="none" style={{
                    position: 'absolute',
                    position: 'absolute',
                    bottom: 100,
                    left: 0,
                    right: 0,
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <ModelView
                      source={{ zip: url }}
                      style={{
                        width: 200,
                        height: 150,
                      }}
                      autoPlay={true}
                    />
                  </View>
                }
              />
              <View pointerEvents="box-none" style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                right: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <TouchableOpacity
                  onPress={() => this.pushModal({type: 'inventory'})}
                >
                  <Image
                    source={require('../web/assets/img/stemports-codex.png')}
                    style={{
                      width: 163 * 0.5,
                      height: 127 * 0.5,
                    }}
                  />
                </TouchableOpacity>
                {
                  // show if player has at least one remnant set finished
                  this.props.guides.some(guide => this.isGuideComplete(guide)) && (
                    <TouchableOpacity
                      style={{
                        padding: 10
                      }}
                      onPress={this.startCreate}
                    >
                      <Image
                        source={require('../web/assets/img/stemports-plus.png')}
                        style={{
                          width: 122 * 0.5,
                          height: 124 * 0.5,
                        }}
                      />
                    </TouchableOpacity>
                  )
                }
                <TouchableOpacity
                  onPress={() => {
                    this.pushModal({type: 'menu'});
                  }}
                >
                  <View style={{
                    padding: 8,
                    backgroundColor: 'white',
                    borderColor: 'black',
                    borderWidth: 1,
                    borderRadius: 5,
                  }}>
                    <Text>menu</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {this.renderNoteView()}
              {this.renderCreateNote()}
              {
                this.state.modals.length > 0
                && !(this.state.viewingNote)
                && !(this.state.createNote)
                && !(this.state.searchOpen)
                && (() => {
                  const modal = this.state.modals[0];
                  if (modal.type === 'quest-available') {
                    return (
                      <QuestDetails
                        quest={modal.quest}
                        message="New quest available"
                        onClose={this.popModal/*.bind(this)*/}
                        status="active"
                        auth={this.props.auth}
                      />
                    );
                  } else if (modal.type === 'quest-complete') {
                    return (
                      <QuestDetails
                        quest={modal.quest}
                        message="Quest complete!"
                        onClose={this.popModal/*.bind(this)*/}
                        status="complete"
                        auth={this.props.auth}
                      />
                    );
                  } else if (modal.type === 'inventory') {
                    return (
                      <InventoryScreen
                        auth={this.props.auth}
                        game={this.props.game}
                        onClose={this.popModal/*.bind(this)*/}
                        items={this.props.items}
                        tags={this.props.tags}
                        inventory={this.state.inventory}
                        object_tags={this.props.object_tags}
                        pickedUpRemnants={this.state.pickedUpRemnants}
                        onPlace={item_id => {
                          this.props.addXP(2);
                          this.setState(state => update(state, {
                            pickedUpRemnants: {
                              $apply: remnants => remnants.filter(remnant => remnant !== item_id),
                            },
                            inventory: {
                              $apply: inv => inv.map(inst => {
                                if (parseInt(inst.object_id) === parseInt(item_id)) {
                                  return update(inst, {
                                    qty: {$apply: n => parseInt(n) + 1},
                                  });
                                } else {
                                  return inst;
                                }
                              }),
                            },
                          }), () => this.saveInventory());
                        }}
                      />
                    );
                  } else if (modal.type === 'quests') {
                    return (
                      <QuestsScreen
                        auth={this.props.auth}
                        game={this.props.game}
                        onClose={this.popModal/*.bind(this)*/}
                        quests={this.state.quests}
                      />
                    );
                  } else if (modal.type === 'menu') {
                    const buttonStyle = {
                      margin: 10,
                      backgroundColor: 'white',
                      borderColor: 'black',
                      borderRadius: 5,
                      borderWidth: 2,
                      padding: 10,
                    };
                    return (
                      <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <TouchableOpacity style={buttonStyle} onPress={this.props.onLogout}>
                          <Text>Logout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={buttonStyle} onPress={() => {
                          this.props.auth.call('client.logPlayerResetGame', {
                            game_id: this.props.game.game_id,
                          });
                          this.popModal();
                        }}>
                          <Text style={{color: 'red'}}>Reset Progress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={buttonStyle} onPress={this.props.onExit}>
                          <Text>Back to Games</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={buttonStyle} onPress={this.popModal/*.bind(this)*/}>
                          <Text>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  } else if (modal.type === 'trigger') {
                    if (modal.instance.object_type === 'PLAQUE') {
                      return (
                        <PlaqueScreen
                          trigger={modal.trigger}
                          plaque={modal.plaque}
                          auth={this.props.auth}
                          events={this.props.events}
                          notes={this.props.notes}
                          getTriggerForNote={(note) => {
                            const insts = this.getObjectInstances('NOTE', note.note_id);
                            if (insts.length === 0) return;
                            const triggers = this.getTriggersForInstance(insts[0]);
                            return triggers[0];
                          }}
                          onSelectNote={this.selectNote}
                          eventPackages={this.props.event_packages}
                          items={this.props.items}
                          onClose={() => {
                            this.addLog({
                              event_type: 'VIEW_PLAQUE',
                              game_id: this.props.game.game_id,
                              content_id: modal.plaque.plaque_id,
                            });
                            /*
                            this.props.auth.call('client.logPlayerViewedContent', {
                              game_id: this.props.game.game_id,
                              content_type: 'PLAQUE',
                              content_id: modal.plaque.plaque_id,
                            });
                            */
                            this.popModal();
                          }}
                          onPickup={events => {
                            this.props.addXP(2);
                            this.setState(state => {
                              let inv = state.inventory;
                              events.forEach(event => {
                                inv = inv.map(inst => {
                                  if (parseInt(inst.object_id) === parseInt(event.content_id) && inst.object_type === 'ITEM') {
                                    if (event.event === 'GIVE_ITEM') {
                                      return update(inst, {qty: {$apply: n => parseInt(n) + parseInt(event.qty)}});
                                    } else {
                                      return inst; // TODO other event types
                                    }
                                  } else {
                                    return inst;
                                  }
                                });
                              });
                              return update(state, {inventory: {$set: inv}});
                            }, () => this.saveInventory());
                          }}
                        />
                      );
                    } else if (modal.instance.object_type === 'ITEM') {
                      return (
                        <ItemScreen
                          type="trigger"
                          trigger={modal.trigger}
                          instance={modal.instance}
                          item={modal.item}
                          auth={this.props.auth}
                          onClose={this.popModal/*.bind(this)*/}
                          onPickUp={(trigger) => {
                            this.props.addXP(2);
                            this.setState(state => {
                              return update(state, {
                                pickedUpRemnants: {
                                  $apply: rems => {
                                    if (rems.indexOf(modal.instance.object_id) === -1) {
                                      return update(rems, {$push: [modal.instance.object_id]});
                                    } else {
                                      return rems;
                                    }
                                  },
                                },
                                factoryObjects: {
                                  $apply: objs => objs.filter(obj =>
                                    parseInt(obj.trigger.trigger_id) != parseInt(modal.trigger.trigger_id)
                                  ),
                                },
                              });
                            }, () => this.saveInventory());
                          }}
                        />
                      );
                    }
                  }
                })()
              }
              {this.state.searchOpen ? this.renderSearch() : void 0}
              {(!(this.props.online) || this.props.queueMessage) &&
                !(this.state.viewingNote) &&
                !(this.state.createNote) &&
                !(this.state.searchOpen) && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <View
                    style={{
                      backgroundColor: 'black',
                      padding: 4,
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    {
                      this.props.online ? (
                        <View style={{margin: 5}}>
                          <ProgressCircle
                            percent={this.props.queueMessage ? this.props.queueMessage.percent : 0}
                            radius={15}
                            borderWidth={3}
                            color="white"
                            shadowColor="black"
                            bgColor="black"
                            containerStyle={{
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Image
                              style={{
                                resizeMode: "contain",
                                width: 28 / 2,
                                height: 28 / 2,
                              }}
                              source={require("../web/assets/img/arrow-up.png")}
                            />
                          </ProgressCircle>
                        </View>
                      ) : (
                        <Image
                          style={{
                            resizeMode: "contain",
                            width: 112 / 4,
                            height: 82 / 4,
                            margin: 5,
                          }}
                          source={require("../web/assets/img/no-internet.png")}
                        />
                      )
                    }
                    { this.props.queueMessage && (
                      <Text style={{color: 'white', margin: 5, marginLeft: 0}}>
                        Syncing {this.props.queueMessage.notes}
                      </Text>
                    ) }
                  </View>
                </View>
              )}
            </View>
          </SiftrInfo>
        }
      </KeyboardAwareView>
    );
  },
  // @endif

  // @ifdef WEB
  render: function() {
    var classes, isFollowing, on_off, ref2;
    classes = [
      "siftr-view",
      this.state.searchOpen ? "search-open" : "search-closed",
      `main-view-${this.state.createNote != null ? "map" : this.state.mainView}`
    ];
    isFollowing =
      (ref2 = this.props.followed) != null
        ? ref2.some(game => {
            return game.game_id === this.props.game.game_id;
          })
        : void 0;
    on_off = function(b) {
      if (b) {
        return "on";
      } else {
        return "off";
      }
    };
    return (
      <div className={classes.join(" ")}>
        {
          <div className="siftr-view-nav">
            {
              <div className="siftr-view-nav-section">
                {
                  <div className="siftr-view-nav-vertical">
                    <h2>{this.props.game.name}</h2>
                    {
                      <p className="siftr-view-nav-follow">
                        {this.props.auth.authToken != null ? (
                          <a
                            class="button light_gray"
                            href="#"
                            onClick={clicker(() => {
                              if (isFollowing) {
                                this.props.unfollowGame(this.props.game);
                              } else {
                                this.props.followGame(this.props.game);
                              }
                            })}
                          >
                            {isFollowing ? "Following" : "Follow this Siftr"}
                          </a>
                        ) : (
                          void 0
                        )}
                        {
                          <a
                            href="#"
                            className="button light_gray siftr-instructicon"
                            onClick={e => {
                              e.preventDefault();
                              this.setState({
                                instructions: !this.state.instructions
                              });
                            }}
                          >
                            instructions
                            <img src="assets/img/icon-4dots.png" />
                            {
                              <div
                                className={`siftr-instructions ${
                                  this.state.instructions
                                    ? "siftr-instructions-show"
                                    : void 0
                                }`}
                                dangerouslySetInnerHTML={{
                                  __html: markdown
                                    .toHTML(this.props.game.description)
                                    .replace(/<a /g, '<a target="_blank" ')
                                }}
                                onClick={e => {
                                  if (e.target.tagName.toLowerCase() === "a") {
                                    return e.stopPropagation(); // so the preventDefault() doesn't happen
                                  }
                                }}
                              />
                            }
                          </a>
                        }
                      </p>
                    }
                  </div>
                }
              </div>
            }
            <div className="siftr-view-nav-section">
              {
                this.hasCards() && (
                  <a
                    href="#"
                    className={`main-view-option option-${on_off(
                      this.state.mainView === "hybrid" &&
                        this.state.createNote == null
                    )}`}
                    onClick={clicker(() => {
                      this.setState({
                        mainView: "hybrid"
                      });
                    })}
                  >
                    <img src={"assets/img/main-view-hybrid-on.png"} />
                  </a>
                )
              }
              <a
                href="#"
                className={`main-view-option option-${on_off(
                  this.state.mainView === "map" && this.state.createNote == null
                )}`}
                onClick={clicker(() => {
                  this.setState({
                    mainView: "map"
                  });
                })}
              >
                <img src={"assets/img/main-view-map-on.png"} />
              </a>
              {
                this.hasCards() && (
                  <a
                    href="#"
                    className={`main-view-option option-${on_off(
                      this.state.mainView === "thumbs" &&
                        this.state.createNote == null
                    )}`}
                    onClick={clicker(() => {
                      this.setState({
                        mainView: "thumbs"
                      });
                    })}
                  >
                    <img src={"assets/img/main-view-thumbs-on.png"} />
                  </a>
                )
              }
              <span className="main-view-option-separator" />
              <a
                href="#"
                className="main-view-option"
                onClick={clicker(() => {
                  this.setState({
                    searchOpen: !this.state.searchOpen
                  });
                })}
              >
                <img
                  src={`assets/img/${
                    this.state.searchOpen ? "icon-x-black" : "icon-filter"
                  }.png`}
                />
              </a>
            </div>
          </div>
        }
        <div className="siftr-view-content">
          {this.renderMap()}
          {this.renderThumbnails()}
          {this.renderNoteView()}
          <div className="create-step-box">{this.renderCreateNote()}</div>
          {this.renderSearch()}
          <a
            className={
              this.state.createNote != null
                ? "start-create-plus cancel-button"
                : "start-create-plus"
            }
            href="#"
            onClick={clicker(() => {
              if (this.state.createNote != null) {
                this.setState({
                  createNote: null
                });
              } else {
                this.startCreate();
              }
            })}
          >
            <img src="assets/img/mobile-plus.png" />
          </a>
        </div>
      </div>
    );
  }
  // @endif
});
