'use strict'

React = require 'react'
T = React.PropTypes

{ Note
} = require './aris'

{clicker} = require './utils'

# @ifdef NATIVE
{ View
, Text
, TouchableOpacity
, Image
} = require 'react-native'
{default: InfiniteScrollView} = require 'react-native-infinite-scroll-view'
# @endif

# @ifdef WEB
InfiniteScroll = require 'react-infinite-scroller'
# @endif

SiftrThumbnails = React.createClass
  propTypes:
    notes: T.arrayOf T.instanceOf Note
    getColor: T.func
    onSelectNote: T.func
    loadMore: T.func
    hasMore: T.bool

  getDefaultProps: ->
    notes: []
    getColor: -> 'white'
    onSelectNote: (->)
    loadMore: (->)
    hasMore: false

  # @ifdef NATIVE
  scrollTop: ->
    @refs.scroll?.scrollTo y: 0, animated: false

  render: ->
    <InfiniteScrollView
      ref="scroll"
      style={
        backgroundColor: 'white'
        position: 'absolute'
        top: 0
        bottom: 0
        left: 0
        right: 0
      }
      canLoadMore={@props.hasMore}
      onLoadMoreAsync={@props.loadMore}
    >
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
    </InfiniteScrollView>
  # @endif

  # @ifdef WEB
  scrollTop: ->
    @refs.scroll?.scrollTop = 0

  render: ->
    <div className="siftr-thumbs" ref="scroll">
      <InfiniteScroll
        hasMore={@props.hasMore}
        loadMore={@props.loadMore}
        useWindow={false}
        initialLoad={false}
      >
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
      </InfiniteScroll>
    </div>
  # @endif

exports.SiftrThumbnails = SiftrThumbnails
