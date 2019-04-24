'use strict';

// @ifdef NATIVE
import ImagePicker from 'react-native-image-picker';
import {Platform} from 'react-native';
// @endif
import {withSuccess} from './utils';
import EXIF from 'exif-js';

// @ifdef NATIVE

export function requestImage(onlyGallery, cb) {
  ImagePicker[onlyGallery ? 'launchImageLibrary' : 'showImagePicker']({
    mediaType: 'photo',
    noData: true,
    storageOptions: {cameraRoll: true},
  }, (result) => {
    if (result.didCancel) {
      cb(null);
    } else if (result == null || result.uri == null) {
      cb(null);
    } else {
      let mime, name;
      if (result.fileName != null && result.type != null) {
        // android (rest are ios)
        mime = result.type;
        name = result.fileName;
      } else if (result.uri.match(/\.jpe?g$/i)) {
        mime = 'image/jpeg';
        name = 'upload.jpg';
      } else if (result.uri.match(/\.png$/i)) {
        mime = 'image/png';
        name = 'upload.png';
      } else if (result.uri.match(/\.gif$/i)) {
        mime = 'image/gif';
        name = 'upload.gif';
      } else {
        cb(null);
        return;
      }
      cb({
        uri: (Platform.OS === 'ios' ? result.uri.replace('file://', '') : result.uri),
        isStatic: true,
        type: mime,
        name: name,
        location: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      });
    }
  });
}

// @endif

export function uploadImage(file, auth, game, updateProgress, cb) {
  // @ifdef WEB
  const ext = file.name.slice(file.name.indexOf('.') + 1);
  const name = `upload.${ext}`;
  // @endif
  // @ifdef NATIVE
  const name = file.name;
  // @endif
  updateProgress(0);
  auth.rawUpload(file, updateProgress, withSuccess((raw_upload_id) => {
    auth.call('media.createMediaFromRawUpload', {
      file_name: name,
      raw_upload_id: raw_upload_id,
      game_id: (game == null ? 0 : game.game_id),
      resize: 800,
    }, withSuccess((media) => {
      cb({
        media: media,
        // @ifdef WEB
        exif: EXIF.getAllTags(file),
        // @endif
        // @ifdef NATIVE
        exif: {},
        // @endif
      });
    }));
  }));
}

export function uploadImages(files, auth, game, updateProgress, cb) {
  let results = [];
  let noImage = files.filter((x) => x == null).length;
  let noImageDone = 0;
  updateProgress(0);
  function uploadIndex(i) {
    if (i === files.length) {
      cb(results);
    } else {
      if (files[i] == null) {
        results.push(null);
        noImageDone++;
        uploadIndex(i + 1);
      } else {
        uploadImage(files[i], auth, game, function(p){
          updateProgress((i + p - noImageDone) / (files.length - noImage));
        }, function(res){
          results.push(res);
          uploadIndex(i + 1);
        });
      }
    }
  }
  uploadIndex(0);
}
