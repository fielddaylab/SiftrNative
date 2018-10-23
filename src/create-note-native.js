"use strict";

import React from "react";
import T from "prop-types";
import update from "immutability-helper";
import { Map, Set } from "immutable";
import createClass from "create-react-class";
import {
  Image,
  View,
  TextInput,
  Picker,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Switch,
  Linking,
  BackHandler,
  CameraRoll,
  ListView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Animated,
} from "react-native";
import { styles, Text } from "./styles";
import Camera from "react-native-camera";
import InfiniteScrollView from "react-native-infinite-scroll-view";
import firebase from "react-native-firebase";
import Geocoder from "react-native-geocoder";
import Permissions from "react-native-permissions";
import { Auth, Game, Tag, Field, FieldData } from "./aris";
import { requestImage } from "./photos";

// Not used currently
const SiftrRoll = class SiftrRoll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      canLoadMore: true,
      dataSource: new ListView.DataSource({
        rowHasChanged: (r1, r2) => {
          return r1[0] !== r2[0];
        }
      })
    };
  }

  componentWillMount() {
    this.getMorePhotos();
  }

  getMorePhotos() {
    var thisGet;
    thisGet = this.lastGet = Date.now();
    CameraRoll.getPhotos({
      first: 20,
      after: this.state.photoCursor,
      assetType: "Photos"
    }).then(result => {
      if (thisGet !== this.lastGet) {
        return;
      }
      if (result.edges.length > 0) {
        this.setState({
          photos: this.state.photos.concat(
            result.edges.map(({ node }) => [node.image.uri, node.location])
          ),
          photoCursor: result.page_info.end_cursor,
          canLoadMore: result.page_info.has_next_page
        });
      } else {
        this.setState({
          canLoadMore: false
        });
      }
    });
  }

  render() {
    return (
      <ListView
        style={{
          flex: 1
        }}
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center"
        }}
        enableEmptySections={true}
        renderScrollComponent={props => {
          return <InfiniteScrollView {...props} />;
        }}
        dataSource={this.state.dataSource.cloneWithRows(this.state.photos)}
        renderRow={([uri, location]) => {
          return (
            <TouchableOpacity
              onPress={() => {
                this.props.onSelectImage(uri, location);
              }}
            >
              <Image
                source={{
                  uri: uri
                }}
                style={{
                  width: 160,
                  height: 160,
                  margin: 5
                }}
              />
            </TouchableOpacity>
          );
        }}
        canLoadMore={this.state.canLoadMore}
        onLoadMoreAsync={() => {
          this.getMorePhotos();
        }}
      />
    );
  }
};

SiftrRoll.defaultProps = {
  onSelectImage: function() {}
};

