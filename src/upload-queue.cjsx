'use strict'

React = require 'react'
T = React.PropTypes
RNFS = require 'react-native-fs'
{ Auth
} = require './aris'
{ Platform
} = require 'react-native'

UploadQueue = React.createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    online: T.bool

  getDefaultProps: ->
    online: true

  componentDidMount: ->
    @mounted = true
    @checkQueue()

  componentWillUnmount: ->
    @mounted = false

  checkQueue: ->
    return unless @mounted
    @loadQueue()
    .then (notes) =>
      if notes.length is 0 or not @props.online
        null
      else
        @uploadNote notes[0]
    .then =>
      setTimeout =>
        @checkQueue()
      , 3000

  loadQueue: ->
    queueDir = "#{RNFS.DocumentDirectoryPath}/siftrqueue"
    RNFS.exists(queueDir)
    .then (dirExists) =>
      if dirExists
        RNFS.readDir queueDir
      else
        []
    .then (files) =>
      Promise.all(
        for dir in files
          timestamp = parseInt dir.name
          continue unless timestamp and dir.isDirectory()
          RNFS.readDir(dir.path).then (entries) => {dir, entries}
      )
    .then (listedDirs) =>
      Promise.all(
        for {dir, entries} in listedDirs
          continue unless entries.some (ent) => ent.name is 'createNote.json'
          RNFS.readFile("#{dir.path}/createNote.json")
          .then (json) => {dir, json}
      )

  uploadNote: ({dir, json}) ->
    json = JSON.parse json
    file =
      uri:
        if Platform.OS is 'ios'
          "#{dir.path}/#{json.filename}"
        else
          "file://#{dir.path}/#{json.filename}"
      type: json.mimetype
      name: json.filename
    @props.auth.promise('rawUpload', file, (->))
    .then (raw_upload_id) =>
      @props.auth.promise 'call', 'media.createMediaFromRawUpload',
        file_name: json.filename
        raw_upload_id: raw_upload_id
        game_id: json.game_id
        resize: 800
    .then (media) =>
      json.media_id = media.media_id
      @props.auth.promise 'call', 'notes.createNote', json
    .then (note) =>
      RNFS.unlink dir.path
    .catch (err) => console.warn err

  render: ->
    @props.children

exports.UploadQueue = UploadQueue
