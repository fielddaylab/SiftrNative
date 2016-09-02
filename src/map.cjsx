'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
MapView = require 'react-native-maps'
{styles} = require './styles'
# @endif

# @ifdef WEB
{default: GoogleMap} = require 'google-map-react'
{ConicGradient} = require './conic-gradient'
# @endif

{ Note
, Colors
} = require './aris'

# Cache of gradient PNG data URLs
allConicGradients = {}
getConicGradient = (opts) ->
  allConicGradients["#{opts.stops}_#{opts.size}"] ?= new ConicGradient(opts).png

MapCluster = React.createClass
  propTypes:
    cluster: T.any.isRequired
    lat: T.number.isRequired
    lng: T.number.isRequired
    getColor: T.func

  getDefaultProps: ->
    getColor: -> 'white'

  # @ifdef NATIVE
  render: ->
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title="Cluster"
      description="Tap to see the notes inside."
    />
  # @endif

  # @ifdef WEB
  render: ->
    width = 30
    stops = []
    percent = 0
    for tag_id, tag_count of @props.cluster.tags
      percent += (tag_count / @props.cluster.note_count) * 100
      color = @props.getColor tag_id
      stops.push "#{color} 1 #{percent}%"
      last_color = color
    stops.unshift "#{last_color} 1 0%"
    gradient = getConicGradient(stops: stops.join(', '), size: width)
    <div className="siftr-map-cluster" style={background: "url(#{gradient})"}>
      <span className="siftr-map-cluster-number">
        {@props.cluster.note_count}
      </span>
    </div>
  # @endif

MapNote = React.createClass
  propTypes:
    note: T.any.isRequired
    lat: T.number.isRequired
    lng: T.number.isRequired
    getColor: T.func

  getDefaultProps: ->
    getColor: -> 'white'

  # @ifdef NATIVE
  render: ->
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title="Note"
      description={@props.note.description}
    />
  # @endif

  # @ifdef WEB
  render: ->
    <div className="siftr-map-note">
      <div className="siftr-map-note-shadow" />
      <div
        className="siftr-map-note-pin"
        style={backgroundColor: @props.getColor @props.note.tag_id}
      />
    </div>
  # @endif

SiftrMap = React.createClass
  propTypes:
    center: T.any.isRequired
    # @ifdef NATIVE
    delta: T.any.isRequired
    # @endif
    # @ifdef WEB
    zoom: T.any.isRequired
    # @endif
    map_notes: T.arrayOf T.instanceOf Note
    map_clusters: T.array
    onMove: T.func
    onLayout: T.func
    getColor: T.func

  getDefaultProps: ->
    map_notes: []
    map_clusters: []
    onMove: (->)
    onLayout: (->)

  getInitialState: -> {}

  # @ifdef NATIVE
  moveMapNative: ({latitude, longitude, latitudeDelta, longitudeDelta}) ->
    @props.onMove
      center:
        lat: latitude
        lng: longitude
      delta:
        lat: latitudeDelta
        lng: longitudeDelta
      bounds:
        nw:
          lat: latitude + latitudeDelta
          lng: longitude - longitudeDelta
        se:
          lat: latitude - latitudeDelta
          lng: longitude + longitudeDelta

  render: ->
    <MapView
      onLayout={@props.onLayout}
      style={styles.theMap}
      region={
        latitude: @props.center.lat
        longitude: @props.center.lng
        latitudeDelta: @props.delta.lat
        longitudeDelta: @props.delta.lng
      }
      onRegionChangeComplete={@moveMapNative}
    >
    {
      @props.map_clusters.map (map_cluster, i) =>
        <MapCluster
          key={i}
          lat={(map_cluster.min_latitude + map_cluster.max_latitude) / 2}
          lng={(map_cluster.min_longitude + map_cluster.max_longitude) / 2}
          cluster={map_cluster}
          getColor={@props.getColor}
        />
    }
    {
      @props.map_notes.map (map_note) =>
        <MapNote
          key={map_note.note_id}
          lat={map_note.latitude}
          lng={map_note.longitude}
          note={map_note}
          getColor={@props.getColor}
        />
    }
    </MapView>
  # @endif

  # @ifdef WEB
  moveMapWeb: ({center: {lat, lng}, zoom, bounds: {nw, se}}) ->
    @props.onMove
      center: {lat, lng}
      zoom: zoom
      bounds: {nw, se}

  render: ->
    <div className="siftr-map">
      <GoogleMap
        center={@props.center}
        zoom={@props.zoom}
        bootstrapURLKeys={
          key: 'AIzaSyDlMWLh8Ho805A5LxA_8FgPOmnHI0AL9vw'
        }
        onChange={@moveMapWeb}
        options={(maps) =>
          styles:
            [{"featureType":"all","stylers":[{"saturation":0},{"hue":"#e7ecf0"}]},{"featureType":"road","stylers":[{"saturation":-70}]},{"featureType":"transit","stylers":[{"visibility":"off"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"visibility":"simplified"},{"saturation":-60}]}]
        }
      >
      {
        @props.map_clusters.map (map_cluster, i) =>
          <MapCluster
            key={i}
            lat={(map_cluster.min_latitude + map_cluster.max_latitude) / 2}
            lng={(map_cluster.min_longitude + map_cluster.max_longitude) / 2}
            cluster={map_cluster}
            getColor={@props.getColor}
          />
      }
      {
        @props.map_notes.map (map_note) =>
          <MapNote
            key={map_note.note_id}
            lat={map_note.latitude}
            lng={map_note.longitude}
            note={map_note}
            getColor={@props.getColor}
          />
      }
      </GoogleMap>
    </div>
  # @endif

exports.SiftrMap = SiftrMap
