'use strict'

React = require 'react'
T = React.PropTypes

{ Note
} = require './aris'

{clicker} = require './utils'

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
    null # TODO
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
