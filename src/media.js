'use strict';

import React from 'react';
// @ifdef NATIVE
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
// @endif
import update from "immutability-helper";

import {Auth} from './aris';
import {withSuccess} from './utils';

// @ifdef NATIVE
const mediaDir = `${RNFS.DocumentDirectoryPath}/media`;
// @endif

// D. J. Bernstein hash function
function djb_hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = 33 * hash ^ str[i].charCodeAt(0);
  }
  return hash;
}

// @ifdef NATIVE
function loadMedia(props, cb) {
  const online = (props.online == null ? true : props.online);

  function loadFile(file) {
    if (Platform.OS === 'android') {
      cb({uri: 'file://' + file});
    } else {
      cb({uri: file});
    }
  }

  function offline() {
    cb(require('../web/assets/img/no-internet-media.png'));
  }

  function loadGeneral(hash, getURL) {
    const info = mediaDir + '/' + hash + '.txt';
    RNFS.exists(info).then((exists) => {
      if (exists) {
        RNFS.readFile(info, 'utf8').then((filename) => {
          loadFile(mediaDir + '/' + filename);
        });
      } else {
        getURL((url) => {
          if (online) {
            url = url.replace('http://', 'https://');
            let ext = url.split('.').pop().toLowerCase();
            if (ext.length > 4) {
              ext = 'png'; // hack for google maps static pngs, should do better
            }
            const localURL = mediaDir + '/' + hash + '.' + ext;
            RNFS.mkdir(mediaDir, {NSURLIsExcludedFromBackupKey: true}).then(() => {
              return RNFS.downloadFile({
                fromUrl: url,
                toFile: localURL,
              }).promise;
            }).then((result) => {
              return RNFS.writeFile(info, hash + '.' + ext, 'utf8');
            }).then(() => {
              loadFile(localURL);
            });
          } else {
            offline();
          }
        });
      }
    });
  }

  function loadURL(url) {
    if (url.match(/^http/)) {
      loadGeneral('img' + djb_hash(url), (cb) => { cb(url); });
    } else {
      loadFile(url);
    }
  }

  function loadMediaID(media_id, size = 'url') {
    loadGeneral(size + media_id, (useURL) => {
      if (online) {
        props.auth.call('media.getMedia', {
          media_id: media_id,
        }, withSuccess((media) => {
          useURL(media[size]);
        }));
      } else {
        offline();
      }
    });
  }

  if (props.url == null) {
    if (props.media_id) {
      loadMediaID(props.media_id, props.size);
    }
  } else {
    loadURL(props.url)
  }
}
// @endif

// @ifdef WEB
function loadMedia(props, cb) {
  if (props.url == null) {
    if (props.media_id) {
      props.auth.call('media.getMedia', {
        media_id: props.media_id,
      }, withSuccess((media) => {
        cb(media[props.size || 'url']);
      }));
    }
  } else {
    cb(props.url)
  }
}
// @endif

export class CacheMedia extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      localURL: undefined,
    };
  }

  componentWillMount() {
    this._isMounted = true;
    loadMedia(this.props, (res) => {
      if (!this._isMounted) return;
      this.setState({localURL: res});
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return this.props.withURL(this.state.localURL);
  }
}

export class CacheMedias extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      urls: new Array(props.medias.length),
    };
  }

  startLoad(media, i) {
    loadMedia(media, (res) => {
      if (!this._isMounted) return;
      this.setState((state) => update(state, {urls: {[i]: {$set: res}}}));
    });
  }

  componentWillMount() {
    this._isMounted = true;
    this.props.medias.forEach((media, i) => this.startLoad(media, i));
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // fire off loads for the newly added ones on the end
    this.props.medias.slice(prevProps.medias.length).forEach((media, i) => {
      this.startLoad(media, i + prevProps.medias.length);
    });
  }

  render() {
    return this.props.withURLs(this.state.urls);
  }
}
