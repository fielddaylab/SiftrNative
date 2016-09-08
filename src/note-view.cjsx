'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
, TouchableOpacity
} = require 'react-native'
# @endif

{ Note
} = require './aris'

{clicker} = require './utils'

SiftrNoteView = React.createClass
  propTypes:
    note: T.instanceOf(Note).isRequired
    onClose: T.func

  getDefaultProps: ->
    onClose: (->)

  # @ifdef NATIVE
  render: ->
    <View>
      <Text>{@props.note.description}</Text>
      <TouchableOpacity onPress={@props.onClose}>
        <Text>Close Note</Text>
      </TouchableOpacity>
    </View>
  # @endif

  # @ifdef WEB
  render: ->
    <div>
      <p>{@props.note.description}</p>
      <a href="#" onClick={clicker @props.onClose}>Close Note</a>
    </div>
  # @endif

exports.SiftrNoteView = SiftrNoteView
