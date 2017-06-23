'use strict'

React = require 'react'
T = React.PropTypes
RNFS = require 'react-native-fs'

UploadQueue = React.createClass
  propTypes: {}

  componentWillMount: ->
    @loadQueue()

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
          continue unless 'createNote.json' in entries
          dir
      )

  render: ->
    null

exports.UploadQueue = UploadQueue