// photo taker on native: takes a single photo at a time
export const CreatePhoto = createClass({
  displayName: "CreatePhoto",
  propTypes: {
    onCancel: T.func,
    onSelectImage: T.func,
    instruction: T.string
  },
  getDefaultProps: function() {
    return {
      onCancel: function() {},
      onSelectImage: function() {},
      instruction: null
    };
  },
  getInitialState: function() {
    return {
      source: "camera",
      camera: "back",
      flash: false,
      shutter: null,
    };
  },
  componentWillMount: function() {
    this.hardwareBack = () => {
      this.props.onCancel();
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", this.hardwareBack);
    Permissions.request("camera"); // take photos
    Permissions.request("photo"); // access photos
  },
  componentWillUnmount: function() {
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
  },
  render: function() {
    return (
      <View style={styles.overlayWhole}>
        <View
          style={{
            backgroundColor: "white",
            padding: 3
          }}
        >
          <Text
            style={{
              color: "#979797",
              textAlign: "center"
            }}
          >
            {this.props.instruction != null
              ? `Add image of: ${this.props.instruction}`.toUpperCase()
              : "Main image".toUpperCase()}
          </Text>
        </View>
        {function() {
          switch (this.state.source) {
            case "camera":
              return (
                <View
                  style={{
                    flex: 1
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "black"
                    }}
                  >
                    <Camera
                      ref={cam => {
                        this.camera = cam;
                      }}
                      style={{
                        flex: 1
                      }}
                      type={this.state.camera}
                      flashMode={
                        this.state.flash
                          ? Camera.constants.FlashMode.on
                          : Camera.constants.FlashMode.off
                      }
                    />
                    {
                      this.state.shutter && (
                        <Animated.View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'white',
                            opacity: this.state.shutter,
                          }}
                        />
                      )
                    }
                    <TouchableOpacity
                      onPress={() => {
                        this.setState({
                          flash: !this.state.flash
                        });
                      }}
                      style={{
                        position: 'absolute',
                        bottom: 25,
                        left: 25,
                      }}
                    >
                      <Image
                        source={require("../web/assets/img/icon-flash.png")}
                        style={{
                          width: 32,
                          height: 32,
                        }}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        this.setState({
                          camera:
                            this.state.camera === "front" ? "back" : "front"
                        });
                      }}
                      style={{
                        position: 'absolute',
                        bottom: 25,
                        right: 25,
                      }}
                    >
                      <Image
                        source={require("../web/assets/img/icon-switch-camera.png")}
                        style={{
                          width: 32,
                          height: 32,
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                      alignItems: "center"
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        requestImage(true, img => {
                          if (img != null) {
                            this.props.onSelectImage(img);
                          }
                        });
                      }}
                    >
                      <Image
                        style={{
                          width: 52 * 0.7,
                          height: 52 * 0.7
                        }}
                        source={require("../web/assets/img/icon-from-roll.png")}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        var cameraError, field_id;
                        if (this.camera == null) {
                          return;
                        }
                        field_id = this.state.field_id;
                        cameraError = () => {
                          Alert.alert(
                            "Couldn't capture photo",
                            "Please check that Siftr has access to the camera and photo roll in system privacy settings."
                          );
                        };
                        Permissions.checkMultiple(["camera", "photo"]).then(
                          response => {
                            if (
                              response.camera === "authorized" &&
                              response.photo === "authorized"
                            ) {
                              const shutter = new Animated.Value(1);
                              this.setState({shutter}, () => {
                                Animated.timing(shutter, {toValue: 0, duration: 500}).start();
                              });
                              this.camera
                                .capture({})
                                .then(({ path }) => {
                                  this.props.onSelectImage({
                                    uri: path,
                                    isStatic: true,
                                    type: "image/jpeg",
                                    name: "upload.jpg"
                                  });
                                })
                                .catch(cameraError);
                            } else {
                              cameraError();
                            }
                          }
                        );
                      }}
                    >
                      <Image
                        source={require("../web/assets/img/icon-take-picture.png")}
                        style={{
                          width: 50,
                          height: 50,
                          margin: 10
                        }}
                      />
                    </TouchableOpacity>
                    <View
                      style={{
                        width: 52 * 0.7,
                        height: 52 * 0.7
                      }}
                    />
                  </View>
                </View>
              );
            case "roll":
              return (
                <View
                  style={{
                    flex: 1
                  }}
                >
                  {
                    <SiftrRoll
                      onSelectImage={(uri, location) => {
                        var img;
                        img = {
                          uri: uri,
                          isStatic: true,
                          // TODO do we need to support other types
                          type: "image/jpeg",
                          name: "upload.jpg"
                        };
                        this.props.onSelectImage(img, location);
                      }}
                    />
                  }
                </View>
              );
          }
        }.call(this)}
      </View>
    );
  }
});

export const Blackout = function() {
  class Blackout extends React.Component {
    render() {
      return (
        <View style={this.props.style}>
          {this.props.children}
          {this.props.keyboardUp && !this.props.isFocused ? (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  backgroundColor: "rgba(0,0,0,0.5)"
                }}
              />
            </TouchableWithoutFeedback>
          ) : (
            void 0
          )}
        </View>
      );
    }
  }

  Blackout.defaultProps = {
    isFocused: false,
    keyboardUp: false
  };

  return Blackout;
}.call(this);

