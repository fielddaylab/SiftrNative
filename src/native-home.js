"use strict";

import React from "react";
import T from "prop-types";
import createClass from "create-react-class";
import update from "immutability-helper";
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Linking,
  ActivityIndicator,
  ScrollView,
  Modal,
  Share,
  Clipboard,
  SafeAreaView
} from "react-native";
import ActionSheet from 'react-native-action-sheet';
import { styles, Text } from "./styles";
import { StatusSpace } from "./status-space";
import {
  BrowserSearchPane,
  BrowserMine,
  BrowserFollowed,
  BrowserDownloaded,
  BrowserFeatured,
  BrowserPopular,
  BrowserNearMe,
  NativeCard,
  ExplorePane
} from "./native-browser";
import { NativeSettings } from "./native-settings";
import { withSuccess } from "./utils";
import { CacheMedia } from './media';
import Geolocation from '@react-native-community/geolocation';

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

class NativeMe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: 'followed',
    };
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <Text style={{
            margin: 20,
            fontSize: 32,
            fontWeight: 'bold',
            fontFamily: 'League Spartan',
          }}>
            Me
          </Text>
          <TouchableOpacity onPress={() => this.props.setScreen({settings: true})}>
            <Image
              source={
                this.props.queueMessage && this.props.queueMessage.uploading
                  ? require('../web/assets/img/icon-gear-uploading.png')
                  : require('../web/assets/img/icon-gear.png')
              }
              style={{
                width: 22,
                height: 22,
                margin: 20,
              }}
            />
          </TouchableOpacity>
        </View>
        <View style={{marginLeft: 30, marginRight: 30, flexDirection: 'row', alignItems: 'center'}}>
          <CacheMedia
            media_id={this.props.auth.authToken.media_id}
            size="thumb_url"
            auth={this.props.auth}
            online={this.props.online}
            withURL={(url) => (
              <Image
                source={url}
                style={{
                  height: 50,
                  width: 50,
                  marginRight: 15,
                  borderRadius: 25,
                }}
              />
            )}
          />
          <Text style={{
            fontWeight: 'bold',
            fontFamily: 'League Spartan',
            fontSize: 18,
          }}>
            {this.props.auth.authToken.display_name}
          </Text>
        </View>
        <View style={{marginLeft: 30, marginRight: 30, marginTop: 15, marginBottom: 15}}>
          <Text>{this.props.auth.bio}</Text>
        </View>
        <View style={{
          flexDirection: 'row',
        }}>
          <TouchableOpacity
            onPress={() => this.setState({list: 'followed'})}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingTop: 8,
              paddingBottom: 8,
              borderBottomColor: this.state.list === 'followed' ? 'black' : 'rgb(238,238,238)',
              borderBottomWidth: 2,
            }}
          >
            <Text style={{
              fontWeight: 'bold',
              fontFamily: 'League Spartan',
              fontSize: 12,
              color: this.state.list === 'followed' ? 'black' : 'rgb(170,180,190)',
            }}>
              Joined
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.setState({list: 'mine'})}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingTop: 8,
              paddingBottom: 8,
              borderBottomColor: this.state.list === 'mine' ? 'black' : 'rgb(238,238,238)',
              borderBottomWidth: 2,
            }}
          >
            <Text style={{
              fontWeight: 'bold',
              fontFamily: 'League Spartan',
              fontSize: 12,
              color: this.state.list === 'mine' ? 'black' : 'rgb(170,180,190)',
            }}>
              Created by Me
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          {
            (this.props[this.state.list] || []).map((game) =>
              <NativeCard
                key={game.game_id}
                game={game}
                onSelect={this.props.onSelect}
                onInfo={this.props.onInfo}
                cardMode="compact"
                auth={this.props.auth}
                online={this.props.online}
              />
            )
          }
        </ScrollView>
      </View>
    );
  }
}

