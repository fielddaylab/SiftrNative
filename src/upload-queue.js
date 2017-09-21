'use strict';

import React from 'react';

const T = React.PropTypes;

import RNFS from 'react-native-fs';

import {Auth} from './aris';

import {Platform} from 'react-native';

export const UploadQueue = React.createClass({
  propTypes: {
    auth: T.instanceOf(Auth).isRequired,
    online: T.bool
  },
  getDefaultProps: function() {
    return {
      online: true
    };
  },
  componentDidMount: function() {
    this.mounted = true;
    return this.checkQueue();
  },
  componentWillUnmount: function() {
    return this.mounted = false;
  },
  checkQueue: function() {
    if (!this.mounted) {
      return;
    }
    return this.loadQueue().then((notes) => {
      if (notes.length === 0 || !this.props.online) {
        return null;
      } else {
        return this.uploadNote(notes[0]);
      }
    }).then(() => {
      return setTimeout(() => {
        return this.checkQueue();
      }, 3000);
    });
  },
  loadQueue: function() {
    const queueDir = `${RNFS.DocumentDirectoryPath}/siftrqueue`;
    return RNFS.exists(queueDir).then((dirExists) => {
      if (dirExists) {
        return RNFS.readDir(queueDir);
      } else {
        return [];
      }
    }).then((files) => {
      var dir, timestamp;
      return Promise.all((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = files.length; i < len; i++) {
          dir = files[i];
          timestamp = parseInt(dir.name);
          if (!(timestamp && dir.isDirectory())) {
            continue;
          }
          results.push(RNFS.readDir(dir.path).then((entries) => {
            return {dir, entries};
          }));
        }
        return results;
      }).call(this));
    }).then((listedDirs) => {
      var dir, entries;
      return Promise.all((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = listedDirs.length; i < len; i++) {
          ({dir, entries} = listedDirs[i]);
          if (!entries.some((ent) => {
            return ent.name === 'createNote.json';
          })) {
            continue;
          }
          results.push(RNFS.readFile(`${dir.path}/createNote.json`).then((json) => {
            return {dir, json};
          }));
        }
        return results;
      }).call(this));
    });
  },
  uploadNote: function({dir, json}) {
    json = JSON.parse(json);
    const file = {
      uri: Platform.OS === 'ios' ? `${dir.path}/${json.filename}` : `file://${dir.path}/${json.filename}`,
      type: json.mimetype,
      name: json.filename
    };
    return this.props.auth.promise('rawUpload', file, (function() {})).then((raw_upload_id) => {
      return this.props.auth.promise('call', 'media.createMediaFromRawUpload', {
        file_name: json.filename,
        raw_upload_id: raw_upload_id,
        game_id: json.game_id,
        resize: 800
      });
    }).then((media) => {
      json.media_id = media.media_id;
      return this.props.auth.promise('call', 'notes.createNote', json);
    }).then((note) => {
      return RNFS.unlink(dir.path);
    }).catch((err) => {
      return console.warn(err);
    });
  },
  render: function() {
    return this.props.children;
  }
});
