'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Switch
, View
, Text
} = require 'react-native'
{styles} = require './styles'
# @endif

{ Auth
, Tag
, Game
} = require './aris'

{TimeSlider} = require './time-slider'

SearchNotes = React.createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    game: T.instanceOf(Game).isRequired
    tags: T.arrayOf(T.instanceOf Tag)
    searchParams: T.any
    onSearch: T.func

  getDefaultProps: ->
    tags: []
    searchParams: {}
    onSearch: (->)

  # @ifdef NATIVE
  doSearch: (obj) ->
    @props.onSearch
      sort: obj.sort ? @props.searchParams.sort
      mine: obj.mine ? @props.searchParams.mine
  # @endif

  # @ifdef WEB
  doSearch: ->
    form = @refs.searchForm
    @props.onSearch
      sort: (input.value for input in form.sort when input.checked)[0]
      mine: @refs.mine.checked
      text: @refs.text.value
      tags:
        if @props.tags.length
          parseInt input.value for input in form.tags when input.checked
        else
          @props.searchParams.tags # don't touch tags until they're loaded
      min_time: @min_time ? @props.searchParams.min_time
      max_time: @max_time ? @props.searchParams.max_time
  # @endif

  userTyped: ->
    clearTimeout(@timer) if @timer
    @timer = setTimeout =>
      @doSearch()
    , 250

  render: ->
    {sort, mine, tags, text, min_time, max_time} = @props.searchParams
    sort ?= 'recent'
    mine ?= false
    tags ?= []
    text ?= ''
    # @ifdef NATIVE
    <View>
      <View style={styles.horizontal}>
        <Switch value={sort is 'recent'} onValueChange={(b) => @doSearch sort: if b then 'recent' else 'popular'} />
        <Text>Recent</Text>
      </View>
      <View style={styles.horizontal}>
        <Switch value={sort is 'popular'} onValueChange={(b) => @doSearch sort: if b then 'popular' else 'recent'} />
        <Text>Popular</Text>
      </View>
      <View style={styles.horizontal}>
        <Switch value={mine} onValueChange={(b) => @doSearch mine: b} />
        <Text>My Notes</Text>
      </View>
    </View>
    # @endif
    # @ifdef WEB
    <form ref="searchForm" onSubmit={(e) => e.preventDefault()}>
      <p>
        <input type="text" ref="text"
          placeholder="Search notes..."
          defaultValue={text}
          onChange={@userTyped}
        />
      </p>
      <TimeSlider
        minBound={@props.game.created.getTime()}
        maxBound={Date.now()}
        p1={min_time ? 'min'}
        p2={max_time ? 'max'}
        onChange={(min_time, max_time) =>
          @min_time = min_time
          @max_time = max_time
          @doSearch()
        }
      />
      <label>
        <p>
          <input type="radio" name="sort" value="recent" onChange={@doSearch} checked={sort is 'recent'} /> Recent
        </p>
      </label>
      <label>
        <p>
          <input type="radio" name="sort" value="popular" onChange={@doSearch} checked={sort is 'popular'} /> Popular
        </p>
      </label>
      <label>
        <p>
          <input type="checkbox" ref="mine" onChange={@doSearch} checked={mine} /> My Notes
        </p>
      </label>
      {
        <p>
          {
            @props.tags.map (tag) =>
              <label key={tag.tag_id}>
                <input type="checkbox" name="tags" value={tag.tag_id}
                  checked={tag.tag_id in tags}
                  onChange={@doSearch}
                />
                { tag.tag }
              </label>
          }
        </p>
      }
    </form>
    # @endif

exports.SearchNotes = SearchNotes