class NativeHomeNew extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      themes: {}
    };
  }

  componentWillMount() {
    // launch stemports right away
    /*
    this.props.auth.getGame({
      game_id: 2,
    }, (res) => {
      if (res.returnCode === 0) {
        this.props.onSelect(res.data);
      }
    });
    return;
    */
    this.getNearby();
    this.getPopular();
    this.getFeatured();
    this.getThemes();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.screen == null
        && this.props.followed == null
        && newProps.followed != null
        && newProps.followed.length === 0) {
      // user has empty home screen, go to discover instead
      this.props.setScreen({screen: 'discover'})
    }
  }

  getNearby() {
    Geolocation.getCurrentPosition((res) => {
      this.props.auth.getNearbyGamesForPlayer({
        latitude: res.coords.latitude,
        longitude: res.coords.longitude,
        filter: 'siftr'
      }, withSuccess((nearbyGames) => this.setState({nearbyGames})));
    });
  }

  getPopular() {
    this.props.auth.searchSiftrs({
      count: 20,
      order_by: 'popular',
    }, withSuccess((popularGames) => this.setState({popularGames})));
  }

  getFeatured() {
    this.props.auth.getStaffPicks({}, withSuccess((games) => {
      this.setState({featuredGames: games.filter((game) => game.is_siftr)});
    }));
  }

  getThemes() {
    for (let i = 0; i < 10; i++) {
      let j = i;
      this.props.auth.getTheme({theme_id: i}, (res) => {
        if (res.returnCode === 0) {
          this.setState((prevState) => update(prevState, {
            themes: {
              [i]: {$set: res.data}
            },
          }));
        }
      });
    }
  }

  showInfo(game) {
    const isFollowing = (this.props.followed || []).some((g) => g.game_id === game.game_id);
    const siftrURL = 'https://siftr.org/' + (game.siftr_url || game.game_id);
    ActionSheet.showActionSheetWithOptions({
      options: ['Share to…', 'Copy Link', (isFollowing ? 'Unfollow' : 'Follow'), 'Cancel'],
      cancelButtonIndex: 3,
      destructiveButtonIndex: (isFollowing ? 2 : -1),
    }, (result) => {
      switch (result) {
        case 0:
          Share.share({
            title: game.name,
            url: siftrURL, /* TODO iOS only */
          });
          break;
        case 1:
          Clipboard.setString(siftrURL);
          break;
        case 2:
          if (isFollowing) {
            this.props.unfollowGame(game);
          } else {
            this.props.followGame(game);
          }
          break;
      }
    });
  }

  render() {
    if (this.props.settings) {
      return (
        <NativeSettings
          onClose={() => {
            this.props.setScreen({settings: false});
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
      <View style={{
        flex: 1,
        backgroundColor: 'white',
      }}>
        <StatusSpace
          backgroundColor="rgba(0,0,0,0)"
          queueMessage={this.props.queueMessage}
        />
        {
          this.state.add &&
          <Modal animationType="slide">
            <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
              <StatusSpace
                backgroundColor="rgba(0,0,0,0)"
                leaveBar={true}
              />
              <View>
                <Text style={{
                  margin: 20,
                  fontSize: 28,
                  fontWeight: 'bold',
                  fontFamily: 'League Spartan',
                }}>
                  Post to a Siftr
                </Text>
              </View>
              <View style={{
                flex: 1,
              }}>
                <BrowserFollowed
                  auth={this.props.auth}
                  onSelect={(game) => this.props.onSelect(game, true)}
                  onInfo={this.showInfo.bind(this)}
                  cardMode="compact"
                  mine={this.props.mine}
                  followed={this.props.followed}
                  online={this.props.online}
                  recent={this.props.recent}
                />
              </View>
              <View style={{alignItems: 'center'}}>
                <TouchableOpacity onPress={() => this.setState({add: false})}>
                  <Image
                    source={require('../web/assets/img/siftr-icon-x.png')}
                    style={{
                      width: 33,
                      height: 33,
                      margin: 10,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>
        }
        {
          (() => {
            switch (this.props.screen) {
              case 'search':
                if (this.props.online) {
                  return (
                    <View style={{
                      flex: 1,
                    }}>
                      <View style={{alignItems: 'flex-start'}}>
                        <Text style={{
                          margin: 20,
                          fontSize: 32,
                          fontWeight: 'bold',
                          fontFamily: 'League Spartan',
                        }}>
                          Search
                        </Text>
                      </View>
                      <BrowserSearchPane
                        auth={this.props.auth}
                        onSelect={this.props.onSelect}
                        onInfo={this.showInfo.bind(this)}
                        cardMode="compact"
                        mine={this.props.mine}
                        followed={this.props.followed}
                        online={this.props.online}
                        nearbyGames={this.state.nearbyGames}
                        featuredGames={this.state.featuredGames}
                      />
                    </View>
                  );
                } else {
                  return (
                    <View style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Image
                        source={require('../web/assets/img/no-internet-black.png')}
                        style={{
                          width: 112 * 0.6,
                          height: 82 * 0.6,
                        }}
                      />
                    </View>
                  );
                }
              case 'discover':
                return (
                  <View style={{flex: 1}}>
                    <View style={{alignItems: 'flex-start'}}>
                      <Text style={{
                        margin: 20,
                        marginBottom: 5,
                        fontSize: 32,
                        fontWeight: 'bold',
                        fontFamily: 'League Spartan',
                      }}>
                        Explore
                      </Text>
                    </View>
                    {
                      this.props.online ? (
                        <ScrollView style={{flex: 1}}>
                          <ExplorePane
                            onSelect={this.props.onSelect}
                            onInfo={this.showInfo.bind(this)}
                            title="Featured"
                            auth={this.props.auth}
                            description="Our favorites"
                            games={this.state.featuredGames}
                            online={this.props.online}
                            themes={this.state.themes}
                          />
                          <ExplorePane
                            onSelect={this.props.onSelect}
                            onInfo={this.showInfo.bind(this)}
                            title="Popular"
                            auth={this.props.auth}
                            description="These are popular among Siftr users"
                            games={this.state.popularGames}
                            online={this.props.online}
                            themes={this.state.themes}
                          />
                          <ExplorePane
                            onSelect={this.props.onSelect}
                            onInfo={this.showInfo.bind(this)}
                            title="Near Me"
                            auth={this.props.auth}
                            description="Happening close to your location"
                            games={this.state.nearbyGames}
                            online={this.props.online}
                            themes={this.state.themes}
                          />
                        </ScrollView>
                      ) : (
                        <View style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Image
                            source={require('../web/assets/img/no-internet-black.png')}
                            style={{
                              width: 112 * 0.6,
                              height: 82 * 0.6,
                            }}
                          />
                        </View>
                      )
                    }
                  </View>
                );
              case 'me':
                return <NativeMe
                  auth={this.props.auth}
                  onSelect={this.props.onSelect}
                  onInfo={this.showInfo.bind(this)}
                  mine={this.props.mine}
                  followed={this.props.followed}
                  online={this.props.online}
                  settings={this.props.settings}
                  setScreen={this.props.setScreen}
                  queueMessage={this.props.queueMessage}
                />;
              case 'home':
              default:
                return (
                  <View style={{
                    flex: 1,
                  }}>
                    <View style={{
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}>
                      <Image
                        source={require('../web/assets/img/siftr-logo-black.png')}
                        style={{
                          width: 66 * 0.6,
                          height: 68 * 0.6,
                          margin: 10,
                        }}
                      />
                    </View>
                    <BrowserFollowed
                      auth={this.props.auth}
                      onSelect={this.props.onSelect}
                      onInfo={this.showInfo.bind(this)}
                      cardMode="full"
                      mine={this.props.mine}
                      followed={this.props.followed}
                      online={this.props.online}
                      recent={this.props.recent}
                    />
                  </View>
                );
            }
          })()
        }
        <View style={{
          backgroundColor: 'white',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity onPress={() => this.props.setScreen({screen: 'home'})}>
            <Image
              source={
                this.props.screen === 'home'
                  ? require('../web/assets/img/siftr-icon-house-on.png')
                  : require('../web/assets/img/siftr-icon-house.png')
              }
              style={{
                width: 33,
                height: 33,
                margin: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.props.setScreen({screen: 'search'})}>
            <Image
              source={
                this.props.screen === 'search'
                  ? require('../web/assets/img/siftr-icon-search-on.png')
                  : require('../web/assets/img/siftr-icon-search.png')
              }
              style={{
                width: 33,
                height: 33,
                margin: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.setState({add: true})}>
            <Image
              source={require('../web/assets/img/siftr-icon-plus.png')}
              style={{
                width: 33,
                height: 33,
                margin: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.props.setScreen({screen: 'discover'})}>
            <Image
              source={
                this.props.screen === 'discover'
                  ? require('../web/assets/img/siftr-icon-explore-on.png')
                  : require('../web/assets/img/siftr-icon-explore.png')
              }
              style={{
                width: 33,
                height: 33,
                margin: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.props.setScreen({screen: 'me'})}>
            <Image
              source={
                this.props.queueMessage && this.props.queueMessage.uploading ? (
                  this.props.screen === 'me'
                    ? require('../web/assets/img/siftr-icon-profile-on-uploading.png')
                    : require('../web/assets/img/siftr-icon-profile-uploading.png')
                ) : (
                  this.props.screen === 'me'
                    ? require('../web/assets/img/siftr-icon-profile-on.png')
                    : require('../web/assets/img/siftr-icon-profile.png')
                )
              }
              style={{
                width: 33,
                height: 33,
                margin: 10,
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

NativeHomeNew.defaultProps = {
  onLogout: function() {},
  onSelect: function() {},
  mine: null,
  followed: null,
  followGame: function() {},
  unfollowGame: function() {},
  onChangePassword: function() {},
  onEditProfile: function() {},
};

export const NativeHome = NativeHomeNew;
