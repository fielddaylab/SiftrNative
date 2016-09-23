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
      tags:
        if @props.tags.length
          parseInt input.value for input in form.tags when input.checked
        else
          @searchParams.tags # don't touch tags until they're loaded

  # @ifdef NATIVE
  render: ->
    null
  # @endif

  # @ifdef WEB
  render: ->
    {sort, mine, tags} = @props.searchParams
    sort ?= 'recent'
    mine ?= false
    tags ?= []
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
