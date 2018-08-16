'use strict'

import React from 'react'
import T from 'prop-types'
import update from 'immutability-helper'
import { Map, Set } from 'immutable'
import createClass from 'create-react-class'

EXIF = require 'exif-js'

import {ToggleSwitch} from './toggle';

import {Auth, Game, Tag, Field, FieldData} from './aris'
import {clicker, withSuccess} from './utils'
import {uploadImages} from './photos'

CreatePhotoBox = createClass
  displayName: 'CreatePhotoBox'
  getDefaultProps: ->
    onChooseFile: (->)
    file: null
    orientation: null
    header: 'Main image'
    required: true

  getInitialState: ->
    highlight: false

  render: ->
    stop = (ev) =>
      ev.stopPropagation()
      ev.preventDefault()
    <div>
      <form className="file-form">
        <input ref="fileInput" type="file" name="raw_upload"
          onChange={=>
            files = @refs.fileInput?.files
            if files? and files.length > 0
              @props.onChooseFile files[0]
          }
        />
      </form>
      <a href="#"
        onClick={clicker => @refs.fileInput.click()}
        className={"photo-drop #{if @state.highlight then 'photo-drop-highlight' else ''}"}
        onDragEnter={(ev) =>
          stop ev
          @setState highlight: true
        }
        onDragExit={(ev) =>
          stop ev
          @setState highlight: false
        }
        onDragOver={stop}
        onDrop={(ev) =>
          stop ev
          @setState highlight: false
          files = ev.dataTransfer.files
          if files.length > 0
            @props.onChooseFile files[0]
        }
      >
        {
          if @props.file?
            <div
              className={"upload-preview exif-#{@props.orientation}"}
              style={backgroundImage: "url(#{URL.createObjectURL @props.file})"}
            />
          else
            <div
              className="upload-preview no-image"
              style={backgroundImage: "url(assets/img/icon-cloud-upload.png)"}
            />
        }
        <div>
          <h3>{ @props.header }</h3>
          <h4>{ if @props.required then 'required*' else 'optional' }</h4>
        </div>
      </a>
    </div>

# Step 1: Upload
export CreateStep1 = createClass
  displayName: 'CreateStep1'
  propTypes:
    onCancel: T.func
    onStartUpload: T.func
    onProgress: T.func
    onCreateMedia: T.func
    auth: T.instanceOf(Auth).isRequired
    game: T.instanceOf(Game).isRequired
    fields: T.arrayOf(T.instanceOf Field)

  getDefaultProps: ->
    onCancel: (->)
    onStartUpload: (->)
    onProgress: (->)
    onCreateMedia: (->)

  getInitialState: ->
    file: null # file that has EXIF tags already loaded
    extraFiles: Map()

  filesReady: ->
    return unless @state.file?
    files = []
    files.push {field_id: null, file: @state.file}
    for field in @props.fields
      continue unless field.field_type is 'MEDIA'
      file = @state.extraFiles.get(field.field_id, null)
      if field.required and not file?
        return null
      files.push
        field_id: field.field_id
        file: file
    files

  beginUpload: ->
    files = @filesReady()
    return unless files?
    updateProgress = @props.onProgress
    uploadImages files.map(({file}) => file), @props.auth, @props.game, updateProgress, (results) =>
      fieldMedia = []
      for {field_id}, i in files
        continue if i is 0
        if results[i]?
          {media} = results[i]
          fieldMedia.push {field_id: field_id, media_id: media.media_id}
      @props.onCreateMedia results[0], fieldMedia
    @props.onStartUpload()

  getEXIF: (field_id, file) ->
    return unless file?
    EXIF.getData file, =>
      if field_id?
        @setState extraFiles: @state.extraFiles.set(field_id, file)
      else
        @setState {file}

  render: ->
    pictureSlots = []
    # main picture
    pictureSlots.push
      field_id: null
      currentImage: => @state.file
      header: 'Main image'
      required: true
    # other pictures
    for field in @props.fields.filter((field) => field.field_type is 'MEDIA')
      pictureSlots.push
        field_id: field.field_id
        currentImage: => @state.extraFiles.get(field.field_id, null)
        header: field.label
        required: field.required

    <div className="create-step-1">
      <div className="create-content">
        <h2>Drop photos into each section</h2>
        {
          pictureSlots.map ({field_id, currentImage, header, required}) =>
            img = currentImage()
            <CreatePhotoBox
              key={field_id}
              onChooseFile={(file) => @getEXIF(field_id, file)}
              file={img}
              orientation={if img? then EXIF.getTag(img, 'Orientation') else null}
              header={header}
              required={required}
            />
        }
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-gray" onClick={clicker @props.onCancel}>
          cancel
        </a>
        <a href="#" className="create-button-white" onClick={clicker @beginUpload}>
          next
        </a>
      </div>
    </div>

