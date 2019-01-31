'use strict';

import React from 'react';
import T from 'prop-types';
import createClass from 'create-react-class';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import {Text} from './styles';
import {CacheMedia} from './media';
import RNFS from 'react-native-fs';
import {
  deserializeGame,
  deserializeNote
} from './aris';
import {withSuccess} from './utils';
import Markdown from "react-native-simple-markdown";
import removeMarkdown from 'remove-markdown';
import Permissions from "react-native-permissions";
import {makeMapStyles} from './map';

const mapMaybe = (xs, f) => {
  return xs.map(f).filter((x) => x != null);
};

export class NativeCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contributors: null,
      posts: null,
      photos: null,
      authors: null
    };
  }

  componentWillMount() {
    this._isMounted = true;
    const useNotes = (notes) => {
      if (!this._isMounted) {
        return;
      }
      this.setState({
        photos: mapMaybe(notes.slice(0, 8), (note) => {
          if (note.thumb_url != null) {
            return {
              url: note.thumb_url,
              note_id: note.note_id
            };
          } else {
            return null;
          }
        }),
        posts: notes.length,
        contributors: (() => {
          let user_ids = {};
          notes.forEach((note) => {
            user_ids[note.user.user_id] = note.user;
            note.comments.forEach((comment) => {
              user_ids[comment.user.user_id] = comment.user;
            });
          });
          return user_ids;
        })()
      });
    };
    // first we try to read notes.txt
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${this.props.game.game_id}`;
    let liveNotes = false;
    RNFS.readFile(`${siftrDir}/notes.txt`).then((json) => {
      if (!liveNotes) {
        const notes = JSON.parse(json).map((note) => deserializeNote(note));
        useNotes(notes);
      }
    }).catch((err) => {
      return null; // whatever
    });
    // then if online we try to read the current notes
    if (this.props.online) {
      this.xhrs = [
        this.props.auth.getUsersForGame({
          game_id: this.props.game.game_id
        }, withSuccess((authors) => {
          if (!this._isMounted) return;
          this.setState({
            authors: authors.map((author) => author.display_name)
          });
        }, true /* don't warn on error */)),
        this.props.auth.searchNotes({
          game_id: this.props.game.game_id,
          order_by: 'recent'
        }, withSuccess((notes) => {
          liveNotes = true;
          RNFS.writeFile(`${siftrDir}/notes.txt`, JSON.stringify(notes));
          useNotes(notes);
        }, true /* don't warn on error */)),
      ];
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.xhrs) this.xhrs.forEach((xhr) => xhr.abort());
  }

  authorName() {
    if (this.state.authors == null) {
      return '…';
    } else {
      let authors = this.state.authors
      // if (authors.length > 2) {
      //   authors = authors.slice(0, 2).concat(['…']);
      // }
      return authors.join(', ');
    }
  }

  siftrIcon(style = {}) {
    return (
      <CacheMedia
        media_id={this.props.game.icon_media_id}
        size="thumb_url"
        auth={this.props.auth}
        online={this.props.online}
        withURL={(url) => (
          <View style={[{
            borderRadius: 14,
            borderColor: (url == null ? 'rgba(0,0,0,0)' : 'white'),
            borderWidth: 3,
          }, style]}>
            <Image
              source={url}
              style={{
                height: 46,
                width: 46,
                resizeMode: 'contain',
                borderRadius: 11,
              }}
            />
          </View>
        )}
      />
    );
  }

  fullView() {
    const contributorIcons = [];
    let contributorCount = '…';
    let contributorPlural = 's';
    if (this.state.contributors) {
      for (var user_id in this.state.contributors) {
        const user = this.state.contributors[user_id];
        if (user.media_id) contributorIcons.push(user.media_id);
        if (contributorIcons.length == 3) break;
      }
      contributorCount = Object.keys(this.state.contributors).length;
      if (contributorCount === 1) contributorPlural = '';
    }
    let postCount = '…';
    let postPlural = 's';
    if (this.state.posts != null) {
      postCount = this.state.posts;
      if (postCount === 1) postPlural = '';
    }
    return (
      <TouchableOpacity onPress={() => this.props.onSelect(this.props.game)} style={{
        backgroundColor: 'white',
        margin: 15,
        marginBottom: 0,
        borderRadius: 10,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: {height: 5},
        elevation: 10,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 10,
          alignItems: 'center'
        }}>
          {
            this.siftrIcon({
              marginRight: 10,
            })
          }
          <View style={{flex: 1}}>
            <Text style={{fontWeight: 'bold'}}>{this.props.game.name}</Text>
            <Text style={{color: 'rgb(140,140,140)', fontSize: 12}}>{this.authorName()}</Text>
          </View>
          <TouchableOpacity style={{
            padding: 10,
            paddingTop: 20,
            paddingBottom: 20,
          }} onPress={() => this.props.onInfo(this.props.game)}>
            <Image source={require('../web/assets/img/icon-3dots.png')} style={{
              width: 34 * 0.8,
              height: 8 * 0.8,
              resizeMode: 'contain'
            }} />
          </TouchableOpacity>
        </View>
        <View style={{
          flexDirection: 'row',
          overflow: 'hidden'
        }}>
          {
            this.state.photos != null
            ? this.state.photos.map(({url, note_id}) => {
                return <CacheMedia key={note_id} url={url} online={this.props.online} withURL={(url) => {
                  return <Image source={url} style={{
                    height: 100,
                    width: 100
                  }} />;
                }} />;
              })
            : <View style={{
                height: 100,
                width: 100
              }} />
          }
        </View>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          padding: 10,
          alignItems: 'center'
        }}>
          <View style={{
            marginRight: contributorIcons.length === 0 ? 0 : 20,
            flexDirection: 'row',
          }}>
            {
              contributorIcons.map((media_id) => (
                <CacheMedia
                  media_id={media_id}
                  key={media_id}
                  size="thumb_url"
                  auth={this.props.auth}
                  online={this.props.online}
                  withURL={(url) => (
                    <Image
                      source={url}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        marginRight: -10,
                        resizeMode: 'cover',
                        borderColor: 'white',
                        borderWidth: 2,
                      }}
                    />
                  )}
                />
              ))
            }
          </View>
          <View>
            <Text style={{fontWeight: 'bold'}}>
              {contributorCount} contributor{contributorPlural}
            </Text>
            <Text>
              {postCount} post{postPlural}
            </Text>
          </View>
        </View>
        <View style={{
          padding: 10,
          flexDirection: 'row',
          maxHeight: 75,
        }}>
          <Text style={{flex: 1}}>
            {removeMarkdown(this.props.game.description)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  modalView() {
    const contributorIcons = [];
    let contributorCount = '…';
    let contributorPlural = 's';
    if (this.state.contributors) {
      for (var user_id in this.state.contributors) {
        const user = this.state.contributors[user_id];
        if (user.media_id) contributorIcons.push(user.media_id);
        if (contributorIcons.length == 3) break;
      }
      contributorCount = Object.keys(this.state.contributors).length;
      if (contributorCount === 1) contributorPlural = '';
    }
    let postCount = '…';
    let postPlural = 's';
    if (this.state.posts != null) {
      postCount = this.state.posts;
      if (postCount === 1) postPlural = '';
    }
    return (
      <View>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 10,
          alignItems: 'center',
          marginLeft: 8,
          marginRight: 8,
        }}>
          {
            this.siftrIcon({
              marginRight: 10,
            })
          }
          <View style={{flex: 1}}>
            <Text style={{fontWeight: 'bold'}}>{this.props.game.name}</Text>
            <Text style={{color: 'rgb(140,140,140)', fontSize: 12}}>{this.authorName()}</Text>
          </View>
        </View>
        <View style={{
          padding: 10,
          flexDirection: 'row',
          marginLeft: 8,
          marginRight: 8,
        }}>
          <Markdown>
            {this.props.game.description}
          </Markdown>
        </View>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          padding: 10,
          alignItems: 'center',
          backgroundColor: 'rgb(243,243,243)',
        }}>
          <View style={{
            marginRight: contributorIcons.length === 0 ? 0 : 20,
            flexDirection: 'row',
          }}>
            {
              contributorIcons.map((media_id) => (
                <CacheMedia
                  media_id={media_id}
                  key={media_id}
                  size="thumb_url"
                  auth={this.props.auth}
                  online={this.props.online}
                  withURL={(url) => (
                    <Image
                      source={url}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        marginRight: -10,
                        resizeMode: 'cover',
                        borderColor: 'white',
                        borderWidth: 2,
                      }}
                    />
                  )}
                />
              ))
            }
          </View>
          <View style={{flex: 1}}>
            <Text style={{fontWeight: 'bold', color: 'rgb(128,128,128)'}}>
              {contributorCount} contributor{contributorPlural}
            </Text>
            <Text style={{color: 'rgb(128,128,128)'}}>
              {postCount} post{postPlural}
            </Text>
          </View>
          <View>
            <TouchableOpacity
              onPress={
                this.props.isFollowing
                  ? this.props.unfollowGame
                  : this.props.followGame
              }
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderColor: "black",
                borderRadius: 5,
                borderWidth: 1,
              }}
            >
              <Text>
                {this.props.isFollowing == null
                  ? "..."
                  : this.props.isFollowing
                    ? "joined"
                    : "join"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  compactView() {
    return (
      <TouchableOpacity onPress={() => this.props.onSelect(this.props.game)} style={{
        backgroundColor: 'white',
        padding: 20,
        borderColor: 'rgb(241,241,241)',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        {
          this.siftrIcon({
            marginRight: 20,
          })
        }
        <View style={{
          flex: 1
        }}>
          <Text>{this.props.game.name}</Text>
          <Text style={{color: 'rgb(140,140,140)', fontSize: 12, marginTop: 3}}>{this.authorName()}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  squareView() {
    const mapParams = [];
    if (this.props.game.type === 'ANYWHERE') {
      mapParams.push(`center=0,0`);
      mapParams.push(`zoom=1`);
    } else {
      mapParams.push(`center=${this.props.game.latitude},${this.props.game.longitude}`);
      mapParams.push(`zoom=${this.props.game.zoom}`);
    }
    mapParams.push('size=600x300');
    if (this.props.game.map_type === 'STREET') {
      mapParams.push('maptype=roadmap');
    } else {
      mapParams.push('maptype=hybrid');
    }
    // translate the javascript style parameters to the GET parameter format
    makeMapStyles(this.props.game, this.props.theme).forEach((style) => {
      const styleParams = [];
      if (style.featureType) styleParams.push(`feature:${style.featureType}`);
      if (style.elementType) styleParams.push(`element:${style.elementType}`);
      style.stylers.forEach((styler) => {
        Object.keys(styler).forEach((k) => {
          styleParams.push(`${k}:${styler[k]}`);
        });
      });
      mapParams.push(`style=${styleParams.join('%7C')}`); // pipe char
    });
    mapParams.push('key=AIzaSyDlMWLh8Ho805A5LxA_8FgPOmnHI0AL9vw');
    const mapURL = `https://maps.googleapis.com/maps/api/staticmap?${mapParams.join('&')}`.replace(/\#/g, '0x');

    return (
      <TouchableOpacity onPress={() => this.props.onSelect(this.props.game)} style={{
        margin: 9,
        marginTop: 20,
        marginBottom: 20,
        width: 260,
        backgroundColor: 'white',
        borderRadius: 4,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: {height: 3},
        elevation: 7,
      }}>
        <View style={{alignItems: 'stretch'}}>
          <CacheMedia
            url={mapURL}
            online={this.props.online}
            withURL={(url) => (
              <Image
                source={url}
                style={{
                  height: 120,
                  resizeMode: 'cover',
                }}
              />
            )}
          />
        </View>
        <View style={{flexDirection: 'row', alignItems: 'stretch'}}>
          <View style={{padding: 11, flex: 1}}>
            <Text numberOfLines={2} style={{
              fontSize: 15,
              margin: 4,
            }}>
              {this.props.game.name}
            </Text>
            <Text numberOfLines={3} style={{
              fontSize: 12,
              margin: 4,
            }}>
              {removeMarkdown(this.props.game.description)}
            </Text>
          </View>
          <View style={{width: 50}}>
            {
              this.siftrIcon({
                position: 'absolute',
                top: -20,
                right: 5,
              })
            }
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    switch (this.props.cardMode) {
      case 'full':
        return this.fullView();
      case 'modal':
        return this.modalView();
      case 'compact':
        return this.compactView();
      case 'square':
        return this.squareView();
    }
  }
}

