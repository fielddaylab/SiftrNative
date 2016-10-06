'use strict'

React = require 'react'
T = React.PropTypes

{ Note
} = require './aris'

{clicker} = require './utils'

# @ifdef NATIVE
{ ScrollView
, View
, Text
, TouchableOpacity
, Image
} = require 'react-native'
# @endif

SiftrThumbnails = React.createClass
  propTypes:
    notes: T.arrayOf T.instanceOf Note
    canLoadMore: T.bool
    getColor: T.func
    onSelectNote: T.func
    onLoadMore: T.func

  getDefaultProps: ->
    notes: []
    canLoadMore: false
    getColor: -> 'white'
    onSelectNote: (->)
    onLoadMore: (->)

  # @ifdef NATIVE
  render: ->
    <ScrollView style={
      backgroundColor: 'white'
      position: 'absolute'
      top: 0
      bottom: 0
      left: 0
      right: 0
    }>
      <View style={
        flexDirection: 'row'
        flexWrap: 'wrap'
        alignItems: 'center'
        justifyContent: 'center'
        flex: 1
      }>
        {
          @props.notes.map (note) =>
            <TouchableOpacity onPress={=> @props.onSelectNote note} key={note.note_id}>
              <Image source={uri: note.thumb_url} style={
                width: 160
                height: 160
                margin: 5
              }>
                <View style={
                  position: 'absolute'
                  top: 5
                  right: 5
                  width: 15
                  height: 15
                  borderRadius: 999
                  backgroundColor: @props.getColor note.tag_id
                } />
              </Image>
            </TouchableOpacity>
        }
      </View>
    </ScrollView>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="siftr-thumbs">
      {
        @props.notes.map (note) =>
          <a
            key={note.note_id}
            href="#"
            onClick={clicker => @props.onSelectNote note}
          >
            <div
              className="siftr-thumbnail"
              style={backgroundImage: "url(#{note.thumb_url})"}
            >
              <div
                className="siftr-thumbnail-dot"
                style={backgroundColor: @props.getColor note.tag_id}
              />
            </div>
          </a>
      }
    </div>
  # @endif

exports.SiftrThumbnails = SiftrThumbnails