ProgressBar = createClass
  displayName: 'ProgressBar'
  render: ->
    if @props.progress?
      percent = Math.floor((@props.progress ? 0) * 100)
      <p className="create-progress-bar" style={
        background: "linear-gradient(to right, rgb(99,176,81) 0%,rgb(99,176,81) #{percent}%,rgb(185,220,176) #{percent}%,rgb(185,220,176) 100%)"
      }>
        {"uploading… (#{percent}%)"}
      </p>
    else
      null

# Step 2: Caption
export CreateStep2 = createClass
  displayName: 'CreateStep2'
  propTypes:
    onEnterCaption: T.func
    onBack: T.func
    onCancel: T.func
    note: T.any
    categories: T.arrayOf(T.instanceOf Tag).isRequired
    getColor: T.func
    progress: T.number

  getDefaultProps: ->
    onEnterCaption: (->)
    onBack: (->)
    onCancel: (->)
    getColor: (->)

  componentWillMount: ->
    @setState
      text: @props.note.caption
      category: @props.note.category ? @props.categories[0]

  doEnterCaption: ->
    text = @state.text
    unless text.match(/\S/)
      alert 'Please enter a caption.'
      return
    @props.onEnterCaption
      text: text
      category: @state.category

  render: ->
    <div className="create-step-2">
      <ProgressBar progress={@props.progress} />
      <div className="create-content">
      <h2>Choose Tag</h2>
        <div className="create-select-parent">
          <div className="create-select-div">
            <select
              value={@state.category.tag_id}
              onChange={(event) =>
                tag_id = event.target.value
                tag = null
                for cat in @props.categories
                  if cat.tag_id is parseInt(tag_id)
                    tag = cat
                    break
                if tag?
                  @setState category: tag
              }
            >
              {
                @props.categories.map (cat) =>
                  <option value={cat.tag_id} key={cat.tag_id}>
                    {cat.tag}
                  </option>
              }
            </select>
          </div>
        </div>
        <textarea className="create-caption"
          value={@state.text}
          onChange={(e) => @setState text: e.target.value}
          placeholder="Enter a caption…"
        />
      </div>
      <div className="create-buttons">
        {
          if @props.note.note_id?
            <span />
          else
            <a href="#" className="create-button-gray" onClick={clicker @props.onBack}>
              back
            </a>
        }
        <a href="#" className="create-button-white" onClick={clicker @doEnterCaption}>
          next
        </a>
      </div>
    </div>

# Step 3: Location
export CreateStep3 = createClass
  displayName: 'CreateStep3'
  propTypes:
    onPickLocation: T.func
    onBack: T.func
    onCancel: T.func
    progress: T.number

  getDefaultProps: ->
    onPickLocation: (->)
    onBack: (->)
    onCancel: (->)

  render: ->
    # TODO show pin with the color from CreateStep2's category
    <div className="create-step-3-box">
      <div className="create-step-3-padding" />
      <div className="create-step-3-shadow">
        <div className="create-step-3-window">
        </div>
        <div className="create-step-3">
          <div className="create-content-center">
            <span>Pick Location</span>
          </div>
          <div className="create-buttons">
            <a href="#" className="create-button-gray" onClick={clicker @props.onBack}>
              back
            </a>
            <a href="#" className="create-button-white" onClick={clicker @props.onPickLocation}>
              next
            </a>
          </div>
        </div>
        <div className="siftr-map-note create-pin">
          <div className="siftr-map-note-shadow" />
          <div
            className="siftr-map-note-pin"
            style={backgroundColor: 'black'}
          />
        </div>
      </div>
    </div>

