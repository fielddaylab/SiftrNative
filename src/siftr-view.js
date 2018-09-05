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
  Platform
} from "react-native";
const RNFS = require("react-native-fs");
import { styles, Text } from "./styles";
import { StatusSpace } from "./status-space";
import { KeyboardAwareView } from "react-native-keyboard-aware-view";
import SideMenu from "react-native-side-menu";
import Markdown from "react-native-simple-markdown";
import firebase from "react-native-firebase";
import { NativeSettings } from "./native-settings";
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
  Colors,
  Field,
  Theme,
  deserializeNote
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

// @ifdef NATIVE
export const SiftrInfo = createClass({
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
      <SideMenu
        menu={
          <View
            style={{
              flex: 1
            }}
          >
            <View
              style={{
                backgroundColor: "rgb(249,249,249)"
              }}
            >
              <StatusSpace leaveBar={true} backgroundColor="rgba(0,0,0,0)" />
              <Text
                style={{
                  margin: 10,
                  textAlign: "center"
                }}
              >
                {(ref1 = this.props.game) != null ? ref1.name : void 0}
              </Text>
              <View
                style={{
                  alignItems: "center"
                }}
              >
                <TouchableOpacity
                  onPress={
                    isFollowing
                      ? this.props.unfollowGame
                      : this.props.followGame
                  }
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 4,
                    borderColor: "black",
                    borderRadius: 20,
                    borderWidth: 2,
                    marginBottom: 10
                  }}
                >
                  <Text>
                    {isFollowing == null
                      ? "..."
                      : isFollowing
                        ? "Followed"
                        : "Follow this Siftr"}
                  </Text>
                </TouchableOpacity>
              </View>
              {this.props.viola ? (
                <View
                  style={{
                    alignItems: "center"
                  }}
                >
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
              ) : (
                void 0
              )}
            </View>
            <ScrollView
              style={{
                flex: 1
              }}
              contentContainerStyle={{
                backgroundColor: "white"
              }}
            >
              <Text
                style={{
                  margin: 10,
                  fontWeight: "bold"
                }}
              >
                Instructions:
              </Text>
              <View
                style={{
                  margin: 10
                }}
              >
                <Markdown>
                  {(ref2 = this.props.game) != null ? ref2.description : void 0}
                </Markdown>
              </View>
              {((ref3 = this.props.tags) != null ? (
                ref3.length
              ) : (
                void 0
              )) ? (
                <Text
                  style={{
                    margin: 10,
                    fontWeight: "bold"
                  }}
                >
                  Tags:
                </Text>
              ) : (
                void 0
              )}
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
                        alignItems: "center"
                      }}
                    >
                      <Text
                        style={{
                          margin: 10,
                          color: "rgb(182,182,182)"
                        }}
                      >
                        {tag.tag}
                      </Text>
                      <View
                        style={{
                          margin: 10,
                          backgroundColor: this.props.getColor(tag),
                          padding: 3,
                          borderRadius: 999
                        }}
                      >
                        <Text
                          style={{
                            color: "white"
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
              {false ? (
                <Text
                  style={{
                    margin: 10,
                    fontWeight: "bold"
                  }}
                >
                  Integrations:
                </Text>
              ) : (
                void 0
              )}
            </ScrollView>
          </View>
        }
        menuPosition="right"
        isOpen={this.props.isOpen}
        onChange={this.props.onChange}
        disableGestures={!this.props.isOpen}
      >
        {this.props.children}
      </SideMenu>
    );
  }
});
// @endif

