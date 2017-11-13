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
      online: true,
      onMessage: function(){},
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
      if (notes.length === 0) {
        this.props.onMessage(null);
      } else {
        const count = notes.length + ' note' + (notes.length === 1 ? '' : 's');
        if (this.props.online) {
          this.props.onMessage('Uploading ' + count + '...');
        } else {
          this.props.onMessage(count + ' in upload queue');
        }
      }

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
    return Promise.all(
      json.files.map((f) => {
        const file = {
          uri: Platform.OS === 'ios' ? `${dir.path}/${f.filename}` : `file://${dir.path}/${f.filename}`,
          type: f.mimetype,
          name: f.filename
        };
        return this.props.auth.promise('rawUpload', file, (function() {})).then((raw_upload_id) => {
          return this.props.auth.promise('call', 'media.createMediaFromRawUpload', {
            file_name: f.filename,
            raw_upload_id: raw_upload_id,
            game_id: f.game_id,
            resize: 800,
          }).then((media) => {
            return {
              media_id: media.media_id,
              field_id: f.field_id,
            };
          });
        });
      })
    ).then((medias) => {
      medias.forEach((m) => {
        if (m.field_id === null) {
          json.media_id = m.media_id;
        } else {
          if (json.field_data === undefined) json.field_data = [];
          json.field_data.push({
            field_id: m.field_id,
            media_id: m.media_id,
          });
        }
      });
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
