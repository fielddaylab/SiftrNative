'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
MapView = require 'react-native-maps'
{styles} = require './styles'
# @endif

# @ifdef WEB
{default: GoogleMap} = require 'google-map-react'
# @endif

{ Note
} = require './aris'

MapCluster = React.createClass
  propTypes:
    cluster: T.any.isRequired
    lat: T.number.isRequired
    lng: T.number.isRequired

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
    <div className="siftr-map-cluster">
      {'#'}
    </div>
  # @endif

MapNote = React.createClass
  propTypes:
    note: T.any.isRequired
    lat: T.number.isRequired
    lng: T.number.isRequired

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
      {@props.note.note_id}
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
      @props.map_notes.map (map_note) =>
        <MapNote
          key={map_note.note_id}
          lat={map_note.latitude}
          lng={map_note.longitude}
          note={map_note}
        />
    }
    {
      @props.map_clusters.map (map_cluster, i) =>
        <MapCluster
          key={i}
          lat={(map_cluster.min_latitude + map_cluster.max_latitude) / 2}
          lng={(map_cluster.min_longitude + map_cluster.max_longitude) / 2}
          cluster={map_cluster}
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
        @props.map_notes.map (map_note) =>
          <MapNote
            key={map_note.note_id}
            lat={map_note.latitude}
            lng={map_note.longitude}
            note={map_note}
          />
      }
      {
        @props.map_clusters.map (map_cluster, i) =>
          <MapCluster
            key={i}
            lat={(map_cluster.min_latitude + map_cluster.max_latitude) / 2}
            lng={(map_cluster.min_longitude + map_cluster.max_longitude) / 2}
            cluster={map_cluster}
          />
      }
      </GoogleMap>
    </div>
  # @endif

exports.SiftrMap = SiftrMap
