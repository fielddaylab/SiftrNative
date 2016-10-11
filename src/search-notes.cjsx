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
, TextInput
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

  userTyped: (text) ->
    clearTimeout(@timer) if @timer
    @timer = setTimeout =>
      @props.onSearch update @props.searchParams,
        text: $set: text
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
      borderWidth: 1
    activityOff =
      flex: 1
      justifyContent: 'center'
      alignItems: 'center'
      flexDirection: 'row'
      padding: 10
      backgroundColor: 'white'
      borderColor: 'rgb(32,37,49)'
      borderWidth: 1
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
      <TextInput
        placeholder="Search…"
        defaultValue={text}
        onChangeText={@userTyped}
        autoCapitalize="none"
        autoCorrect={false}
        style={
          alignSelf: 'stretch'
          height: 50
          borderColor: '#bbb'
          borderWidth: 1
          margin: 10
          padding: 10
          borderRadius: 25
        }
      />
      <View style={
        alignSelf: 'stretch'
        borderTopColor: 'black'
        borderTopWidth: 2
        paddingTop: 10
        paddingBottom: 5
        alignItems: 'center'
      }>
        <Text style={fontSize: 18, fontWeight: 'bold'}>BY DATE:</Text>
      </View>
      <TimeSlider
        minBound={@props.game.created.getTime()}
        maxBound={Date.now()}
        p1={min_time}
        p2={max_time}
        onChange={@changeDates}
      />
      <View style={
        alignSelf: 'stretch'
        borderTopColor: 'black'
        borderTopWidth: 2
        paddingTop: 10
        paddingBottom: 5
        alignItems: 'center'
        marginTop: 10
      }>
        <Text style={fontSize: 18, fontWeight: 'bold'}>BY ACTIVITY:</Text>
      </View>
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
      <View style={
        alignSelf: 'stretch'
        borderTopColor: 'black'
        borderTopWidth: 2
        paddingTop: 10
        paddingBottom: 5
        alignItems: 'center'
      }>
        <Text style={fontSize: 18, fontWeight: 'bold'}>BY CATEGORY:</Text>
      </View>
      <View style={
        alignSelf: 'stretch'
        flexDirection: 'row'
        flexWrap: 'wrap'
        alignItems: 'center'
        justifyContent: 'center'
        padding: 10
      }>
        {
          @props.tags.map (tag) =>
            checked = tag.tag_id in tags
            color = @props.getColor tag
            <TouchableOpacity key={tag.tag_id} onPress={=> @clickTag tag}>
              <View style={
                backgroundColor: if checked then color else 'white'
                borderColor: color
                borderWidth: 1
                padding: 3
                borderRadius: 3
                margin: 5
              }>
                <Text style={
                  color: if checked then 'white' else color
                  fontSize: 18
                }>
                  { if checked then "✓ #{tag.tag}" else "● #{tag.tag}" }
                </Text>
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
        <input type="text"
          placeholder="Search…"
          defaultValue={text}
          onChange={(e) => @userTyped e.target.value}
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