export var SiftrView = createClass({
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
      tags: null,
      colors: null,
      theme: null,
      viewingNote: null,
      createNote: null,
      searchParams: {
        sort: "recent"
      },
      searchOpen: false,
      mainView: "hybrid", // 'hybrid', 'map', 'thumbs'
      fields: null,
      infoOpen: false,
      primaryMenuOpen: false
    };
  },
  componentWillMount: function() {
    var hash, n, ref, ref1, siftrDir;
    this.isMounted = true;
    // @ifdef NATIVE
    firebase.analytics().logEvent("view_siftr", {
      game_id: this.props.game.game_id
    });
    siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${
      this.props.game.game_id
    }`;
    RNFS.mkdir(siftrDir, {
      NSURLIsExcludedFromBackupKey: true
    });
    RNFS.writeFile(`${siftrDir}/game.txt`, JSON.stringify(this.props.game));
    if (this.props.online) {
      this.props.auth.getTagsForGame(
        {
          game_id: this.props.game.game_id
        },
        withSuccess(tags => {
          if (!this.isMounted) {
            return;
          }
          this.setState({ tags });
          return RNFS.writeFile(`${siftrDir}/tags.txt`, JSON.stringify(tags));
        })
      );
      this.props.auth.getColors(
        {
          colors_id: (ref = this.props.game.colors_id) != null ? ref : 1
        },
        withSuccess(colors => {
          if (!this.isMounted) {
            return;
          }
          this.setState({ colors });
          return RNFS.writeFile(
            `${siftrDir}/colors.txt`,
            JSON.stringify(colors)
          );
        })
      );
      this.props.auth.getTheme(
        {
          theme_id: (ref = this.props.game.theme_id) != null ? ref : 1
        },
        withSuccess(theme => {
          if (!this.isMounted) {
            return;
          }
          this.setState({ theme });
          return RNFS.writeFile(
            `${siftrDir}/theme.txt`,
            JSON.stringify(theme)
          );
        })
      );
      this.props.auth.getFieldsForGame(
        {
          game_id: this.props.game.game_id
        },
        withSuccess(fields => {
          if (!this.isMounted) {
            return;
          }
          this.setState({ fields });
          return RNFS.writeFile(
            `${siftrDir}/fields.txt`,
            JSON.stringify(fields)
          );
        })
      );
      this.props.auth.searchNotes(
        {
          game_id: this.props.game.game_id,
          order_by: "recent"
        },
        withSuccess(notes => {
          if (!this.isMounted) {
            return;
          }
          this.setState({
            allNotes: notes
          });
          return RNFS.writeFile(`${siftrDir}/notes.txt`, JSON.stringify(notes));
        })
      );
    } else {
      RNFS.readFile(`${siftrDir}/tags.txt`).then(tags => {
        var tag;
        if (!this.isMounted) {
          return;
        }
        this.setState({
          tags: (function() {
            var i, len, ref1, results;
            ref1 = JSON.parse(tags);
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              tag = ref1[i];
              results.push(Object.assign(new Tag(), tag));
            }
            return results;
          })()
        });
      });
      RNFS.readFile(`${siftrDir}/colors.txt`).then(colors => {
        if (!this.isMounted) {
          return;
        }
        this.setState({
          colors: Object.assign(new Colors(), JSON.parse(colors))
        });
      });
      RNFS.readFile(`${siftrDir}/theme.txt`).then(theme => {
        if (!this.isMounted) {
          return;
        }
        this.setState({
          theme: Object.assign(new Theme(), JSON.parse(theme))
        });
      });
      RNFS.readFile(`${siftrDir}/fields.txt`).then(fields => {
        var field;
        if (!this.isMounted) {
          return;
        }
        this.setState({
          fields: (function() {
            var i, len, ref1, results;
            ref1 = JSON.parse(fields);
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              field = ref1[i];
              results.push(Object.assign(new Field(), field));
            }
            return results;
          })()
        });
      });
      RNFS.readFile(`${siftrDir}/notes.txt`).then(notes => {
        var note;
        if (!this.isMounted) {
          return;
        }
        this.setState(
          {
            allNotes: (function() {
              var i, len, ref1, results;
              ref1 = JSON.parse(notes);
              results = [];
              for (i = 0, len = ref1.length; i < len; i++) {
                note = ref1[i];
                results.push(deserializeNote(note));
              }
              return results;
            })()
          },
          () => {
            this.loadResults();
          }
        );
      });
    }
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
    this.props.auth.getTagsForGame(
      {
        game_id: this.props.game.game_id
      },
      withSuccess(tags => {
        if (this.isMounted) {
          this.setState({ tags });
        }
      })
    );
    this.props.auth.getColors(
      {
        colors_id: (ref1 = this.props.game.colors_id) != null ? ref1 : 1
      },
      withSuccess(colors => {
        if (this.isMounted) {
          this.setState({ colors });
        }
      })
    );
    this.props.auth.getTheme(
      {
        theme_id: (ref1 = this.props.game.theme_id) != null ? ref1 : 1
      },
      withSuccess(theme => {
        if (this.isMounted) {
          this.setState({ theme });
        }
      })
    );
    this.props.auth.getFieldsForGame(
      {
        game_id: this.props.game.game_id
      },
      withSuccess(fields => {
        if (this.isMounted) {
          this.setState({ fields });
        }
      })
    );
    this.handleHistory = event => {
      if (typeof event.state === "number") {
        this.loadNoteByID(event.state, true);
      } else {
        this.setState({
          viewingNote: null
        });
      }
    };
    window.addEventListener("popstate", this.handleHistory);
    hash = window.location.hash;
    if (hash[0] === "#") {
      n = parseInt(hash.slice(1));
      if (n) {
        this.loadNoteByID(n, true);
      }
    }
    this.props.auth.searchNotes(
      {
        game_id: this.props.game.game_id,
        order_by: "recent"
      },
      withSuccess(notes => {
        if (!this.isMounted) {
          return;
        }
        this.setState({
          allNotes: notes
        });
      })
    );
    // @endif
    if (this.props.nomenData != null) {
      this.applyNomenData({
        nomenData: this.props.nomenData,
        saved_note: this.props.saved_note
      });
    }
  },
  componentDidMount: function() {
    return (this.nomenTimer = setInterval(() => {
      this.checkNomenFieldData();
    }, 1000));
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
      this.props.auth.searchNotes(
        {
          game_id: this.props.game.game_id,
          order_by: "recent"
        },
        withSuccess(notes => {
          if (!this.isMounted) {
            return;
          }
          this.setState({
            allNotes: notes
          });
        })
      );
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
            ref = this.state.fields;
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
    var ref, ref1, tag;
    if (!(this.state.tags != null && this.state.colors != null && x != null)) {
      return "white";
    }
    if (x instanceof Tag) {
      tag = x;
    } else if (x.tag_id != null) {
      tag = function() {
        var i, len, ref, results;
        ref = this.state.tags;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          tag = ref[i];
          if (tag.tag_id === parseInt(x.tag_id)) {
            results.push(tag);
          }
        }
        return results;
      }.call(this)[0];
    } else if ((ref = typeof x) === "number" || ref === "string") {
      tag = function() {
        var i, len, ref1, results;
        ref1 = this.state.tags;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          tag = ref1[i];
          if (tag.tag_id === parseInt(x)) {
            results.push(tag);
          }
        }
        return results;
      }.call(this)[0];
    } else {
      return "white";
    }
    if (tag.color) {
      return tag.color;
    }
    return (ref1 = this.state.colors[
      `tag_${(this.state.tags.indexOf(tag) % 8) + 1}`
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
              tags = {};
              for (j = 0, len1 = cluster.length; j < len1; j++) {
                note = cluster[j];
                if (tags[(name1 = note.tag_id)] == null) {
                  tags[name1] = 0;
                }
                tags[note.tag_id] += 1;
              }
              results.push({
                min_latitude: Math.min.apply(Math, lats),
                max_latitude: Math.max.apply(Math, lats),
                min_longitude: Math.min.apply(Math, lons),
                max_longitude: Math.max.apply(Math, lons),
                note_count: cluster.length,
                tags: tags,
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
            createNote: null
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
        createNote: null
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
        createNote: null
      });
    } else if (this.isMounted) {
      this.setState({
        viewingNote: note,
        searchOpen: false,
        createNote: null
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
    var ref;
    return (
      <SearchNotes
        auth={this.props.auth}
        game={this.props.game}
        tags={(ref = this.state.tags) != null ? ref : []}
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
          fields={this.state.fields}
          tag={(() => {
            var i, len, ref, ref1, tag;
            ref1 = (ref = this.state.tags) != null ? ref : [];
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
  renderMap: function() {
    var ref;
    return (
      <SiftrMap
        map_notes={(() => {
          var pin;
          // @ifdef WEB
          if (this.state.createNote != null && this.state.createStep === 5) {
            pin = new Note();
            pin.note_id = 0;
            pin.latitude = this.state.createNote.location.lat;
            pin.longitude = this.state.createNote.location.lng;
            pin.description = this.state.createNote.caption;
            pin.tag_id = this.state.createNote.category.tag_id;
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
            pin.tag_id = this.state.createNote.category.tag_id;
            return [pin];
          } else {
            return this.state.map_notes;
          }
          // @endif
        })()}
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
        colors={this.state.colors}
        theme={this.state.theme}
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
        thumbHover={
          (ref = this.state.thumbHover) != null ? ref.note_id : void 0
        }
        tags={this.state.tags}
        game={this.props.game}
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
        notes={this.state[notesKey]}
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
  startLocatingNote: function({ exif }) {
    var center, goToCenter, lat, lng, readGPS, readRat;
    if (!this.isMounted) {
      return;
    }
    goToCenter = center => {
      var ref;
      this.setState({ center });
      // @ifdef NATIVE
      if ((ref = this.refs.theSiftrMap) != null) {
        ref.moveToPoint(center);
      }
      // @endif
    };
    // first use existing center
    if ((center = this.state.createNote.location) != null) {
      goToCenter(center);
      return;
    }
    // then get location from exif. first, complicated form from exif.js
    lat = exif != null ? exif.GPSLatitude : void 0;
    lng = exif != null ? exif.GPSLongitude : void 0;
    if (lat != null && lng != null) {
      readRat = function(rat) {
        return rat.numerator / rat.denominator;
      };
      readGPS = function([deg, min, sec]) {
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
      goToCenter({ lat, lng });
      return;
    }
    // simple form returned by RN CameraRoll
    lat = exif != null ? exif.latitude : void 0;
    lng = exif != null ? exif.longitude : void 0;
    if (lat != null && lng != null) {
      goToCenter({ lat, lng });
      return;
    }
    // then, use game's location, but try to override from browser
    this.setState(
      {
        center: {
          lat: this.props.game.latitude,
          lng: this.props.game.longitude
        }
      },
      () => {
        var ref;
        return (ref = navigator.geolocation) != null
          ? ref.getCurrentPosition(posn => {
              if (!this.isMounted) {
                return;
              }
              return goToCenter({
                lat: posn.coords.latitude,
                lng: posn.coords.longitude
              });
            }, (err) => {
              // ignore error
            })
          : void 0;
      }
    );
  },
  startCreate: function({ nomenData, saved_note } = {}) {
    var loc, note, obj;
    if (this.state.createNote != null) {
      return;
    }
    if (this.props.auth.authToken != null || !this.props.online) {
      obj = {
        createNote: {},
        createStep: 1,
        searchOpen: false,
        viewingNote: null,
        primaryMenuOpen: false,
        nomenData: nomenData
      };
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
            ref = this.state.tags;
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
        createStep: 2,
        searchOpen: false,
        viewingNote: null,
        primaryMenuOpen: false
      };
      this.setState(obj);
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
                    field_id: null,
                    file: file
                  }
                ],
                caption: "",
                category: this.state.tags[0],
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
          onUpdateNote={createNote => {
            this.setState({ createNote });
          }}
          onStartLocation={() => {
            this.startLocatingNote({
              exif: this.state.createNote.exif
            });
          }}
          getLocation={() => {
            return this.state.center;
          }}
          categories={(ref = this.state.tags) != null ? ref : []}
          fields={(ref1 = this.state.fields) != null ? ref1 : []}
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
            this.setState({
              createNote: {
                uploading: true,
                caption: ""
              },
              createStep: 2
            });
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
            this.setState({
              createNote: {
                media: media,
                exif: exif,
                caption:
                  (ref2 = this.state.createNote) != null
                    ? ref2.caption
                    : void 0,
                location:
                  (ref3 = this.state.createNote) != null
                    ? ref3.location
                    : void 0,
                category:
                  (ref4 = this.state.createNote) != null
                    ? ref4.category
                    : void 0,
                field_media: fieldMedia,
                field_data:
                  (ref5 = this.state.createNote) != null
                    ? ref5.field_data
                    : void 0
              }
            });
          }}
          fields={(ref2 = this.state.fields) != null ? ref2 : []}
        />
      );
    } else if (this.state.createStep === 2) {
      return (
        <CreateStep2
          game={this.props.game}
          categories={(ref3 = this.state.tags) != null ? ref3 : []}
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
            this.state.createNote.media != null ||
            this.state.createNote.note_id != null
              ? null
              : this.state.progress
          }
        />
      );
    } else if (this.state.createStep === 3) {
      return (
        <CreateStep3
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
              createStep: 2
            });
          }}
          progress={
            this.state.createNote.media != null ||
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
          fields={this.state.fields}
          field_data={this.state.createNote.field_data}
          progress={
            this.state.createNote.media != null ||
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
    field_data = (ref =
      (ref1 = this.state.createNote) != null ? ref1.field_data : void 0) != null
      ? ref
      : []
  ) {
    var caption,
      category,
      createArgs,
      f,
      field_media,
      files,
      filesToCopy,
      getLocation,
      i,
      len,
      location,
      media,
      name,
      note_id,
      queueDir,
      updateArgs;
    getLocation = () => {
      // @ifdef WEB
      return this.state.createNote.location;
      // @endif
      // @ifdef NATIVE
      return this.state.center;
      // @endif
    };
    if (this.state.createNote.note_id != null) {
      // editing an existing note
      ({ note_id, caption, category } = this.state.createNote);
      location = getLocation();
      updateArgs = {
        note_id: note_id,
        game_id: this.props.game.game_id,
        description: caption,
        trigger: {
          latitude: location.lat,
          longitude: fixLongitude(location.lng)
        },
        tag_id: category.tag_id,
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
      location = getLocation();
      if (field_media == null) {
        field_media = [];
      }
      createArgs = {
        game_id: this.props.game.game_id,
        description: caption,
        trigger: {
          latitude: location.lat,
          longitude: fixLongitude(location.lng)
        },
        tag_id: category.tag_id,
        field_data: field_data.concat(field_media)
      };
      if (media != null) {
        // we've already uploaded media, now create note
        createArgs.media_id = media.media_id;
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
        // save note for later upload queue
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
      }
    }
  },
  // @ifdef NATIVE
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
            tags={this.state.tags}
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
          >
            <StatusSpace
              queueMessage={this.props.queueMessage}
            />
            {
              <Blackout isFocused={false} keyboardUp={this.state.keyboardUp}>
                {
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
                        style={{
                          flex: 1,
                          alignItems: "flex-start"
                        }}
                        onPress={
                          this.state.viewingNote != null
                            ? () => {
                                this.closeNote();
                              }
                            : this.state.createNote != null
                              ? null
                              : this.state.searchOpen
                                ? () => {
                                    // no back button
                                    this.setState({
                                      searchOpen: false
                                    });
                                  }
                                : this.props.onExit
                        }
                      >
                        <Image
                          style={{
                            margin: 10,
                            resizeMode: "contain",
                            height: 18,
                            opacity:
                              Platform.OS === "ios" &&
                              this.props.aris &&
                              this.state.viewingNote == null &&
                              !this.state.searchOpen
                                ? 0
                                : this.state.createNote != null
                                  ? 0
                                  : 1
                          }}
                          source={require("../web/assets/img/icon-back.png")}
                        />
                      </TouchableOpacity>
                    }
                    <View
                      style={{
                        flex: 4,
                        alignItems: "center"
                      }}
                    >
                      <Text>
                        {this.state.viewingNote != null
                          ? this.state.viewingNote.user.display_name
                          : this.state.createNote != null
                            ? `Posting to: ${this.props.game.name}`
                            : this.props.game.name}
                      </Text>
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
                          style={{
                            flex: 1,
                            alignItems: "flex-end"
                          }}
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
                            flex: 1,
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
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          alignItems: "flex-end"
                        }}
                        onPress={() => {
                          this.setState({
                            infoOpen: !this.state.infoOpen
                          });
                        }}
                      >
                        <Image
                          style={{
                            resizeMode: "contain",
                            height: 20,
                            margin: 10
                          }}
                          source={require("../web/assets/img/icon-4dots.png")}
                        />
                      </TouchableOpacity>
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
              {this.state.createNote != null &&
              !(
                this.state.createNote.media != null ||
                this.state.createNote.files != null ||
                this.state.createNote.uploading
              )
                ? this.renderMap()
                : this.state.mainView === "thumbs"
                  ? [this.renderMap(), this.renderThumbnails()]
                  : [this.renderThumbnails(), this.renderMap()]}
              {this.renderNoteView()}
              {this.renderCreateNote()}
              {this.state.searchOpen ? this.renderSearch() : void 0}
            </View>
            {(!(this.props.online) || this.props.queueMessage) &&
              !(this.state.viewingNote) &&
              !(this.state.createNote) &&
              this.state.mainView !== 'thumbs' &&
              !(this.state.searchOpen) && (
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 80,
                  backgroundColor: 'black',
                  padding: 4,
                  alignItems: 'center',
                  flexDirection: 'row',
                }}
              >
                {
                  this.props.online ? (
                    <Image
                      style={{
                        resizeMode: "contain",
                        width: 28 / 2,
                        height: 28 / 2,
                        margin: 5,
                      }}
                      source={require("../web/assets/img/arrow-up.png")}
                    />
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
                <Text style={{color: 'white', margin: 5, marginLeft: 0}}>
                  Syncing {this.props.queueMessage.notes}
                </Text>
              </View>
            )}
            {!(
              this.state.createNote != null || this.state.viewingNote != null
            ) ? (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "white"
                }}
              >
                <TouchableOpacity
                  style={{
                    padding: 10
                  }}
                  onPress={() => {
                    this.setState({
                      mainView:
                        this.state.mainView === "thumbs" ? "map" : "thumbs"
                    });
                  }}
                >
                  <Image
                    style={{
                      resizeMode: "contain",
                      height: 30
                    }}
                    source={
                      this.state.mainView === "thumbs"
                        ? require("../web/assets/img/icon-map.png")
                        : require("../web/assets/img/icon-grid.png")
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: 10
                  }}
                  onPress={this.startCreate}
                >
                  <Image
                    style={{
                      resizeMode: "contain",
                      height: 30
                    }}
                    source={require("../web/assets/img/icon-add.png")}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: 10
                  }}
                  onPress={() => {
                    this.setState({
                      searchOpen: !this.state.searchOpen
                    });
                  }}
                >
                  <Image
                    style={{
                      resizeMode: "contain",
                      height: 30
                    }}
                    source={require("../web/assets/img/icon-filter.png")}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              void 0
            )}
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
