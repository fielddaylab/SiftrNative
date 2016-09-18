'use strict'

React = require 'react'

# @ifdef NATIVE
{Text, View, TouchableOpacity} = require 'react-native'
# @endif

clicker = (fn) -> (e) ->
  e.preventDefault()
  fn e

withSuccess = (cb) -> (obj) ->
  if obj.returnCode is 0
    cb obj.data
  else
    console.warn JSON.stringify obj

# hacks for stubbing out the dual interface

# @ifdef NATIVE
P = Text
DIV = View
UL = View
LI = View
BUTTON = React.createClass
  render: ->
    <TouchableOpacity onPress={@props.onClick}>
      {@props.children}
    </TouchableOpacity>
# @endif
# @ifdef WEB
P = 'p'
DIV = 'div'
UL = 'ul'
LI = 'li'
BUTTON = React.createClass
  render: ->
    <a href="#" onClick={clicker @props.onClick}>
      {@props.children}
    </a>
# @endif

exports.clicker = clicker
exports.withSuccess = withSuccess
exports.P = P
exports.DIV = DIV
exports.UL = UL
exports.LI = LI
exports.BUTTON = BUTTON