const CreateDataPhotoButton = createClass({
  displayName: "CreateDataPhotoButton",
  render: function() {
    var f, file, i, len, ref, ref1;
    file = null;
    ref1 = (ref = this.props.files) != null ? ref : [];
    for (i = 0, len = ref1.length; i < len; i++) {
      f = ref1[i];
      if (f.field_id === this.props.field_id) {
        file = f.file;
        break;
      }
    }
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "white",
          padding: 3
        }}
      >
        <TouchableOpacity onPress={this.props.onPress}>
          <Image
            source={
              file != null
                ? file
                : require("../web/assets/img/icon-needs-pic.png")
            }
            style={styles.photoSlot}
          />
        </TouchableOpacity>
        {this.props.blurb != null ? (
          this.props.blurb
        ) : (
          <TouchableOpacity
            style={{
              flex: 1
            }}
            onPress={this.props.onPress}
          >
            <Text>{this.props.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
});

const CreateSingleSelect = createClass({
  displayName: "CreateSingleSelect",
  getInitialState: function() {
    return {
      menuOpen: false
    };
  },
  render: function() {
    return (
      <View>
        <TouchableOpacity
          onPress={() => {
            this.setState({
              menuOpen: !this.state.menuOpen
            });
          }}
          style={{
            padding: 13,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white"
          }}
        >
          <View
            style={{
              backgroundColor: this.props.getColor(this.props.current),
              height: 16,
              width: 16,
              borderRadius: 8,
              marginRight: 20
            }}
          />
          <Text
            style={{
              flex: 1
            }}
          >
            {this.props.getLabel(this.props.current)}
          </Text>
          <Image
            source={require("../web/assets/img/icon-expand.png")}
            style={{
              width: 32 * 0.7,
              height: 18 * 0.7,
              resizeMode: "contain"
            }}
          />
        </TouchableOpacity>
        {this.state.menuOpen ? (
          <View>
            {this.props.options.map(option => {
              return (
                <TouchableOpacity
                  key={this.props.getKey(option)}
                  onPress={() => {
                    this.setState({
                      menuOpen: false
                    });
                    this.props.onSelectOption(option);
                  }}
                  style={{
                    borderTopColor: "rgb(230,230,230)",
                    borderTopWidth: 1,
                    padding: 13,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "rgb(240,240,240)"
                  }}
                >
                  <View
                    style={{
                      backgroundColor: this.props.getColor(option),
                      height: 16,
                      width: 16,
                      borderRadius: 8,
                      marginRight: 20
                    }}
                  />
                  <Text
                    style={{
                      flex: 1
                    }}
                  >
                    {this.props.getLabel(option)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          void 0
        )}
      </View>
    );
  }
});

// Steps 2-5 (native app), all non-photo data together
export const CreateData = createClass({
  displayName: "CreateData",
  propTypes: {
    createNote: T.any.isRequired,
    onUpdateNote: T.func,
    onStartLocation: T.func,
    getLocation: T.func,
    categories: T.arrayOf(T.instanceOf(Tag)).isRequired,
    getColor: T.func,
    fields: T.arrayOf(T.instanceOf(Field)),
    game: T.instanceOf(Game).isRequired,
    // misc
    onFinish: T.func,
    onBack: T.func,
    onCancel: T.func
  },
  getDefaultProps: function() {
    return {
      onUpdateNote: function() {},
      onStartLocation: function() {},
      getLocation: function() {},
      getColor: function() {},
      fields: [],
      onFinish: function() {},
      onBack: function() {},
      onCancel: function() {}
    };
  },
  getInitialState: function() {
    return {
      isPickingLocation: false,
      isTakingPhoto: null,
      geocodeResult: null
    };
  },
  componentWillMount: function() {
    firebase.analytics().logEvent("entering_note_info", {});
    if (!this.props.resumedNote) {
      this.props.onStartLocation();
    }
    this.hardwareBack = () => {
      if (this.state.isPickingLocation) {
        this.setState({
          isPickingLocation: false
        });
      } else {
        this.props.onBack();
      }
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", this.hardwareBack);
    setTimeout(() => {
      Geocoder.geocodePosition(this.props.getLocation()).then(res => {
        this.setState({
          geocodeResult: res
        });
      });
    }, 1000);
  },
  componentWillUnmount: function() {
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
  },
  finishForm: function() {
    var field, field_data, files, i, len, ref, ref1, ref2, ref3;
    if (
      !(
        this.props.createNote.caption != null &&
        this.props.createNote.caption.match(/\S/)
      )
    ) {
      Alert.alert("Missing data", "Please enter a caption.");
      return;
    }
    field_data = (ref = this.props.createNote.field_data) != null ? ref : [];
    files = (ref1 = this.props.createNote.files) != null ? ref1 : [];
    ref2 = this.props.fields;
    for (i = 0, len = ref2.length; i < len; i++) {
      field = ref2[i];
      if (field.field_type === "SINGLESELECT") {
        if (field_data.some(data => data.field_id === field.field_id)) {
        } else {
          field_data.push(
            new FieldData({
              field_id: field.field_id,
              field_option_id: field.options[0].field_option_id
            })
          );
        }
      } else if (
        field.required &&
        ((ref3 = field.field_type) === "TEXT" || ref3 === "TEXTAREA")
      ) {
        if (!field_data.some(data => data.field_id === field.field_id)) {
          Alert.alert(
            "Missing data",
            `Please fill in the field: ${field.label}`
          );
          return;
        }
      } else if (field.required && field.field_type === "MEDIA") {
        if (!files.some(file => file.field_id === field.field_id)) {
          Alert.alert(
            "Missing photo",
            `Please supply a photo for: ${field.label}`
          );
          return;
        }
      }
    }
    if (this.props.progress != null) {
      return;
    }
    this.props.onFinish(field_data);
  },
  render: function() {
    var descBox, field, field_id, isEditing, ref, ref1, ref2;
    isEditing = ((ref = this.props.createNote.note_id) != null ? ref : 0) !== 0;
    if (this.state.isPickingLocation) {
      return (
        <View style={styles.overlayBottom}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => {
                Geocoder.geocodePosition(this.props.getLocation()).then(res => {
                  this.setState({
                    geocodeResult: res
                  });
                });
                this.setState({
                  isPickingLocation: false
                });
              }}
            >
              <Text style={styles.blueButton}>Pick Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (this.state.isTakingPhoto != null) {
      if (this.state.isTakingPhoto === "main") {
        field = null;
        field_id = null;
      } else {
        field = this.state.isTakingPhoto.label;
        field_id = this.state.isTakingPhoto.field_id;
      }
      return (
        <CreatePhoto
          onCancel={() => {
            this.setState({
              isTakingPhoto: null
            });
          }}
          onSelectImage={file => {
            var newFiles;
            newFiles = this.props.createNote.files.filter(file => {
              return file.field_id !== field_id;
            });
            newFiles.push({ file, field_id });
            this.props.onUpdateNote(
              update(this.props.createNote, {
                files: {
                  $set: newFiles
                }
              })
            );
            this.setState({
              isTakingPhoto: null
            });
          }}
          instruction={field}
        />
      );
    } else {
      return (
        <View
          style={{
            flex: 1
          }}
        >
          {
            <ScrollView
              style={{
                flex: 1,
                backgroundColor:
                  this.state.focusedBox != null
                    ? "rgb(127,127,127)"
                    : "rgb(249,249,249)"
              }}
              contentContainerStyle={{
                flexDirection: "column",
                alignItems: "stretch"
              }}
            >
              {
                <View
                  style={{
                    flexDirection: "column",
                    alignItems: "stretch"
                  }}
                >
                  <Blackout
                    keyboardUp={this.state.focusedBox != null}
                    isFocused={this.state.focusedBox === "caption"}
                  >
                    {
                      ((descBox = (
                        <TextInput
                          placeholder={this.props.game.prompt || "Enter a caption…"}
                          value={this.props.createNote.caption}
                          onChangeText={text => {
                            this.props.onUpdateNote(
                              update(this.props.createNote, {
                                caption: {
                                  $set: text
                                }
                              })
                            );
                          }}
                          onFocus={() => {
                            this.setState({
                              focusedBox: "caption"
                            });
                          }}
                          onEndEditing={() => {
                            if (this.state.focusedBox === "caption") {
                              this.setState({
                                focusedBox: null
                              });
                            }
                          }}
                          multiline={true}
                          style={{
                            height: 100,
                            padding: 10,
                            fontSize: 16,
                            backgroundColor: "white",
                            flex: 1
                          }}
                        />
                      )),
                      isEditing ? (
                        descBox
                      ) : (
                        <CreateDataPhotoButton
                          files={this.props.createNote.files}
                          field_id={null}
                          onPress={() => {
                            this.setState({
                              isTakingPhoto: "main"
                            });
                          }}
                          label="Photo"
                          blurb={descBox}
                        />
                      ))
                    }
                  </Blackout>
                  <Blackout
                    keyboardUp={this.state.focusedBox != null}
                    isFocused={false}
                  >
                    <View style={styles.settingsHeader}>
                      <Text style={styles.settingsHeaderText}>
                        Modify location
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "white"
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          this.setState({
                            isPickingLocation: true
                          });
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center"
                        }}
                      >
                        <Text
                          style={{
                            paddingLeft: 20,
                            paddingRight: 20,
                            paddingTop: 13,
                            paddingBottom: 13,
                            color: "black",
                            flex: 1
                          }}
                        >
                          {this.state.geocodeResult != null &&
                          this.state.geocodeResult[0] != null
                            ? (ref1 = this.state.geocodeResult[0].feature) !=
                              null
                              ? ref1
                              : this.state.geocodeResult[0].formattedAddress
                            : "Locating…"}
                        </Text>
                        <View
                          style={{
                            paddingLeft: 20,
                            paddingRight: 20,
                            paddingTop: 8,
                            paddingBottom: 8
                          }}
                        >
                          <Image
                            style={{
                              width: 69 * 0.15,
                              height: 112 * 0.15
                            }}
                            source={require("../web/assets/img/disclosure-arrow.png")}
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.settingsHeader}>
                      <Text style={styles.settingsHeaderText}>
                        Pick category
                      </Text>
                    </View>
                    <CreateSingleSelect
                      current={this.props.createNote.category}
                      options={this.props.categories}
                      getColor={this.props.getColor}
                      getLabel={cat => {
                        return cat.tag;
                      }}
                      getKey={cat => {
                        return cat.tag_id;
                      }}
                      onSelectOption={cat => {
                        this.props.onUpdateNote(
                          update(this.props.createNote, {
                            category: {
                              $set: cat
                            }
                          })
                        );
                      }}
                    />
                  </Blackout>
                  {this.props.fields.map(field => {
                    var field_data, getText, onChangeData, setText;
                    if (isEditing && field.field_type === "MEDIA") {
                      return null;
                    }
                    return (
                      <Blackout
                        keyboardUp={this.state.focusedBox != null}
                        isFocused={this.state.focusedBox === field.field_id}
                        key={field.field_id}
                        style={{
                          alignSelf: "stretch"
                        }}
                      >
                        <View style={styles.settingsHeader}>
                          <Text style={styles.settingsHeaderText}>
                            {field.field_type === "MEDIA"
                              ? "Extra photo"
                              : `Enter data: ${field.label}`}
                          </Text>
                        </View>
                        {function() {
                          var ref2;
                          field_data =
                            (ref2 = this.props.createNote.field_data) != null
                              ? ref2
                              : [];
                          onChangeData = newData => {
                            this.props.onUpdateNote(
                              update(this.props.createNote, {
                                field_data: {
                                  $set: newData
                                }
                              })
                            );
                          };
                          getText = () => {
                            var data, i, len;
                            for (i = 0, len = field_data.length; i < len; i++) {
                              data = field_data[i];
                              if (data.field_id === field.field_id) {
                                return data.field_data;
                              }
                            }
                            return "";
                          };
                          setText = text => {
                            var newData = field_data.filter(
                              data => data.field_id !== field.field_id
                            );
                            newData.push(
                              new FieldData({
                                field_id: field.field_id,
                                field_data: text
                              })
                            );
                            onChangeData(newData);
                          };
                          switch (field.field_type) {
                            case "TEXT":
                              return (
                                <View
                                  style={{
                                    backgroundColor: "white"
                                  }}
                                >
                                  <TextInput
                                    multiline={false}
                                    value={getText()}
                                    onChangeText={setText}
                                    style={styles.input}
                                    placeholder={field.label}
                                    onFocus={() => {
                                      this.setState({
                                        focusedBox: field.field_id
                                      });
                                    }}
                                    onEndEditing={() => {
                                      if (
                                        this.state.focusedBox === field.field_id
                                      ) {
                                        this.setState({
                                          focusedBox: null
                                        });
                                      }
                                    }}
                                  />
                                </View>
                              );
                            case "TEXTAREA":
                              return (
                                <TextInput
                                  multiline={true}
                                  value={getText()}
                                  onChangeText={setText}
                                  style={{
                                    height: 120,
                                    padding: 10,
                                    fontSize: 16,
                                    alignSelf: "stretch",
                                    backgroundColor: "white"
                                  }}
                                  onFocus={() => {
                                    this.setState({
                                      focusedBox: field.field_id
                                    });
                                  }}
                                  onEndEditing={() => {
                                    if (
                                      this.state.focusedBox === field.field_id
                                    ) {
                                      this.setState({
                                        focusedBox: null
                                      });
                                    }
                                  }}
                                />
                              );
                            case "SINGLESELECT":
                              return (
                                <CreateSingleSelect
                                  current={(() => {
                                    var data,
                                      field_option_id,
                                      i,
                                      j,
                                      len,
                                      len1,
                                      option,
                                      ref3;
                                    field_option_id = null;
                                    for (
                                      i = 0, len = field_data.length;
                                      i < len;
                                      i++
                                    ) {
                                      data = field_data[i];
                                      if (data.field_id === field.field_id) {
                                        field_option_id = data.field_option_id;
                                        break;
                                      }
                                    }
                                    ref3 = field.options;
                                    for (
                                      j = 0, len1 = ref3.length;
                                      j < len1;
                                      j++
                                    ) {
                                      option = ref3[j];
                                      if (
                                        option.field_option_id ===
                                        field_option_id
                                      ) {
                                        return option;
                                      }
                                    }
                                    return field.options[0];
                                  })()}
                                  options={field.options}
                                  getColor={() => {
                                    return "rgba(0,0,0,0)";
                                  }}
                                  getLabel={opt => {
                                    return opt.option;
                                  }}
                                  getKey={opt => {
                                    return opt.field_option_id;
                                  }}
                                  onSelectOption={opt => {
                                    var newData = field_data.filter(
                                      data => data.field_id !== field.field_id
                                    );
                                    newData.push(
                                      new FieldData({
                                        field_id: field.field_id,
                                        field_option_id: opt.field_option_id
                                      })
                                    );
                                    return onChangeData(newData);
                                  }}
                                />
                              );
                            case "MULTISELECT":
                              return field.options.map(option => {
                                return (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      backgroundColor: "white",
                                      alignItems: "center"
                                    }}
                                    key={option.field_option_id}
                                  >
                                    <Switch
                                      value={field_data.some(data => {
                                        return (
                                          data.field_id === field.field_id &&
                                          data.field_option_id ===
                                            option.field_option_id
                                        );
                                      })}
                                      onValueChange={checked => {
                                        var newData = field_data.filter(
                                          data => {
                                            return !(
                                              data.field_id ===
                                                field.field_id &&
                                              data.field_option_id ===
                                                option.field_option_id
                                            );
                                          }
                                        );
                                        if (checked) {
                                          newData.push(
                                            new FieldData({
                                              field_id: field.field_id,
                                              field_option_id:
                                                option.field_option_id
                                            })
                                          );
                                        }
                                        onChangeData(newData);
                                      }}
                                      style={{
                                        margin: 10
                                      }}
                                    />
                                    <Text
                                      style={{
                                        margin: 10
                                      }}
                                    >
                                      {option.option}
                                    </Text>
                                  </View>
                                );
                              });
                            case "MEDIA":
                              return (
                                <CreateDataPhotoButton
                                  files={this.props.createNote.files}
                                  field_id={field.field_id}
                                  onPress={() => {
                                    this.setState({
                                      isTakingPhoto: field
                                    });
                                  }}
                                  label={field.label}
                                />
                              );
                            case "NOMEN":
                              return (
                                <TouchableOpacity
                                  style={{
                                    padding: 10,
                                    backgroundColor: "white"
                                  }}
                                  onPress={() => {
                                    // Linking.openURL "nomen://?nomen_id=#{field.label}&siftr_id=6234" // TODO actual siftr_id
                                    this.props.onViolaIdentify({
                                      note: this.props.createNote,
                                      location: this.props.getLocation()
                                    });
                                  }}
                                >
                                  <Text>
                                    {field_data.find(
                                      data => data.field_id === field.field_id
                                    )}
                                  </Text>
                                  <Text>Launch Nomen</Text>
                                </TouchableOpacity>
                              );
                            default:
                              return <Text>(not implemented yet)</Text>;
                          }
                        }.call(this)}
                      </Blackout>
                    );
                  })}
                </View>
              }
            </ScrollView>
          }
          <Blackout
            keyboardUp={this.state.focusedBox != null}
            isFocused={false}
          >
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={this.props.onCancel}
                style={{
                  flex: 1,
                  alignItems: "center"
                }}
              >
                <Text
                  style={[
                    styles.blackViolaButton,
                    {
                      color: "rgb(165,159,164)"
                    }
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <View
                style={{
                  width: 2,
                  height: 20,
                  backgroundColor: "rgb(237,237,237)"
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (!this.props.createNote.uploading) {
                    this.finishForm();
                  }
                }}
                style={{
                  flex: 1,
                  alignItems: "center"
                }}
              >
                <Text style={styles.blackViolaButton}>
                  {this.props.createNote.uploading
                    ? `Uploading… (${Math.floor(
                        ((ref2 = this.props.progress) != null ? ref2 : 0) * 100
                      )}%)`
                    : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </Blackout>
        </View>
      );
    }
  }
});
