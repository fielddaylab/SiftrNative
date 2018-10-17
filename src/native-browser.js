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

const mapMaybe = (xs, f) => {
  return xs.map(f).filter((x) => x != null);
};

const NativeCard = createClass({
  displayName: 'NativeCard',
  getInitialState: function() {
    return {
      contributors: null,
      posts: null,
      photos: null,
      authors: null
    };
  },
  getDefaultProps: function() {
    return {
      onSelect: (function() {}),
      onInfo: (function() {}),
      cardMode: 'full'
    };
  },
  componentWillMount: function() {
    this.isMounted = true;
    const useNotes = (notes) => {
      if (!this.isMounted) {
        return;
      }
      return this.setState({
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
          var comment, i, j, len, len1, note, ref, user_ids;
          user_ids = {};
          for (i = 0, len = notes.length; i < len; i++) {
            note = notes[i];
            user_ids[note.user.user_id] = true;
            ref = note.comments;
            for (j = 0, len1 = ref.length; j < len1; j++) {
              comment = ref[j];
              user_ids[comment.user.user_id] = true;
            }
          }
          return Object.keys(user_ids).length;
        })()
      });
    };
    if (this.props.online) {
      this.props.auth.getUsersForGame({
        game_id: this.props.game.game_id
      }, withSuccess((authors) => {
        if (!this.isMounted) return;
        this.setState({
          authors: authors.map((author) => author.display_name)
        });
      }));
      this.props.auth.searchNotes({
        game_id: this.props.game.game_id,
        order_by: 'recent'
      }, withSuccess(useNotes));
    } else {
      const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${this.props.game.game_id}`;
      return RNFS.readFile(`${siftrDir}/notes.txt`).then((json) => {
        const notes = JSON.parse(json).map((note) => deserializeNote(note));
        useNotes(notes);
      }).catch((err) => {
        return null; // whatever
      });
    }
  },
  componentWillUnmount: function() {
    this.isMounted = false;
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return this.props.cardMode !== nextProps.cardMode ||
      this.props.game !== nextProps.game ||
      this.state.authors !== nextState.authors ||
      this.state.photos !== nextState.photos ||
      this.state.contributors !== nextState.contributors ||
      this.state.posts !== nextState.posts;
  },
  render: function() {
    var ref, ref1, ref2, ref3, ref4, ref5;
    switch (this.props.cardMode) {
      case 'full':
        return (
          <TouchableOpacity onPress={(...args) => {
            this.props.onSelect(...args);
          }} style={{
            backgroundColor: 'white',
            margin: 12,
            marginBottom: 0,
            borderRadius: 12
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 10,
              alignItems: 'center'
            }}>
              <View>
                <Text style={{fontWeight: 'bold'}}>{this.props.game.name}</Text>
                <Text>{(ref = (ref1 = this.state.authors) != null ? ref1.join(', ') : void 0) != null ? ref : '…'}</Text>
              </View>
              <TouchableOpacity style={{
                padding: 10
              }} onPress={(...args) => {
                return this.props.onInfo(...args);
              }}>
                <Image source={require('../web/assets/img/icon-4dots.png')} style={{
                  width: 38 * 0.7,
                  height: 40 * 0.7,
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
                    return <CacheMedia key={note_id} url={url} withURL={(url) => {
                      return <Image source={url != null ? {
                        uri: url
                      } : void 0} style={{
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
              <View>
                <Text style={{fontWeight: 'bold'}}>{(ref2 = this.state.contributors) != null ? ref2 : '…'} contributors</Text>
                <Text>{(ref3 = this.state.posts) != null ? ref3 : '…'} posts</Text>
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
      case 'compact':
        return <TouchableOpacity onPress={(...args) => {
            this.props.onSelect(...args);
          }} style={{
            backgroundColor: 'white',
            margin: 12,
            marginBottom: 0,
            borderRadius: 12
          }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 10,
            alignItems: 'center'
          }}>
            <View style={{
            flex: 1
          }}>
              <Text>{this.props.game.name}</Text>
              <Text>{(ref4 = (ref5 = this.state.authors) != null ? ref5.join(', ') : void 0) != null ? ref4 : '…'}</Text>
            </View>
            <TouchableOpacity style={{
            padding: 10
          }} onPress={(...args) => {
            this.props.onInfo(...args);
          }}>
              <Image source={require('../web/assets/img/icon-4dots.png')} style={{
            width: 38 * 0.7,
            height: 40 * 0.7,
            resizeMode: 'contain'
          }} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>;
    }
  }
});

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
          backgroundColor: 'rgb(233,240,240)'
        }}>
          {this.props.games.map((game) =>
            <NativeCard key={game.game_id} cardMode={this.props.cardMode} game={game} onSelect={() => {
              this.props.onSelect(game);
            }} auth={this.props.auth} onInfo={() => {
              this.props.onInfo(game);
            }} online={this.props.online} />
          )}
          <View style={{height: 12}} />
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
        <TextInput style={{
          height: 40,
          borderWidth: 2,
          borderColor: 'gray',
          padding: 10
        }} placeholder="Search…" autoCapitalize="none" autoCorrect={true} autoFocus={false} onChangeText={(search) => {
          this.setState({
            search: search
          });
        }} />
        <BrowserSearch auth={this.props.auth} onSelect={(...args) => {
          this.props.onSelect(...args);
        }} onInfo={(...args) => {
          this.props.onInfo(...args);
        }} search={this.state.search} cardMode={this.props.cardMode} online={this.props.online} />
      </View>
    );
  }
});

export const BrowserMine = makeBrowser(function(props, cb) {
  cb(props.mine);
});

export const BrowserFollowed = makeBrowser(function(props, cb) {
  cb(props.followed);
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
  navigator.geolocation.getCurrentPosition(function(res) {
    props.auth.getNearbyGamesForPlayer({
      latitude: res.coords.latitude,
      longitude: res.coords.longitude,
      filter: 'siftr'
    }, withSuccess(cb));
  });
});
