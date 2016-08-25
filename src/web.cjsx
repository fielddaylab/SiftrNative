{SiftrNative} = require './app'
React = require 'react'
ReactDOM = require 'react-dom'
document.addEventListener 'DOMContentLoaded', ->
  ReactDOM.render React.createElement(SiftrNative), document.getElementById('app-container')