NativeCard.defaultProps = {
  onSelect: (function() {}),
  onInfo: (function() {}),
  cardMode: 'full',
};

const BrowserList = createClass({
  displayName: 'BrowserList',
  getDefaultProps: function() {
    return {
      onSelect: (function() {}),
      onInfo: (function() {}),
      cardMode: 'full'
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    // onSelect and onInfo are function-wrapped
    return this.props.games !== nextProps.games ||
      this.props.cardMode !== nextProps.cardMode ||
      this.props.auth !== nextProps.auth;
  },
  render: function() {
    if (this.props.games != null) {
      return (
        <ScrollView style={{
          flex: 1,
        }}>
          {this.props.games.map((game) =>
            <NativeCard
              key={game.game_id}
              cardMode={this.props.cardMode}
              game={game}
              onSelect={this.props.onSelect}
              auth={this.props.auth}
              onInfo={this.props.onInfo}
              online={this.props.online}
            />
          )}
          <View style={{height: 40}} />
        </ScrollView>
      );
    } else {
      return (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
  }
});

const makeBrowser = (getGames) => createClass({
  getDefaultProps: function() {
    return {
      onSelect: (function() {}),
      onInfo: (function() {}),
      cardMode: 'full'
    };
  },
  getInitialState: function() {
    return {
      games: null
    };
  },
  componentWillMount: function() {
    this._isMounted = true;
    this.updateGames();
  },
  componentWillUnmount: function() {
    this._isMounted = false;
  },
  updateGames: function(props = this.props) {
    var thisSearch;
    thisSearch = this.lastSearch = Date.now();
    getGames(props, (games) => {
      if (!this._isMounted) {
        return;
      }
      if (thisSearch !== this.lastSearch) {
        return;
      }
      this.setState({games});
    });
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    // onSelect and onInfo are function-wrapped
    return this.props.auth !== nextProps.auth ||
      this.state.games !== nextState.games ||
      this.props.cardMode !== nextProps.cardMode;
  },
  componentWillReceiveProps: function(newProps) {
    if ((this.props.auth == null) || ['auth', 'search', 'mine', 'followed'].some((x) => {
      return this.props[x] !== newProps[x];
    })) {
      this.updateGames(newProps);
    }
  },
  render: function() {
    return (
      <BrowserList auth={this.props.auth} games={this.state.games}
        onSelect={(...args) => {
          this.props.onSelect(...args);
        }}
        onInfo={(...args) => {
          this.props.onInfo(...args);
        }}
        cardMode={this.props.cardMode} online={this.props.online}
      />
    );
  }
});

const BrowserSearch = makeBrowser(function(props, cb) {
  if (props.search === '') {
    cb([]);
  } else {
    props.auth.searchSiftrs({
      search: props.search,
      count: 10
    }, withSuccess(function(games) {
      props.auth.searchSiftrs({
        siftr_url: props.search
      }, withSuccess(function(url_games) {
        if (url_games.length > 0) {
          games = games.filter((game) => game.game_id !== url_games[0].game_id);
        }
        cb(url_games.concat(games));
      }));
    }));
  }
});

export const BrowserSearchPane = createClass({
  displayName: 'BrowserSearchPane',
  getInitialState: function() {
    return {
      search: ''
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    // onSelect and onInfo are function-wrapped
    return this.props.auth !== nextProps.auth ||
      this.state.search !== nextState.search ||
      this.props.cardMode !== nextProps.cardMode;
  },
  render: function() {
    return (
      <View style={{
        flex: 1
      }}>
        <View style={{
          backgroundColor: 'rgb(244,244,244)',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <TextInput style={{
            height: 40,
            padding: 10,
            flex: 1,
          }} placeholder="Enter search term or siftr code:" autoCapitalize="none" autoCorrect={true} autoFocus={false} onChangeText={(search) => {
            this.setState({
              search: search
            });
          }} />
          <Image
            source={require('../web/assets/img/icon-search.png')}
            style={{
              width: 17,
              height: 16,
              margin: 10,
            }}
          />
        </View>
        <BrowserSearch auth={this.props.auth} onSelect={(...args) => {
          this.props.onSelect(...args);
        }} onInfo={(...args) => {
          this.props.onInfo(...args);
        }} search={this.state.search} cardMode={this.props.cardMode} online={this.props.online} />
      </View>
    );
  }
});

export class ExplorePane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <View style={{
        margin: 8,
      }}>
        <View style={{marginLeft: 13}}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'League Spartan',
          }}>
            {this.props.title}
          </Text>
          <Text style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: 'rgb(174,186,196)',
          }}>
            {this.props.description}
          </Text>
        </View>
        <ScrollView horizontal={true}>
          {
            (this.props.games || []).map((game, i) =>
              <NativeCard
                key={game.game_id}
                game={game}
                onSelect={this.props.onSelect}
                onInfo={this.props.onInfo}
                cardMode="square"
                auth={this.props.auth}
                online={this.props.online}
                theme={this.props.themes[game.theme_id || 1]}
              />
            )
          }
        </ScrollView>
      </View>
    );
  }
}

