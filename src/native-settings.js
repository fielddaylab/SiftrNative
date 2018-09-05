"use strict";

import React from "react";
import T from "prop-types";
import createClass from "create-react-class";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Linking,
  NetInfo,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  Platform,
  AppState,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Dimensions
} from "react-native";
import { styles, Text } from "./styles";
import { StatusSpace } from "./status-space";
import { CacheMedia } from "./media";
import { requestImage } from "./photos";
import { withSuccess } from "./utils";

const NativePassword = createClass({
  displayName: "NativePassword",
  getDefaultProps: function() {
    return {
      onClose: function() {},
      onChangePassword: function() {}
    };
  },
  componentWillMount: function() {
    this.hardwareBack = () => {
      this.props.onClose();
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", this.hardwareBack);
  },
  componentWillUnmount: function() {
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
  },
  render: function() {
    return (
      <View
        style={{
          flexDirection: "column",
          flex: 1,
          backgroundColor: "white"
        }}
      >
        <StatusSpace
          queueMessage={this.props.queueMessage}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              alignItems: "flex-start"
            }}
            onPress={this.props.onClose}
          >
            <Image
              style={{
                resizeMode: "contain",
                height: 20,
                margin: 10
              }}
              source={require("../web/assets/img/icon-back.png")}
            />
          </TouchableOpacity>
          <View
            style={{
              flex: 4,
              alignItems: "center"
            }}
          >
            <Text>Change Password</Text>
          </View>
          <View
            style={{
              flex: 1
            }}
          />
        </View>
        <ScrollView
          style={{
            flex: 1
          }}
        >
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>Current password</Text>
          </View>
          <TextInput
            placeholder="Current password"
            secureTextEntry={true}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={str => {
              this.oldPassword = str;
            }}
          />
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>New password</Text>
          </View>
          <TextInput
            placeholder="New password"
            secureTextEntry={true}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={str => {
              this.newPassword1 = str;
            }}
          />
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>
              New password, once more
            </Text>
          </View>
          <TextInput
            placeholder="New password, once more"
            secureTextEntry={true}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={str => {
              this.newPassword2 = str;
            }}
          />
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              if (this.newPassword1 === this.newPassword2) {
                this.props.onChangePassword(
                  {
                    username: this.props.auth.authToken.username,
                    oldPassword: this.oldPassword,
                    newPassword: this.newPassword1
                  },
                  changed => {
                    if (changed) {
                      this.props.onClose();
                    } else {
                      console.warn("could not change password");
                    }
                  }
                );
              }
            }}
          >
            <Text>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
});