# Step 5: Form
export CreateStep5 = createClass
  displayName: 'CreateStep5'
  propTypes:
    onChangeData: T.func
    onFinish: T.func
    onBack: T.func
    onCancel: T.func
    fields: T.arrayOf(T.instanceOf Field)
    field_data: T.arrayOf(T.instanceOf FieldData)
    progress: T.number

  getDefaultProps: ->
    onChangeData: (->)
    onFinish: (->)
    onBack: (->)
    onCancel: (->)
    fields: []
    field_data: []

  finishForm: ->
    field_data = @props.field_data
    for field in @props.fields
      if field.field_type is 'SINGLESELECT'
        if field_data.some((data) => data.field_id is field.field_id)
        else
          field_data.push new FieldData {
            field_id: field.field_id
            field_option_id: field.options[0].field_option_id
          }
      else if field.required and field.field_type in ['TEXT', 'TEXTAREA']
        unless field_data.some((data) => data.field_id is field.field_id)
          alert "Please fill in the field: #{field.label}"
          return
    return if @props.progress?
    @props.onFinish field_data

  render: ->
    <div className="create-step-5">
      <ProgressBar progress={@props.progress} />
      <div className="create-content-center">
        {
          @props.fields.map (field) =>
            return null if field.field_type is 'MEDIA'
            <div key={field.field_id}>
              <div>
                <p className="create-field-label">
                  {
                    field.label + if field.required then '*' else ''
                  }
                </p>
              </div>
              {
                field_data = @props.field_data ? []
                onChangeData = (newData) => @props.onChangeData newData
                getText = =>
                  for data in field_data
                    if data.field_id is field.field_id
                      return data.field_data
                  ''
                setText = (event) =>
                  newData =
                    data for data in field_data when data.field_id isnt field.field_id
                  newData.push new FieldData {
                    field_id: field.field_id
                    field_data: event.target.value
                  }
                  onChangeData newData
                switch field.field_type
                  when 'TEXT'
                    <p>
                      <input
                        type="text"
                        value={getText()}
                        onChange={setText}
                        placeholder={field.label}
                      />
                    </p>
                  when 'TEXTAREA'
                    <p>
                      <textarea
                        value={getText()}
                        onChange={setText}
                        placeholder={field.label}
                      />
                    </p>
                  when 'SINGLESELECT'
                    <div className="create-select-parent">
                      <div className="create-select-div">
                        <select
                          value={do =>
                            for data in field_data
                              if data.field_id is field.field_id
                                return data.field_option_id
                            field.options[0].field_option_id
                          }
                          onChange={(event) =>
                            field_option_id = event.target.value
                            newData =
                              data for data in field_data when data.field_id isnt field.field_id
                            newData.push new FieldData {
                              field_id: field.field_id
                              field_option_id: field_option_id
                            }
                            onChangeData newData
                          }
                        >
                          {
                            field.options.map (option) =>
                              <option value={option.field_option_id} key={option.field_option_id}>
                                {option.option}
                              </option>
                          }
                        </select>
                      </div>
                    </div>
                  when 'MULTISELECT'
                    field.options.map (option) =>
                      selected = field_data.some (data) =>
                        data.field_id is field.field_id and data.field_option_id is option.field_option_id
                      <p className="create-multi-toggle" key={option.field_option_id}>
                        <ToggleSwitch
                          checked={selected}
                          onClick={(newSelected) =>
                            newData =
                              data for data in field_data when not (data.field_id is field.field_id and data.field_option_id is option.field_option_id)
                            if newSelected
                              newData.push new FieldData {
                                field_id: field.field_id
                                field_option_id: option.field_option_id
                              }
                            onChangeData newData
                          }
                        >
                          { option.option }
                        </ToggleSwitch>
                      </p>
                  else
                    <p>(not implemented yet)</p>
              }
            </div>
        }
      </div>
      <div className="create-buttons">
        <a href="#" className="create-button-gray" onClick={clicker @props.onBack}>
          back
        </a>
        <a href="#" className="create-button-blue" onClick={clicker => @finishForm()}>
          post!
        </a>
      </div>
    </div>
