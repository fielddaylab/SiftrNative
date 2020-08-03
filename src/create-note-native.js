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
  Slider,
  ImageBackground,
} from "react-native";
import { styles, Text } from "./styles";
import { RNCamera } from "react-native-camera";
import InfiniteScrollView from "react-native-infinite-scroll-view";
import firebase from "react-native-firebase";
import Geocoder from "react-native-geocoder";
import Permissions from "react-native-permissions";
import { Auth, Game, Tag, Field, FieldData, FieldOption } from "./aris";
import { requestImage } from "./photos";
import { groupBy } from "./items";
import {CacheMedia} from './media';
import {GuideLine} from './stemports-picker';

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

  componentDidMount() {
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
      pendingPhoto: null,
    };
  },
  componentDidMount: function() {
    this.hardwareBack = () => {
      this.props.onCancel();
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", this.hardwareBack);
    Permissions.request("camera").then(response => {
      // permission to take photos
      this.setState({cameraPermission: response});
    });
    Permissions.request("photo").then(response => {
      // permission to access photos
      this.setState({photoPermission: response});
    });
  },
  componentWillUnmount: function() {
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
  },
  takePhoto: function() {
    if (this.camera == null) {
      return;
    }
    const field_id = this.state.field_id;
    const cameraError = () => {
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
            .takePictureAsync({})
            .then(({ uri }) => {
              this.props.onSelectImage({
                uri: uri,
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
  },
  render: function() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'white',
      }}>
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
                    {
                      !this.state.pendingPhoto &&
                      this.state.cameraPermission === 'authorized' &&
                      this.state.photoPermission === 'authorized' && (
                        <RNCamera
                          ref={cam => {
                            this.camera = cam;
                          }}
                          style={{
                            flex: 1
                          }}
                          type={this.state.camera}
                          captureAudio={false}
                          flashMode={
                            this.state.flash
                              ? RNCamera.Constants.FlashMode.torch
                              : RNCamera.Constants.FlashMode.off
                          }
                        />
                      )
                    }
                    {
                      this.state.pendingPhoto
                        ? <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'black',
                          }}>
                            <Image style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              resizeMode: 'contain',
                            }} source={{uri: this.state.pendingPhoto}} />
                          </View>
                        : this.state.shutter
                          ? <Animated.View
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
                          : null
                    }
                    {
                      !this.state.pendingPhoto && (
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
                            source={
                              this.state.flash
                              ? require("../web/assets/img/icon-flash-on.png")
                              : require("../web/assets/img/icon-flash-off.png")
                            }
                            style={{
                              width: 32,
                              height: 32,
                            }}
                          />
                        </TouchableOpacity>
                      )
                    }
                    {
                      !this.state.pendingPhoto && (
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
                      )
                    }
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
        <View style={this.props.style} ref={(view) => this.theView = view}>
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

    measure(cb) {
      this.theView && this.theView.measure(cb);
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
        <View style={{flex: 1}} />
      </View>
    );
  }
});

