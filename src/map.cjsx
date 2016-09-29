'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
MapView = require 'react-native-maps'
{styles} = require './styles'
{Alert} = require 'react-native'
# @endif

# @ifdef WEB
{default: GoogleMap} = require 'google-map-react'
{ConicGradient} = require './conic-gradient'
# @endif

{fitBounds} = require 'google-map-react/utils'

{ Note
, Colors
} = require './aris'

{clicker} = require './utils'

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
    onSelect: T.func

  getDefaultProps: ->
    getColor: -> 'white'
    onSelect: (->)

  # @ifdef NATIVE
  render: ->
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title="Cluster"
      description="Tap to see the notes inside."
      pinColor="black"
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
    <div className="siftr-map-cluster" style={background: "url(#{gradient})"}
      onClick={clicker => @props.onSelect @props.cluster}
    >
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
    onSelect: T.func

  getDefaultProps: ->
    getColor: -> 'white'
    onSelect: (->)

  # @ifdef NATIVE
  render: ->
    press = switch window.platform
      when 'ios'
        # onPress does not appear to work on iOS
        onSelect: => @props.onSelect @props.note
      when 'android'
        onPress: => @props.onSelect @props.note # TODO test this
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title="Note"
      description={@props.note.description}
      pinColor={@props.getColor @props.note.tag_id}
      {...press}
    >
      {
        null # <MapView.Callout tooltip={true} />
      }
    </MapView.Marker>
  # @endif

  # @ifdef WEB
  render: ->
    <div className="siftr-map-note">
      <div className="siftr-map-note-shadow" />
      <div
        className="siftr-map-note-pin"
        style={backgroundColor: @props.getColor @props.note.tag_id}
        onClick={clicker => @props.onSelect @props.note}
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
    onSelectNote: T.func
    getColor: T.func

  getDefaultProps: ->
    map_notes: []
    map_clusters: []
    onMove: (->)
    onLayout: (->)
    onSelectNote: (->)

  getInitialState: -> {}

  # @ifdef NATIVE
  openCluster: (cluster) ->
    null
  # @endif

  # @ifdef WEB
  openCluster: (cluster) ->
    close = (x, y) => Math.abs(x - y) < 0.00005
    if close(cluster.min_latitude, cluster.max_latitude) and close(cluster.min_longitude, cluster.min_longitude)
      # Calling fitBounds on a single point breaks for some reason
      @props.onMove
        center:
          lat: (cluster.min_latitude  + cluster.max_latitude ) / 2
          lng: (cluster.min_longitude + cluster.max_longitude) / 2
        zoom: 21
      return
    # adjust bounds if all the points are on a single orthogonal line
    # (fitBounds also breaks in this case)
    bounds =
      if close(cluster.min_latitude, cluster.max_latitude)
        nw:
          lat: cluster.max_latitude + 0.0005
          lng: cluster.min_longitude
        se:
          lat: cluster.min_latitude - 0.0005
          lng: cluster.max_longitude
      else if close(cluster.min_longitude, cluster.max_longitude)
        nw:
          lat: cluster.max_latitude
          lng: cluster.min_longitude - 0.0005
        se:
          lat: cluster.min_latitude
          lng: cluster.max_longitude + 0.0005
      else
        nw:
          lat: cluster.max_latitude
          lng: cluster.min_longitude
        se:
          lat: cluster.min_latitude
          lng: cluster.max_longitude
    size =
      width: @refs.mapContainer.clientWidth * 0.9
      height: @refs.mapContainer.clientHeight * 0.9
      # we shrink the stated map size a bit,
      # to make sure we end up with some buffer around the points
    {center, zoom} = fitBounds bounds, size
    @props.onMove {center, zoom}
  # @endif

  renderClusters: ->
    @props.map_clusters.map (map_cluster, i) =>
      <MapCluster
        key={i}
        lat={(map_cluster.min_latitude + map_cluster.max_latitude) / 2}
        lng={(map_cluster.min_longitude + map_cluster.max_longitude) / 2}
        cluster={map_cluster}
        getColor={@props.getColor}
        onSelect={@openCluster}
      />

  renderNotes: ->
    @props.map_notes.map (map_note) =>
      <MapNote
        key={map_note.note_id}
        lat={map_note.latitude}
        lng={map_note.longitude}
        note={map_note}
        getColor={@props.getColor}
        onSelect={@props.onSelectNote}
      />

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
      {@renderClusters()}
      {@renderNotes()}
    </MapView>
  # @endif

  # @ifdef WEB
  moveMapWeb: ({center: {lat, lng}, zoom, bounds: {nw, se}}) ->
    @props.onMove
      center: {lat, lng}
      zoom: zoom
      bounds: {nw, se}

  render: ->
    <div className="siftr-map" ref="mapContainer">
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
        {@renderClusters()}
        {@renderNotes()}
      </GoogleMap>
    </div>
  # @endif

exports.SiftrMap = SiftrMap