export const BrowserMine = makeBrowser(function(props, cb) {
  cb(props.mine);
});

export const BrowserFollowed = makeBrowser(function(props, cb) {
  if (props.followed == null) {
    cb(props.followed);
    return;
  }
  const recent = props.recent || [];
  const followed = props.followed.slice(0);
  followed.sort((x, y) => {
    const xi = recent.indexOf(x.game_id);
    const yi = recent.indexOf(y.game_id);
    if (xi !== -1 && yi !== -1) {
      return xi - yi;
    } else if (xi !== -1) {
      return -1;
    } else if (yi !== -1) {
      return 1;
    } else {
      return x.game_id - y.game_id;
    }
  });
  cb(followed);
});

export const BrowserDownloaded = makeBrowser(function(props, cb) {
  const siftrsDir = `${RNFS.DocumentDirectoryPath}/siftrs`;
  RNFS.exists(siftrsDir).then(function(dirExists) {
    if (dirExists) {
      RNFS.readDir(siftrsDir).then(function(files) {
        var proms;
        proms = mapMaybe(files, (f) => {
          var game_id;
          game_id = parseInt(f.name);
          if (game_id && f.isDirectory()) {
            return RNFS.readFile(`${siftrsDir}/${game_id}/game.txt`);
          } else {
            return null;
          }
        });
        Promise.all(proms).then(function(games) {
          cb(games.map((game) => deserializeGame(JSON.parse(game))));
        });
      });
    } else {
      cb([]);
    }
  });
});

export const BrowserFeatured = makeBrowser(function(props, cb) {
  props.auth.getStaffPicks({}, withSuccess(function(games) {
    cb(games.filter((game) => game.is_siftr));
  }));
});

export const BrowserPopular = makeBrowser(function(props, cb) {
  props.auth.searchSiftrs({
    count: 20, // TODO infinite scroll
    offset: 0,
    order_by: 'popular'
  }, withSuccess(cb));
});

export const BrowserNearMe = makeBrowser(function(props, cb) {
  Permissions.request('location').then(response => {
    if (response === 'authorized') {
      navigator.geolocation.getCurrentPosition(function(res) {
        props.auth.getNearbyGamesForPlayer({
          latitude: res.coords.latitude,
          longitude: res.coords.longitude,
          filter: 'siftr'
        }, withSuccess(cb));
      });
    }
  });
});