const NativeProfile = createClass({
  displayName: "NativeProfile",
  getDefaultProps: function() {
    return {
      onClose: function() {},
      onEditProfile: function() {}
    };
  },
  getInitialState: function() {
    return {
      display_name: this.props.auth.authToken.display_name,
      url: this.props.auth.url,
      bio: this.props.auth.bio,
      currentPicture: null,
      newPicture: null,
      progress: null
    };
  },
  componentWillMount: function() {
    this.fetchPicture();
    this.hardwareBack = () => {
      this.props.onClose();
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", this.hardwareBack);
  },
  componentWillUnmount: function() {
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
  },
  fetchPicture: function() {
    var media_id;
    media_id = this.props.auth.authToken.media_id;
    if (media_id != null) {
      this.props.auth.call(
        "media.getMedia",
        {
          media_id: media_id
        },
        withSuccess(userMedia => {
          this.setState({
            currentPicture: {
              uri: userMedia.url.replace("http://", "https://")
            }
          });
        })
      );
    } else {
      this.setState({
        currentPicture: null
      });
    }
  },
  render: function() {
    return (
      <View
        style={{
          flexDirection: "column",
          flex: 1,
          backgroundColor: "white"
        }}
      >
        <StatusSpace
          queueMessage={this.props.queueMessage}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              alignItems: "flex-start"
            }}
            onPress={this.props.onClose}
          >
            <Image
              style={{
                resizeMode: "contain",
                height: 20,
                margin: 10
              }}
              source={require("../web/assets/img/icon-back.png")}
            />
          </TouchableOpacity>
          <View
            style={{
              flex: 4,
              alignItems: "center"
            }}
          >
            <Text>Edit Profile</Text>
          </View>
          <View
            style={{
              flex: 1
            }}
          />
        </View>
        <ScrollView
          style={{
            flex: 1
          }}
          contentContainerStyle={{
            alignItems: "stretch"
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              paddingTop: 15
            }}
          >
            <TouchableOpacity
              onPress={() => {
                if (this.state.progress != null) {
                  return;
                }
                requestImage(img => {
                  if (img != null) {
                    this.setState({
                      newPicture: img
                    });
                  }
                });
              }}
            >
              {this.state.newPicture != null ? (
                <Image
                  source={this.state.newPicture}
                  style={styles.editProfilePic}
                />
              ) : this.state.currentPicture != null ? (
                <CacheMedia
                  url={this.state.currentPicture.uri}
                  withURL={pic => {
                    return (
                      <Image
                        source={pic != null ? {uri: pic} : undefined}
                        style={styles.editProfilePic}
                      />
                    );
                  }}
                />
              ) : (
                <View style={styles.editProfilePic} />
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Username"
            style={styles.input}
            value={this.props.auth.authToken.username}
            editable={false}
          />
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>Display name</Text>
          </View>
          <TextInput
            placeholder="Display name"
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={str => {
              this.setState({
                display_name: str
              });
            }}
            value={this.state.display_name}
            editable={this.state.progress == null}
          />
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>Website</Text>
          </View>
          <TextInput
            placeholder="Website"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={str => {
              this.setState({
                url: str
              });
            }}
            value={this.state.url}
            editable={this.state.progress == null}
          />
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>Bio</Text>
          </View>
          <TextInput
            placeholder="Bio"
            style={styles.input}
            autoCapitalize="sentences"
            autoCorrect={true}
            onChangeText={str => {
              this.setState({
                bio: str
              });
            }}
            value={this.state.bio}
            editable={this.state.progress == null}
          />
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              if (this.state.progress != null) {
                return;
              }
              this.props.onEditProfile(
                {
                  display_name: this.state.display_name,
                  url: this.state.url,
                  bio: this.state.bio,
                  newPicture: this.state.newPicture
                },
                progress => {
                  this.setState({ progress });
                },
                changed => {
                  if (changed) {
                    this.props.onClose();
                  } else {
                    console.warn("could not save profile");
                  }
                }
              );
            }}
          >
            <Text>
              {this.state.progress != null
                ? `Uploading photo… ${Math.floor(this.state.progress * 100)}%`
                : "Save"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
});

export const NativeSettings = createClass({
  displayName: "NativeSettings",
  getInitialState: function() {
    return {
      setting: null
    };
  },
  getDefaultProps: function() {
    return {
      onLogout: function() {},
      onClose: function() {},
      onChangePassword: function() {},
      onEditProfile: function() {}
    };
  },
  componentWillMount: function() {
    this.hardwareBack = () => {
      this.props.onClose();
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", this.hardwareBack);
  },
  componentWillUnmount: function() {
    BackHandler.removeEventListener("hardwareBackPress", this.hardwareBack);
  },
  render: function() {
    switch (this.state.setting) {
      case "profile":
        return (
          <NativeProfile
            onClose={() => {
              this.setState({
                setting: null
              });
            }}
            auth={this.props.auth}
            onEditProfile={this.props.onEditProfile}
            queueMessage={this.props.queueMessage}
          />
        );
      case "password":
        return (
          <NativePassword
            onClose={() => {
              this.setState({
                setting: null
              });
            }}
            auth={this.props.auth}
            onChangePassword={this.props.onChangePassword}
            queueMessage={this.props.queueMessage}
          />
        );
      default:
        return (
          <View
            style={{
              flexDirection: "column",
              flex: 1,
              backgroundColor: "white"
            }}
          >
            <StatusSpace
              queueMessage={this.props.queueMessage}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "flex-start"
                }}
                onPress={this.props.onClose}
              >
                <Image
                  style={{
                    resizeMode: "contain",
                    height: 20,
                    margin: 10
                  }}
                  source={require("../web/assets/img/icon-back.png")}
                />
              </TouchableOpacity>
              <View
                style={{
                  flex: 4,
                  alignItems: "center"
                }}
              >
                <Text>Settings</Text>
              </View>
              <View
                style={{
                  flex: 1
                }}
              />
            </View>
            {
              !(this.props.online) && (
                <View style={{backgroundColor: 'rgb(48,48,48)', flexDirection: 'row', alignItems: 'center'}}>
                  <View style={{flex: 1}}>
                    <Text style={{color: 'white', fontWeight: 'bold', margin: 15}}>
                      Siftr is currently in offline mode.
                    </Text>
                    {
                      (this.props.queueMessage && this.props.queueMessage.notes > 0) && (
                        <Text style={{color: 'white', margin: 15, marginTop: 0}}>
                          You have {this.props.queueMessage.notes} queued to sync when you regain connection.
                        </Text>
                      )
                    }
                  </View>
                  <Image
                    style={{
                      resizeMode: "contain",
                      width: 112 / 2,
                      height: 82 / 2,
                      margin: 25,
                      marginLeft: 0
                    }}
                    source={require("../web/assets/img/no-internet.png")}
                  />
                </View>
              )
            }
            {
              (this.props.online && this.props.queueMessage) && (
                <View style={{backgroundColor: 'rgb(90,208,173)', flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{color: 'white', margin: 15, flex: 1}}>
                    Syncing {this.props.queueMessage.notes}
                  </Text>
                  <Image
                    style={{
                      resizeMode: "contain",
                      width: 28 / 2,
                      height: 28 / 2,
                      margin: 25,
                      marginLeft: 0
                    }}
                    source={require("../web/assets/img/arrow-up.png")}
                  />
                </View>
              )
            }
            <ScrollView
              style={{
                flex: 1
              }}
            >
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsHeaderText}>Account</Text>
              </View>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                  this.setState({
                    setting: "profile"
                  });
                }}
              >
                <Text>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                  this.setState({
                    setting: "password"
                  });
                }}
              >
                <Text>Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={this.props.onLogout}
              >
                <Text>Logout</Text>
              </TouchableOpacity>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsHeaderText}>About</Text>
              </View>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                  Linking.openURL("https://github.com/fielddaylab/SiftrNative");
                }}
              >
                <Text>Open Source</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                  Linking.openURL(
                    "https://docs.google.com/document/d/16P8kIfHka-zHXoQcd9mWlUWiOkaTp6I7UcpD_GoB8LY/edit"
                  );
                }}
              >
                <Text>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                  Linking.openURL(
                    "https://docs.google.com/document/d/1yLXB67G0NfIgp0AAsRUQYB7-LoyFsrihUydxsL_qrms/edit"
                  );
                }}
              >
                <Text>Privacy Policy</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        );
    }
  }
});