const CreateSingleSelect = createClass({
  displayName: "CreateSingleSelect",
  getInitialState: function() {
    return {};
  },
  render: function() {
    return (
      <View>
        {
          groupBy(4, this.props.options).map((row, i) =>
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'stretch',
            }}>
              {
                row.map(option => {
                  const media_id = this.props.getMediaID(option);
                  return (
                    <TouchableOpacity key={this.props.getKey(option)} style={{
                      flex: 1,
                      alignItems: 'stretch',
                    }} onPress={() => this.props.onSelectOption(option)}>
                      {
                        media_id ? (
                          <CacheMedia
                            media_id={this.props.getMediaID(option)}
                            auth={this.props.auth}
                            online={true}
                            withURL={(url) =>
                              <Image
                                source={url}
                                style={{
                                  height: 60,
                                  margin: 10,
                                  resizeMode: 'contain',
                                  opacity: option === this.props.current ? 1 : 0.3,
                                }}
                              />
                            }
                          />
                        ) : (
                          <View
                            style={{
                              alignSelf: 'center',
                              height: 60,
                              width: 60,
                              borderRadius: 999,
                              margin: 10,
                              resizeMode: 'contain',
                              opacity: option === this.props.current ? 1 : 0.3,
                              backgroundColor: this.props.getColor(option),
                            }}
                          />
                        )
                      }
                      <Text style={{
                        margin: 10,
                        textAlign: 'center',
                      }}>
                        {this.props.getLabel(option)}
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
  }
});

class NumberInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tempValue: null,
    };
  }

  render() {
    return (
      <View
        style={{
          backgroundColor: 'white',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <Text style={{textAlign: 'left', margin: 15}}>
          Must be between {this.props.field.min} and {this.props.field.max}
        </Text>
        <TextInput
          multiline={false}
          value={(this.state.tempValue == null ? this.props.number : this.state.tempValue) + ''}
          onChangeText={this.props.setText}
          keyboardType="numeric"
          onFocus={this.props.onFocus}
          onEndEditing={() => {
            this.props.onUnfocus();
            let x = parseFloat(this.props.number) || 0;
            x -= this.props.field.min;
            x /= this.props.field.step;
            x = Math.round(x);
            x *= this.props.field.step;
            x += this.props.field.min;
            if (x < this.props.field.min) x = this.props.field.min;
            if (x > this.props.field.max) x = this.props.field.max;
            this.props.setText(x);
          }}
          style={{
            margin: 15,
            minWidth: 65,
            borderBottomColor: '#888',
            borderBottomWidth: 1,
            textAlign: 'left',
            color: 'black',
          }}
        />
      </View>
    );
  }
}

// Steps 2-5 (native app), all non-photo data together
export const CreateData = createClass({
  displayName: "CreateData",
  propTypes: {
    createNote: T.any.isRequired,
    onUpdateNote: T.func,
    getLocation: T.func,
    selectLocation: T.func,
    onStartLocation: T.func,
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
      getLocation: function() {},
      selectLocation: function() {},
      onStartLocation: function() {},
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
      noteLocation: null,
      userPickedLocation: false,
      geocodeResult: null,
      alertFields: [],
      fieldIndex: 0,
    };
  },
  componentDidMount: function() {
    firebase.analytics().logEvent("entering_note_info", {});
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
    this.props.getLocation(loc => {
      this.setLocation(loc, 'gps');
    });
  },
  componentWillUnmount: function() {
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
  },
  setLocation: function(loc, source) {
    // source should be 'user', 'gps', or 'photo'
    const setAndGeocode = () => {
      this.setState({noteLocation: loc, userPickedLocation: source === 'user'}, () => {
        Geocoder.geocodePosition(loc).then(res => {
          if (this.state.noteLocation === loc) {
            this.setState({geocodeResult: res});
          }
        });
      });
    };
    if (this.state.noteLocation && source === 'gps') {
      return;
    } else if (this.state.userPickedLocation && source === 'photo') {
      Alert.alert(
        'Use photo location?',
        'This photo has location information. Which location do you want to use?',
        [
          {text: 'Existing', onPress: (() => null), style: 'cancel'},
          {text: 'Photo', onPress: setAndGeocode},
        ],
      );
    } else {
      setAndGeocode();
    }
  },
  finishForm: function() {
    let field_data = this.props.createNote.field_data;
    if (field_data == null) field_data = [];
    this.props.fields.forEach(field => {
      if (field.field_type === "SINGLESELECT") {
        if (field_data.some(data => data.field_id === field.field_id)) {
          // singleselect has something selected
        } else if (!field.required) {
          // don't add anything because the top option is (none)
        } else {
          field_data.push(
            new FieldData({
              field_id: field.field_id,
              field_option_id: field.options[0].field_option_id
            })
          );
        }
      }
    });
    // remove any fields that are for other quests
    let current_quest_id = this.props.currentQuest && parseInt(this.props.currentQuest.quest_id);
    if (current_quest_id) {
      field_data = field_data.filter(data => {
        const field = this.props.fields.find(field => field.field_id === data.field_id);
        const this_quest_id = parseInt(field.quest_id);
        if (this_quest_id) {
          return parseInt(this_quest_id) === current_quest_id;
        } else {
          return true;
        }
      });
    }
    this.props.onFinish(field_data, this.state.noteLocation);
  },
  scrollToField: function(field_id) {
    if (this.scrollFields && this.fieldChunks && this.fieldChunks[field_id]) {
      this.fieldChunks[field_id].measure((fx, fy, width, height, px, py) => {
        this.scrollFields.scrollTo({x: 0, y: fy, animated: true});
      });
    }
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
                this.setLocation(this.props.selectLocation(), 'user');
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
          onSelectImage={(file, location) => {
            var newFiles;
            newFiles = this.props.createNote.files.filter(file => {
              return file.field_id !== field_id;
            });
            newFiles.push({ file, field_id });
            this.props.onUpdateNote(update(this.props.createNote, {
              files: {$set: newFiles},
              exif: {$set: location},
            }), () => {
              this.props.getLocation(loc => {
                this.setLocation(loc, 'photo');
              });
            });
            this.setState((oldState) => update(oldState, {
              isTakingPhoto: {$set: null},
              alertFields: {$apply: (x) => x.filter((fld) => fld.field_id !== field_id)},
            }));
          }}
          game={this.props.game}
          instruction={field}
        />
      );
    } else {

      let visiblePhotos = [];
      let visibleFieldNotes = [];
      let visibleRest = [];

      let visibleFields = this.props.fields.filter(field => {
        if (isEditing && field.field_type === "MEDIA") {
          return false;
        }
        // filter fields based on selected quest
        if (field.quest_id
          && this.props.currentQuest
          && parseInt(field.quest_id) !== parseInt(this.props.currentQuest.quest_id)) {
          return false;
        }
        // filter fields based on previously selected field options
        const field_data = this.props.createNote.field_data || [];
        if (field.field_option_id
          && field_data.every(data => data.field_option_id !== field.field_option_id)) {
          return false;
        }
        if (field.sort_index === -1) {
          return false;
        }
        return true;
      });
      const guideFieldIDs = this.props.guides.map(guide => parseInt(guide.field_id));
      visibleFields.forEach(field => {
        if (field.field_type === 'MEDIA') {
          visiblePhotos.push(field);
        } else if (guideFieldIDs.indexOf(parseInt(field.field_id)) !== -1) {
          visibleFieldNotes.push(field);
        } else {
          visibleRest.push(field);
        }
      });
      visibleFields = visiblePhotos.concat(visibleFieldNotes).concat(visibleRest.length === 0 ? [] : [visibleRest]);
      const currentFieldPage = Array.isArray(visibleFields[this.state.fieldIndex]) ?
        visibleFields[this.state.fieldIndex]   :
        [visibleFields[this.state.fieldIndex]] ;
      const progressCamera = (this.state.fieldIndex < visiblePhotos.length ? 'current' : 'done');
      const progressFieldNotes = (this.state.fieldIndex < visiblePhotos.length ? 'future' :
        this.state.fieldIndex < visiblePhotos.length + visibleFieldNotes.length ? 'current' : 'done');
      const progressRest = (this.state.fieldIndex < visiblePhotos.length + visibleFieldNotes.length ? 'future' : 'current');

      let fieldNoteDots = [];
      for (let i = visiblePhotos.length; i < visiblePhotos.length + visibleFieldNotes.length; i++) {
        fieldNoteDots.push(
          <Image
            key={i}
            source={
              this.state.fieldIndex < i
                ? require('../web/assets/img/observation-notes-dot-future.png')
                : require('../web/assets/img/observation-notes-dot-current.png')
            }
            style={{
              width: 26 * 0.5,
              height: 31 * 0.5,
            }}
          />
        )
      }

      const previousField = () => this.setState(prevState =>
        update(prevState, {fieldIndex: {$apply: (x) => x - 1}})
      );
      const nextField = () => this.setState(prevState =>
        update(prevState, {fieldIndex: {$apply: (x) => x + 1}})
      );

      return (
        <View
          style={{
            flex: 1
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "white"
            }}
          >
            <View
              style={{
                flex: 4,
                alignItems: "center",
                margin: 10,
              }}
            >
              <Text style={{fontWeight: 'bold'}}>
                <Text style={{fontStyle: 'italic'}}>Posting to</Text>
                {' '}
                {this.props.game.name}
              </Text>
            </View>
          </View>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: 'white',
          }}>
            {
              visiblePhotos.length > 0 && (
                <TouchableOpacity onPress={() => {
                  this.setState(prevState =>
                    update(prevState, {fieldIndex: {$set: 0}})
                  );
                }} style={{
                  alignItems: 'center',
                  margin: 10,
                }}>
                  <Image source={
                    progressCamera === 'current' ? require('../web/assets/img/observation-camera-current.png')
                      : require('../web/assets/img/observation-camera-done.png')
                  } style={{
                    width: 150 * 0.5,
                    height: 144 * 0.5,
                  }} />
                  <Text style={{
                    color: 'rgb(36,48,59)',
                  }}>
                    camera
                  </Text>
                </TouchableOpacity>
              )
            }
            {
              visibleFieldNotes.length > 0 && (
                <TouchableOpacity onPress={() => {
                  if (progressFieldNotes !== 'future') {
                    this.setState(prevState =>
                      update(prevState, {fieldIndex: {$set: visiblePhotos.length}})
                    );
                  }
                }} style={{
                  alignItems: 'center',
                  margin: 10,
                }}>
                  <View style={{flexDirection: 'row'}}>
                    {fieldNoteDots}
                  </View>
                  <Image source={
                    progressFieldNotes === 'current' ? require('../web/assets/img/observation-notes-book-current.png')
                      : progressFieldNotes === 'future' ? require('../web/assets/img/observation-notes-book-future.png')
                      : require('../web/assets/img/observation-notes-book-done.png')
                  } style={{
                    width: 150 * 0.5,
                    height: 113 * 0.5,
                  }} />
                  <Text style={{
                    color: progressFieldNotes === 'future' ? 'rgb(192,204,214)' : 'rgb(36,48,59)',
                  }}>
                    field notes
                  </Text>
                </TouchableOpacity>
              )
            }
            {
              visibleRest.length > 0 && (
                <TouchableOpacity onPress={() => {
                  if (progressRest !== 'future') {
                    this.setState(prevState =>
                      update(prevState, {fieldIndex: {$set: visiblePhotos.length + visibleFieldNotes.length}})
                    );
                  }
                }} style={{
                  alignItems: 'center',
                  margin: 10,
                }}>
                  <Image source={
                    progressRest === 'current' ? require('../web/assets/img/observation-rest-current.png')
                      : require('../web/assets/img/observation-rest-future.png')
                  } style={{
                    width: 150 * 0.5,
                    height: 144 * 0.5,
                  }} />
                  <Text style={{
                    color: progressRest === 'future' ? 'rgb(192,204,214)' : 'rgb(36,48,59)',
                  }}>
                    more
                  </Text>
                </TouchableOpacity>
              )
            }
          </View>
          {
            visibleFields[this.state.fieldIndex].field_type === 'MEDIA' ? (() => {
              const field = visibleFields[this.state.fieldIndex];
              const field_id = field.field_id;
              const file = this.props.createNote.files.find(f => f.field_id === field_id);
              let photoOrCamera = null;
              let text = '';
              if (file) {
                text = 'Nice! If it looks good, press next.';
                photoOrCamera = (
                  <ImageBackground
                    source={file.file}
                    style={{
                      flex: 1,
                      backgroundColor: '#333',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}
                    imageStyle={{
                      resizeMode: 'contain',
                    }}
                  >
                    <TouchableOpacity style={{
                      backgroundColor: 'white',
                      margin: 25,
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingLeft: 20,
                      paddingRight: 20,
                      borderRadius: 5,
                    }} onPress={() => {
                      this.props.onUpdateNote(update(this.props.createNote, {
                        files: {$set: this.props.createNote.files.filter(file => file.field_id !== field_id)},
                      }));
                    }}>
                      <Text>Retake</Text>
                    </TouchableOpacity>
                  </ImageBackground>
                );
              } else {
                text = field.instruction || 'Take a photo for your observation.';
                photoOrCamera = (
                  <CreatePhoto
                    onSelectImage={(file, location) => {
                      let newFiles = this.props.createNote.files.filter(file => file.field_id !== field_id);
                      newFiles.push({ file, field_id });
                      this.props.onUpdateNote(update(this.props.createNote, {
                        files: {$set: newFiles},
                        exif: {$set: location},
                      }), () => {
                        this.props.getLocation(loc => {
                          this.setLocation(loc, 'photo');
                        });
                      });
                      this.setState((oldState) => update(oldState, {
                        isTakingPhoto: {$set: null},
                        alertFields: {$apply: (x) => x.filter((fld) => fld.field_id !== field_id)},
                      }));
                    }}
                    game={this.props.game}
                    instruction={field.label}
                    ref={(createPhoto) => (this.createPhoto = createPhoto)}
                  />
                );
              }
              return (
                <View style={{flex: 1}}>
                  <GuideLine
                    style={{
                      backgroundColor: 'white',
                      padding: 10,
                    }}
                    text={text}
                  />
                  {photoOrCamera}
                </View>
              )
            })() : (
            <ScrollView
              ref={(sv) => {
                this.scrollFields = sv;
              }}
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
                      !(this.props.game.newFormat()) &&
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
                            flex: 1,
                            color: 'black',
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
                  {currentFieldPage.map(field => {
                    var getText, onChangeData, clearAlert, setText;
                    const field_data = this.props.createNote.field_data || [];
                    return (
                      <Blackout
                        keyboardUp={this.state.focusedBox != null}
                        isFocused={this.state.focusedBox === field.field_id}
                        key={field.field_id}
                        style={{
                          alignSelf: "stretch"
                        }}
                        ref={(chunk) => {
                          if (!this.fieldChunks) this.fieldChunks = {};
                          this.fieldChunks[field.field_id] = chunk;
                        }}
                      >
                        <GuideLine
                          style={{
                            backgroundColor: 'white',
                            padding: 10,
                          }}
                          text={field.instruction}
                        />
                        {function() {
                          var ref2;
                          onChangeData = newData => {
                            this.props.onUpdateNote(
                              update(this.props.createNote, {
                                field_data: {
                                  $set: newData
                                }
                              })
                            );
                          };
                          getText = (def = '') => {
                            var data, i, len;
                            for (i = 0, len = field_data.length; i < len; i++) {
                              data = field_data[i];
                              if (data.field_id === field.field_id) {
                                return data.field_data;
                              }
                            }
                            return def;
                          };
                          clearAlert = () => {
                            if (this.state.alertFields.indexOf(field) !== -1) {
                              this.setState((oldState) => update(oldState, {
                                alertFields: {$apply: (x) => x.filter((fld) => fld !== field)},
                              }));
                            }
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
                            clearAlert();
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
                                      this.scrollToField(field.field_id);
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
                            case 'NUMBER':
                              return <NumberInput
                                field={field}
                                number={getText(field.min)}
                                onFocus={() => {
                                  this.scrollToField(field.field_id);
                                  this.setState({
                                    focusedBox: field.field_id
                                  });
                                }}
                                onUnfocus={() => {
                                  if (this.state.focusedBox === field.field_id) {
                                    this.setState({
                                      focusedBox: null
                                    });
                                  }
                                }}
                                setText={setText}
                              />;
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
                                    backgroundColor: "white",
                                    color: 'black',
                                  }}
                                  onFocus={() => {
                                    this.scrollToField(field.field_id);
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
                              // TODO this is probably not necessary anymore
                              let filteredOptions = field.options.filter(opt => {
                                if (parseInt(opt.field_guide_id)) {
                                  return this.props.isGuideComplete(opt.field_guide_id);
                                } else {
                                  return true;
                                }
                              });
                              if (!field.required) {
                                filteredOptions.unshift(new FieldOption({
                                  field_option_id: 0,
                                  field_id: field.field_id,
                                  game_id: this.props.game.game_id,
                                  option: '(none)',
                                  sort_index: 0,
                                  color: 'gray',
                                  remnant_id: null,
                                  field_guide_id: null,
                                }));
                              }
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
                                    ref3 = filteredOptions;
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
                                    return null;
                                  })()}
                                  options={filteredOptions}
                                  getColor={this.props.getColor}
                                  auth={this.props.auth}
                                  getMediaID={option => {
                                    const item = this.props.items.find(item =>
                                      parseInt(item.item_id) === option.remnant_id
                                    );
                                    return item && (item.icon_media_id || item.media_id);
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
                                    if (opt.field_option_id !== 0) {
                                      newData.push(
                                        new FieldData({
                                          field_id: field.field_id,
                                          field_option_id: opt.field_option_id
                                        })
                                      );
                                    }
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
                                      location: this.props.selectLocation()
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
            )
          }
          <Blackout
            keyboardUp={this.state.focusedBox != null}
            isFocused={false}
          >
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={this.state.fieldIndex === 0 ? this.props.onCancel : previousField}
                style={{
                  flex: 1,
                  alignItems: "center"
                }}
              >
                <Text style={styles.blackViolaButton}>
                  {this.state.fieldIndex === 0 ? 'Cancel' : 'Back'}
                </Text>
              </TouchableOpacity>
              {
                visibleFields[this.state.fieldIndex].field_type === 'MEDIA' ? (
                  <TouchableOpacity
                    onPress={() => this.createPhoto && this.createPhoto.takePhoto()}
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
                ) : (
                  <View
                    style={{
                      width: 2,
                      height: 20,
                      backgroundColor: "rgb(237,237,237)"
                    }}
                  />
                )
              }
              <TouchableOpacity
                onPress={() => {
                  const field_data = this.props.createNote.field_data || [];
                  const stopAdvance = currentFieldPage.some(field => {
                    let canAdvance = true;
                    if (field.required) {
                      if (field.field_type === 'TEXT' || field.field_type === 'TEXTAREA') {
                        const match = field_data.filter(data => data.field_id === field.field_id);
                        if (match.length === 0 || !(match[0].field_data)) {
                          canAdvance = false;
                        }
                      } else if (field.field_type === 'MEDIA' && !this.props.createNote.note_id) {
                        let files = this.props.createNote.files;
                        if (files == null) files = [];
                        if (!files.some(file => file.field_id === field.field_id)) {
                          canAdvance = false;
                        }
                      } else if (field.field_type === 'SINGLESELECT' || field.field_type === 'MULTISELECT') {
                        if (!field_data.some(data => data.field_id === field.field_id)) {
                          canAdvance = false;
                        }
                      }
                    }
                    if (!canAdvance) {
                      this.setState({alertFields: [field]});
                      this.scrollToField(field.field_id);
                      return true;
                    }
                  });
                  if (stopAdvance) return;
                  if (this.state.fieldIndex >= visibleFields.length - 1) {
                    this.finishForm();
                  } else {
                    nextField();
                  }
                }}
                style={{
                  flex: 1,
                  alignItems: "center"
                }}
              >
                <Text style={styles.blackViolaButton}>
                  {this.state.fieldIndex >= visibleFields.length - 1 ? 'Post!' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </Blackout>
        </View>
      );
    }
  },
});
