'use strict'

React = require 'react'
T = React.PropTypes
update = require 'immutability-helper'

# @ifdef NATIVE
{ TouchableOpacity
, View
, Text
, ScrollView
, StyleSheet
} = require 'react-native'
{styles} = require './styles'
# @endif

{ Auth
, Tag
, Game
} = require './aris'

{TimeSlider} = require './time-slider'
{clicker} = require './utils'

SearchNotes = React.createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    game: T.instanceOf(Game).isRequired
    tags: T.arrayOf(T.instanceOf Tag)
    searchParams: T.any
    onSearch: T.func
    getColor: T.func

  getDefaultProps: ->
    tags: []
    searchParams: {}
    onSearch: (->)
    getColor: -> 'black'

  clickRecent: ->
    @props.onSearch update @props.searchParams,
      sort: $set: 'recent'

  clickPopular: ->
    @props.onSearch update @props.searchParams,
      sort: $set: 'popular'

  clickMine: ->
    @props.onSearch update @props.searchParams,
      mine: $set: not @props.searchParams.mine

  clickTag: (tag) ->
    @props.onSearch update @props.searchParams,
      tags: $apply: (tag_ids) =>
        tag_ids ?= []
        if tag.tag_id in tag_ids
          tag_ids.filter (tag_id) => tag_id isnt tag.tag_id
        else
          tag_ids.concat tag.tag_id

  changeDates: (min_time, max_time) ->
    @props.onSearch update @props.searchParams,
      min_time: $set: min_time
      max_time: $set: max_time

  userTyped: ->
    clearTimeout(@timer) if @timer
    @timer = setTimeout =>
      @props.onSearch update @props.searchParams,
        text: $set: @refs.text.value
    , 250

  # @ifdef NATIVE
  render: ->
    {sort, mine, tags, text, min_time, max_time} = @props.searchParams
    sort ?= 'recent'
    mine ?= false
    tags ?= []
    text ?= ''
    min_time ?= 'min'
    max_time ?= 'max'
    activityOn =
      flex: 1
      justifyContent: 'center'
      alignItems: 'center'
      flexDirection: 'row'
      padding: 10
      backgroundColor: 'rgb(32,37,49)'
      borderColor: 'rgb(32,37,49)'
      borderWidth: StyleSheet.hairlineWidth
    activityOff =
      flex: 1
      justifyContent: 'center'
      alignItems: 'center'
      flexDirection: 'row'
      padding: 10
      backgroundColor: 'white'
      borderColor: 'rgb(32,37,49)'
      borderWidth: StyleSheet.hairlineWidth
    activityTextOn =
      color: 'white'
    activityTextOff =
      color: 'rgb(32,37,49)'
    <ScrollView style={
      backgroundColor: 'white'
      position: 'absolute'
      top: 0
      bottom: 0
      left: 0
      right: 0
    } contentContainerStyle={
      alignItems: 'center'
    }>
      <View style={
        alignSelf: 'stretch'
        flexDirection: 'row'
        margin: 10
      }>
        <TouchableOpacity onPress={@clickRecent} style={flex: 1}>
          <View style={
            [
              if sort is 'recent' then activityOn else activityOff
              {borderTopLeftRadius: 12, borderBottomLeftRadius: 12}
            ]
          }>
            <Text style={
              if sort is 'recent' then activityTextOn else activityTextOff
            }>newest</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={@clickPopular} style={flex: 1}>
          <View style={
            [
              if sort is 'popular' then activityOn else activityOff
              {borderTopRightRadius: 12, borderBottomRightRadius: 12} unless @props.auth.authToken?
            ]
          }>
            <Text style={
              if sort is 'popular' then activityTextOn else activityTextOff
            }>popular</Text>
          </View>
        </TouchableOpacity>
        {
          if @props.auth.authToken?
            <TouchableOpacity onPress={@clickMine} style={flex: 1}>
              <View style={
                [
                  if mine then activityOn else activityOff
                  {borderTopRightRadius: 12, borderBottomRightRadius: 12}
                ]
              }>
                <Text style={
                  if mine then activityTextOn else activityTextOff
                }>mine</Text>
              </View>
            </TouchableOpacity>
        }
      </View>
    </ScrollView>
  # @endif

  # @ifdef WEB
  render: ->
    {sort, mine, tags, text, min_time, max_time} = @props.searchParams
    sort ?= 'recent'
    mine ?= false
    tags ?= []
    text ?= ''
    min_time ?= 'min'
    max_time ?= 'max'
    <div className="siftr-search">
      <p>
        <input type="text" ref="text"
          placeholder="Search…"
          defaultValue={text}
          onChange={@userTyped}
          className="search-text"
        />
      </p>
      <hr />
      <h2>BY DATE:</h2>
      <TimeSlider
        minBound={@props.game.created.getTime()}
        maxBound={Date.now()}
        p1={min_time}
        p2={max_time}
        onChange={@changeDates}
      />
      <hr />
      <h2>BY ACTIVITY:</h2>
      <div className="activity-buttons">
        <a href="#"
          className={"activity-button #{if sort is 'recent' then 'activity-on' else ''}"}
          onClick={clicker @clickRecent}
        >
          newest
        </a>
        <a href="#"
          className={"activity-button #{if sort is 'popular' then 'activity-on' else ''}"}
          onClick={clicker @clickPopular}
        >
          popular
        </a>
        {
          if @props.auth.authToken?
            <a href="#"
              className={"activity-button #{if mine then 'activity-on' else ''}"}
              onClick={clicker @clickMine}
            >
              mine
            </a>
        }
      </div>
      <hr />
      <h2>BY CATEGORY:</h2>
      {
        <p>
          {
            @props.tags.map (tag) =>
              checked = tag.tag_id in tags
              color = @props.getColor tag
              <a href="#" key={tag.tag_id}
                onClick={clicker => @clickTag tag}
                className={"search-tag #{if checked then 'search-tag-on' else ''}"}
                style={
                  borderColor: color
                  color: if checked then undefined else color
                  backgroundColor: if checked then color else undefined
                }
              >
                { if checked then "✓ #{tag.tag}" else "● #{tag.tag}" }
              </a>
          }
        </p>
      }
    </div>
  # @endif

exports.SearchNotes = SearchNotes
