"use strict";

import React from "react";
import T from "prop-types";
import createClass from "create-react-class";
import {
  View,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator
} from "react-native";
import { styles, Text } from "./styles";
import { StatusSpace } from "./status-space";
import {
  BrowserSearchPane,
  BrowserMine,
  BrowserFollowed,
  BrowserDownloaded,
  BrowserFeatured,
  BrowserPopular,
  BrowserNearMe
} from "./native-browser";
import { NativeSettings } from "./native-settings";
import { SiftrInfo } from "./siftr-view";

export var Loading = createClass({
  displayName: "Loading",
  render: function() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "rgb(233,240,240)"
        }}
      >
        <StatusSpace
          queueMessage={this.props.queueMessage}
        />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }
});

export var NativeHome = createClass({
  displayName: "NativeHome",
  getInitialState: function() {
    return {
      discoverPage: this.props.online ? null : "downloaded",
      viewingGameInfo: null,
      cardMode: "full",
      settings: false
    };
  },
  getDefaultProps: function() {
    return {
      onLogout: function() {},
      onSelect: function() {},
      mine: null,
      followed: null,
      followGame: function() {},
      unfollowGame: function() {},
      onChangePassword: function() {},
      onEditProfile: function() {}
    };
  },
  componentWillMount: function() {
    this.choosePage(this.props);
  },
  componentWillReceiveProps: function(nextProps) {
    this.choosePage(nextProps);
  },
  choosePage: function(props) {
    if (this.props.discoverPage == null) {
      if (!this.props.online) {
        this.props.setScreen({
          discoverPage: "downloaded"
        });
      }
      if (props.followed != null && props.followed.length) {
        this.props.setScreen({
          discoverPage: "followed"
        });
      } else if (
        props.followed != null &&
        props.mine != null &&
        props.mine.length
      ) {
        this.props.setScreen({
          discoverPage: "mine"
        });
      } else if (props.followed != null && props.mine != null) {
        this.props.setScreen({
          discoverPage: "featured"
        });
      }
    }
  },
  render: function() {
    var CurrentBrowser, isDiscover, isHome, ref, ref1;
    isHome =
      ((ref = this.props.discoverPage) === "mine" ||
        ref === "followed" ||
        ref === "downloaded") &&
      !this.props.settings;
    isDiscover =
      ((ref1 = this.props.discoverPage) === "featured" ||
        ref1 === "popular" ||
        ref1 === "nearme" ||
        ref1 === "search") &&
      !this.props.settings;
    CurrentBrowser = function() {
      switch (this.props.discoverPage) {
        case "mine":
          return BrowserMine;
        case "followed":
          return BrowserFollowed;
        case "downloaded":
          return BrowserDownloaded;
        case "featured":
          return BrowserFeatured;
        case "popular":
          return BrowserPopular;
        case "nearme":
          return BrowserNearMe;
        case "search":
          return BrowserSearchPane;
      }
    }.call(this);
    return (
      <SiftrInfo
        game={this.state.viewingGameInfo}
        isOpen={this.state.viewingGameInfo != null}
        onChange={b => {
          if (!b) {
            this.setState({
              viewingGameInfo: null
            });
          }
        }}
        followed={this.props.followed}
        followGame={() => {
          this.props.followGame(this.state.viewingGameInfo);
        }}
        unfollowGame={() => {
          this.props.unfollowGame(this.state.viewingGameInfo);
        }}
      >
        {this.props.settings ? (
          <NativeSettings
            onClose={() => {
              this.props.setScreen({
                settings: false
              });
            }}
            onLogout={this.props.onLogout}
            auth={this.props.auth}
            onChangePassword={this.props.onChangePassword}
            onEditProfile={this.props.onEditProfile}
            queueMessage={this.props.queueMessage}
            online={this.props.online}
          />
        ) : this.props.discoverPage == null ? (
          <Loading
            queueMessage={this.props.queueMessage}
          />
        ) : (
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
                onPress={() => {
                  this.props.setScreen({
                    discoverPage: "search"
                  });
                }}
              >
                <Image
                  style={{
                    resizeMode: "contain",
                    height: 20,
                    margin: 10
                  }}
                  source={require("../web/assets/img/icon-search.png")}
                />
              </TouchableOpacity>
              <View
                style={{
                  flex: 4,
                  alignItems: "center"
                }}
              >
                <Text>{isHome ? "Home" : "Explore"}</Text>
              </View>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "flex-end"
                }}
                onPress={() => {
                  this.setState({
                    cardMode:
                      this.state.cardMode === "full" ? "compact" : "full"
                  });
                }}
              >
                <Image
                  style={{
                    resizeMode: "contain",
                    height: 20
                  }}
                  source={
                    this.state.cardMode === "full"
                      ? require("../web/assets/img/icon-cards.png")
                      : require("../web/assets/img/icon-compact.png")
                  }
                />
              </TouchableOpacity>
            </View>
            {isHome ? (
              <View
                style={{
                  flexDirection: "row"
                }}
              >
                <TouchableOpacity
                  key={1}
                  onPress={() => {
                    this.props.setScreen({
                      discoverPage: "mine"
                    });
                  }}
                  style={
                    this.props.discoverPage === "mine"
                      ? styles.exploreTabOn
                      : styles.exploreTabOff
                  }
                >
                  <Text
                    style={{
                      color:
                        this.props.discoverPage === "mine" ? "black" : "#B8B8B8"
                    }}
                  >
                    Mine
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  key={2}
                  onPress={() => {
                    this.props.setScreen({
                      discoverPage: "followed"
                    });
                  }}
                  style={
                    this.props.discoverPage === "followed"
                      ? styles.exploreTabOn
                      : styles.exploreTabOff
                  }
                >
                  <Text
                    style={{
                      color:
                        this.props.discoverPage === "followed"
                          ? "black"
                          : "#B8B8B8"
                    }}
                  >
                    Followed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  key={3}
                  onPress={() => {
                    this.props.setScreen({
                      discoverPage: "downloaded"
                    });
                  }}
                  style={
                    this.props.discoverPage === "downloaded"
                      ? styles.exploreTabOn
                      : styles.exploreTabOff
                  }
                >
                  <Text
                    style={{
                      color:
                        this.props.discoverPage === "downloaded"
                          ? "black"
                          : "#B8B8B8"
                    }}
                  >
                    Downloaded
                  </Text>
                </TouchableOpacity>
              </View>
            ) : isDiscover ? (
              <View
                style={{
                  flexDirection: "row"
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    this.props.setScreen({
                      discoverPage: "featured"
                    });
                  }}
                  style={
                    this.props.discoverPage === "featured"
                      ? styles.exploreTabOn
                      : styles.exploreTabOff
                  }
                >
                  <Text
                    style={{
                      color:
                        this.props.discoverPage === "featured"
                          ? "black"
                          : "#B8B8B8"
                    }}
                  >
                    Featured
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    this.props.setScreen({
                      discoverPage: "popular"
                    });
                  }}
                  style={
                    this.props.discoverPage === "popular"
                      ? styles.exploreTabOn
                      : styles.exploreTabOff
                  }
                >
                  <Text
                    style={{
                      color:
                        this.props.discoverPage === "popular"
                          ? "black"
                          : "#B8B8B8"
                    }}
                  >
                    Popular
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    this.props.setScreen({
                      discoverPage: "nearme"
                    });
                  }}
                  style={
                    this.props.discoverPage === "nearme"
                      ? styles.exploreTabOn
                      : styles.exploreTabOff
                  }
                >
                  <Text
                    style={{
                      color:
                        this.props.discoverPage === "nearme"
                          ? "black"
                          : "#B8B8B8"
                    }}
                  >
                    Near Me
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              void 0
            )}
            <CurrentBrowser
              auth={this.props.auth}
              onSelect={this.props.onSelect}
              cardMode={this.state.cardMode}
              onInfo={game => {
                this.setState({
                  viewingGameInfo: game
                });
              }}
              mine={this.props.mine}
              followed={this.props.followed}
              online={this.props.online}
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
                  padding: 10
                }}
                onPress={() => {
                  if (!isHome) {
                    this.props.setScreen({
                      discoverPage: "mine",
                      settings: false
                    });
                  }
                }}
              >
                <Image
                  style={{
                    resizeMode: "contain",
                    width: 54 * (30 / 50),
                    height: 50 * (30 / 50),
                  }}
                  source={
                    isHome
                      ? require("../web/assets/img/icon-home-selected.png")
                      : require("../web/assets/img/icon-home.png")
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  padding: 10
                }}
                onPress={() => {
                  if (!isDiscover) {
                    this.props.setScreen({
                      discoverPage: "featured",
                      settings: false
                    });
                  }
                }}
              >
                <Image
                  style={{
                    resizeMode: "contain",
                    width: 72 * (24 / 40),
                    height: 40 * (24 / 40),
                  }}
                  source={
                    isDiscover
                      ? require("../web/assets/img/icon-eye-selected.png")
                      : require("../web/assets/img/icon-eye.png")
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  padding: 10
                }}
                onPress={() => {
                  this.props.setScreen({
                    settings: true
                  });
                }}
              >
                <Image
                  style={{
                    resizeMode: "contain",
                    width: (this.props.queueMessage ? 54 : 42) * (28 / 40),
                    height: 40 * (28 / 40),
                  }}
                  source={
                    this.props.settings
                      ? require("../web/assets/img/icon-user-selected.png")
                      : this.props.queueMessage
                        ? require("../web/assets/img/icon-user-uploading.png")
                        : require("../web/assets/img/icon-user.png")
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SiftrInfo>
    );
  }
});
