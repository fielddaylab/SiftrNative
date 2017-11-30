'use strict';

import React from 'react';
import RNFS from 'react-native-fs';

import {Auth} from './aris';
import {withSuccess} from './utils';

const mediaDir = `${RNFS.DocumentDirectoryPath}/media`;

export class Media extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      localURL: null,
    };
  }

  componentWillMount() {
    const media_id = this.props.media_id;
    const info = mediaDir + '/' + media_id + '.txt';
    RNFS.exists(info).then((exists) => {
      if (exists) {
        RNFS.readFile(info, 'utf8').then((filename) => {
          this.props.onLoad(mediaDir + '/' + filename);
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
            this.props.onLoad(localURL);
          });
        }));
      }
    });
  }

  render() {
    return null;
  }
}
