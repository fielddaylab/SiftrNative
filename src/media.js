'use strict';

import React from 'react';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

import {Auth} from './aris';
import {withSuccess} from './utils';

const mediaDir = `${RNFS.DocumentDirectoryPath}/media`;

export class Media extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  loadFile(file) {
    if (Platform.OS === 'android') {
      this.props.onLoad('file://' + file);
    } else {
      this.props.onLoad(file);
    }
  }

  componentWillMount() {
    const media_id = this.props.media_id;
    const info = mediaDir + '/' + media_id + '.txt';
    RNFS.exists(info).then((exists) => {
      if (exists) {
        RNFS.readFile(info, 'utf8').then((filename) => {
          this.loadFile(mediaDir + '/' + filename);
        });
      } else {
        this.props.auth.call('media.getMedia', {
          media_id: this.props.media_id,
        }, withSuccess((media) => {
          const url = media.url.replace('http://', 'https://');
          const ext = url.split('.').pop();
          const localURL = mediaDir + '/' + media_id + '.' + ext;
          RNFS.mkdir(mediaDir, {NSURLIsExcludedFromBackupKey: true}).then(() => {
            return RNFS.downloadFile({
              fromUrl: url,
              toFile: localURL,
            }).promise;
          }).then((result) => {
            return RNFS.writeFile(info, media_id + '.' + ext, 'utf8');
          }).then(() => {
            this.loadFile(localURL);
          });
        }));
      }
    });
  }

  render() {
    return null;
  }
}

// D. J. Bernstein hash function
function djb_hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = 33 * hash ^ str[i].charCodeAt(0);
  }
  return hash;
}

export class CacheMedia extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      localURL: null,
    };
  }

  loadFile(file) {
    if (!this._isMounted) return;
    if (Platform.OS === 'android') {
      this.setState({localURL: 'file://' + file});
    } else {
      this.setState({localURL: file});
    }
  }

  componentWillMount() {
    this._isMounted = true;
    const url = this.props.url.replace('http://', 'https://');
    const hash = 'img' + djb_hash(url);
    const ext = url.split('.').pop();
    const info = mediaDir + '/' + hash + '.txt';
    RNFS.exists(info).then((exists) => {
      if (!this._isMounted) return;
      if (exists) {
        RNFS.readFile(info, 'utf8').then((filename) => {
          this.loadFile(mediaDir + '/' + filename);
        });
      } else {
        const localURL = mediaDir + '/' + hash + '.' + ext;
        RNFS.mkdir(mediaDir, {NSURLIsExcludedFromBackupKey: true}).then(() => {
          if (!this._isMounted) return;
          return RNFS.downloadFile({
            fromUrl: url,
            toFile: localURL,
          }).promise;
        }).then((result) => {
          if (!this._isMounted) return;
          return RNFS.writeFile(info, hash + '.' + ext, 'utf8');
        }).then(() => {
          this.loadFile(localURL);
        });
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return this.props.withURL(this.state.localURL);
  }
}
