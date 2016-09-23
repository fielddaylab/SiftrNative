'use strict'

React = require 'react'
T = React.PropTypes

{ Auth
, Tag
} = require './aris'

SearchNotes = React.createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    tags: T.arrayOf(T.instanceOf Tag)
    searchParams: T.any
    onSearch: T.func

  getDefaultProps: ->
    tags: []
    searchParams: {}
    onSearch: (->)

  doSearch: ->
    form = @refs.searchForm
    @props.onSearch
      sort: (input.value for input in form.sort when input.checked)[0]
      mine: form.mine.checked

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  render: ->
    {sort, mine} = @props.searchParams
    sort ?= 'recent'
    mine ?= false
    <form ref="searchForm">
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
          <input type="checkbox" name="mine" onChange={@doSearch} checked={mine} /> My Notes
        </p>
      </label>
    </form>
  # @endif

exports.SearchNotes = SearchNotes
