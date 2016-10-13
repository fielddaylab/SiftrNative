'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
} = require 'react-native'
MapView = require 'react-native-maps'
{styles} = require './styles'
{ Path
, default: Svg
, Circle
, Text: SvgText
} = require 'react-native-svg'
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

# @ifdef WEB
# Cache of gradient PNG data URLs
allConicGradients = {}
getConicGradient = (opts) ->
  allConicGradients["#{opts.stops}_#{opts.size}"] ?= new ConicGradient(opts).png
# @endif

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
    w = 30
    r = w / 2
    stops = []
    startRads = 0
    for tag_id, tag_count of @props.cluster.tags
      endRads = startRads + (tag_count / @props.cluster.note_count) * 2 * Math.PI
      color = @props.getColor tag_id
      stops.push [startRads, endRads, color]
      startRads = endRads
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title="Cluster"
      description="Tap to see the notes inside."
      pinColor="black"
      ref="theMarker"
      onPress={=>
        @refs.theMarker.hideCallout()
        @props.onSelect @props.cluster
      }
    >
      <Svg width={w + 1} height={w + 1}>
        {
          for [startRads, endRads, color], i in stops
            x1 = Math.cos(startRads) * r + r
            y1 = Math.sin(startRads) * r + r
            x2 = Math.cos(endRads) * r + r
            y2 = Math.sin(endRads) * r + r
            large = if endRads - startRads >= Math.PI then 1 else 0
            <Path
              key={i}
              d={"M#{r},#{r} L#{x1},#{y1} A#{r},#{r} 0 #{large},1 #{x2},#{y2} z"}
              fill={color}
            />
        }
        <Circle
          cx={r}
          cy={r}
          r={r * (2/3)}
          fill="black"
        />
        <SvgText
          textAnchor="middle"
          stroke="black"
          fill="white"
          x={r}
          y="2"
          fontSize={w * (2/3)}
          fontWeight="bold"
        >{@props.cluster.note_count}</SvgText>
      </Svg>
      <MapView.Callout tooltip={false} />
    </MapView.Marker>
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
        onSelect: =>
          setTimeout =>
            @refs.theMarker.hideCallout()
          , 500
          @props.onSelect @props.note
      when 'android'
        onPress: =>
          @refs.theMarker.hideCallout()
          @props.onSelect @props.note
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title="Note"
      description={@props.note.description}
      pinColor={@props.getColor @props.note.tag_id}
      ref="theMarker"
      {...press}
    >
      <MapView.Callout tooltip={false} />
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
    center: T.shape({
      lat: T.number.isRequired
      lng: T.number.isRequired
    }).isRequired
    # @ifdef NATIVE
    delta: T.shape({
      lat: T.number.isRequired
      lng: T.number.isRequired
    }).isRequired
    # @endif
    # @ifdef WEB
    zoom: T.number.isRequired
    # @endif
    map_notes: T.arrayOf T.instanceOf Note
    map_clusters: T.array
    onMove: T.func
    onLayout: T.func
    onSelectNote: T.func
    getColor: T.func
    colors: T.any # only used to rerender map when colors are loaded

  getDefaultProps: ->
    map_notes: []
    map_clusters: []
    onMove: (->)
    onLayout: (->)
    onSelectNote: (->)

  shouldComponentUpdate: (nextProps) ->
    # very important optimization. the map takes the longest to rerender
    same =
      @props.center.lat is nextProps.center.lat and
      @props.center.lng is nextProps.center.lng and
      # @ifdef NATIVE
      @props.delta.lat is nextProps.delta.lat and
      @props.delta.lng is nextProps.delta.lng and
      # @endif
      # @ifdef WEB
      @props.zoom is nextProps.zoom and
      # @endif
      (@props.map_notes is nextProps.map_notes or
        @props.map_notes.length is nextProps.map_notes.length is 0
      ) and
      (@props.map_clusters is nextProps.map_clusters or
        @props.map_clusters.length is nextProps.map_clusters.length is 0
      ) and
      # NOTE: onMove, onLayout, onSelectNote are all looked up dynamically when they happen
      @props.getColor is nextProps.getColor and
      @props.colors is nextProps.colors
    not same

  # @ifdef NATIVE
  openCluster: (cluster) ->
    coordinates = [
      {latitude: cluster.min_latitude, longitude: cluster.min_longitude}
      {latitude: cluster.max_latitude, longitude: cluster.max_longitude}
    ]
    options =
      edgePadding:
        top: 150
        bottom: 150
        left: 150
        right: 150
      animated: true
    @refs.theMapView.fitToCoordinates coordinates, options
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
        onSelect={(args...) => @props.onSelectNote(args...)}
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
      ref="theMapView"
      onLayout={(args...) => @props.onLayout(args...)}
      style={
        position: 'absolute'
        top: 0
        bottom: 0
        left: 0
        right: 0
      }
      initialRegion={
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
