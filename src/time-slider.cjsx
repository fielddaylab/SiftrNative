'use strict'

React = require 'react'
T = React.PropTypes

nubType = T.oneOfType([T.number, T.oneOf(['min', 'max'])])
showDate = (n) ->
  if typeof n is 'string'
    n
  else
    new Date(n).toLocaleString()

TimeSliderNub = React.createClass
  propTypes:
    fraction: T.number.isRequired
    getSlider: T.func.isRequired
    onChange: T.func
    onPointerEnd: T.func

  getDefaultProps: ->
    onChange: (->)
    onPointerEnd: (->)

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  pointerDown: (inputType) -> (event) =>
    return if @dragListener?
    @dragListener = (e) =>
      rect = @props.getSlider().getBoundingClientRect()
      x = switch inputType
        when 'mouse' then e.clientX
        when 'touch' then e.touches[0].clientX
      fraction = (x - (rect.left + 10)) / (rect.width - 20)
      fraction = Math.max(0, Math.min(1, fraction))
      @props.onChange fraction
    move = "#{inputType}move"
    window.addEventListener move, @dragListener
    end = switch inputType
      when 'mouse' then 'mouseup'
      when 'touch' then 'touchend'
    window.addEventListener end, =>
      if @dragListener?
        window.removeEventListener move, @dragListener
        delete @dragListener
        @props.onPointerEnd()

  render: ->
    <div
      className="time-slider-nub"
      style={
        left: "calc((100% - 20px) * #{@props.fraction})"
      }
      onMouseDown={@pointerDown 'mouse'}
      onTouchStart={@pointerDown 'touch'}
    />
  # @endif

TimeSlider = React.createClass
  propTypes:
    minBound: T.number.isRequired
    maxBound: T.number.isRequired
    p1: nubType.isRequired
    p2: nubType.isRequired
    onChange: T.func

  getDefaultProps: ->
    onChange: (->)

  componentWillMount: ->
    @setState
      p1: @props.p1
      p2: @props.p2

  getFrac: (time) ->
    if time is 'min'
      0
    else if time is 'max'
      1
    else
      (time - @props.minBound) / (@props.maxBound - @props.minBound)

  fracToTime: (frac) ->
    if frac is 0
      'min'
    else if frac is 1
      'max'
    else
      @props.minBound + frac * (@props.maxBound - @props.minBound)

  doChange: ->
    flip =
      if      @state.p1 is 'min' then false
      else if @state.p2 is 'min' then true
      else if @state.p1 is 'max' then true
      else if @state.p2 is 'max' then false
      else                            @state.p1 > @state.p2
    if flip
      @props.onChange @state.p2, @state.p1
    else
      @props.onChange @state.p1, @state.p2

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  render: ->
    <div>
      <p>Date range: {showDate @state.p1}, {showDate @state.p2}</p>
      <div
        className="time-slider"
        ref="timeSlider"
      >
        <TimeSliderNub
          fraction={@getFrac @state.p1}
          getSlider={=> @refs.timeSlider}
          onChange={(frac) => @setState p1: @fracToTime frac}
          onPointerEnd={@doChange}
        />
        <TimeSliderNub
          fraction={@getFrac @state.p2}
          getSlider={=> @refs.timeSlider}
          onChange={(frac) => @setState p2: @fracToTime frac}
          onPointerEnd={@doChange}
        />
      </div>
    </div>
  # @endif

timeToARIS = (time) ->
  if typeof time is 'number'
    # ISO string is in format "yyyy-mm-ddThh:mm:ss.sssZ"
    # we change it into "yyyy-mm-dd hh:mm:ss" for the ARIS SQL format
    new Date(time).toISOString().replace('T', ' ').replace(/\.\d\d\dZ$/, '')

exports.TimeSlider = TimeSlider
exports.timeToARIS = timeToARIS
