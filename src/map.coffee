'use strict'

React = require 'react'
T = React.PropTypes

# @ifdef NATIVE
{ Text
, View
, Platform
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

toWord8 = (n) ->
  s = n.toString(16)
  if s.length is 1
    s = '0' + s
  s
colorAverage = (c1, c2, numSteps) ->
  c1 = '#ffffff' if c1 is 'white'
  c2 = '#ffffff' if c2 is 'white'
  [_str, r1, g1, b1] = c1.match(/^#(..)(..)(..)$/)
  [_str, r2, g2, b2] = c2.match(/^#(..)(..)(..)$/)
  r1 = parseInt(r1, 16)
  b1 = parseInt(b1, 16)
  g1 = parseInt(g1, 16)
  r2 = parseInt(r2, 16)
  b2 = parseInt(b2, 16)
  g2 = parseInt(g2, 16)
  rd = (r2 - r1) / numSteps
  bd = (b2 - b1) / numSteps
  gd = (g2 - g1) / numSteps
  for i in [0 .. numSteps - 1]
    r = toWord8 Math.round(r1 + rd * i)
    g = toWord8 Math.round(g1 + gd * i)
    b = toWord8 Math.round(b1 + bd * i)
    '#' + r + g + b

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
      color = @props.getColor tag_id
      if tag_count is @props.cluster.note_count
        stops.push ['circle', 'circle', color]
      else
        endRads = startRads + (tag_count / @props.cluster.note_count) * 2 * Math.PI
        stops.push [startRads, endRads, color]
        startRads = endRads
    blurStops = =>
      return false if stops.length is 0 or stops[0][0] is 'circle'
      newStops = []
      for stop, i in stops
        [startRads, endRads, color] = stop
        nextColor = stops[(i + 1) % stops.length][2]
        midpoint = startRads + (endRads - startRads) * 0.6
        newStops.push [startRads, midpoint, color]
        numSteps = Math.ceil((endRads - midpoint) * 10)
        numSteps = 4 if numSteps < 4
        stepLength = (endRads - midpoint) / numSteps
        colorSteps = colorAverage(color, nextColor, numSteps)
        for i in [0 .. numSteps - 1]
          newStops.push [midpoint + stepLength * i, midpoint + stepLength * (i + 1), colorSteps[i]]
      stops = newStops
    blurStops()
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title=""
      description=""
      pinColor="black"
      onPress={=> @props.onSelect @props.cluster}
    >
      <View style={width: w + 13, height: w + 3}>
        <View style={
          position: 'absolute'
          top: 2
          left: 6
          width: w
          height: w
          borderRadius: r
          backgroundColor: 'rgba(0,0,0,0.5)'
        } />
        <Svg width={w + 11} height={w + 1}>
          {
            for [startRads, endRads, color], i in stops
              if startRads is 'circle'
                <Circle
                  key={i}
                  cx={r + 5}
                  cy={r}
                  r={r}
                  fill={color}
                />
              else
                x1 = Math.cos(startRads) * r + r + 5
                y1 = Math.sin(startRads) * r + r
                x2 = Math.cos(endRads) * r + r + 5
                y2 = Math.sin(endRads) * r + r
                large = if endRads - startRads >= Math.PI then 1 else 0
                <Path
                  key={i}
                  d={"M#{r+5},#{r} L#{x1},#{y1} A#{r},#{r} 0 #{large},1 #{x2},#{y2} z"}
                  fill={color}
                />
          }
          <SvgText
            textAnchor="middle"
            stroke="black"
            fill="white"
            x={r + 5}
            y={
              if Platform.OS is 'ios'
                1
              else
                4
            }
            fontSize={w * (2/3)}
            fontWeight={
              if Platform.OS is 'ios'
                '900'
              else
                'bold'
            }
          >{@props.cluster.note_count}</SvgText>
        </Svg>
      </View>
      <MapView.Callout tooltip={true} />
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
    w = 16
    r = w / 2
    <MapView.Marker
      coordinate={
        latitude: @props.lat
        longitude: @props.lng
      }
      title=""
      description=""
      pinColor={@props.getColor @props.note.tag_id}
      onPress={=>
        @props.onSelect @props.note
      }
    >
      <View style={width: w + 3, height: w + 3}>
        <View style={
          position: 'absolute'
          top: 2
          left: 1
          width: w
          height: w
          borderRadius: r
          backgroundColor: 'rgba(0,0,0,0.5)'
        } />
        <View style={
          width: w
          height: w
          borderRadius: r
          backgroundColor: @props.getColor @props.note.tag_id
        } />
      </View>
      <MapView.Callout tooltip={true} />
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
        top: 25
        bottom: 25
        left: 25
        right: 25
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
      lat = (map_cluster.min_latitude + map_cluster.max_latitude) / 2
      lng = (map_cluster.min_longitude + map_cluster.max_longitude) / 2
      <MapCluster
        key={"#{lat} #{lng}"}
        lat={lat}
        lng={lng}
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
  componentWillMount: ->
    @moveMapNative
      latitude: @props.center.lat
      longitude: @props.center.lng
      latitudeDelta: @props.delta.lat
      longitudeDelta: @props.delta.lng

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

  componentDidMount: ->
    # this is a hack, because of a problem with react-native-maps.
    # see https://github.com/airbnb/react-native-maps/issues/1577
    if Platform.OS is 'ios'
      @refs.theMapView.animateToRegion
        latitude: @props.center.lat
        longitude: @props.center.lng
        latitudeDelta: @props.delta.lat
        longitudeDelta: @props.delta.lng
      , 1

  moveToPoint: (center) ->
    @refs.theMapView.animateToRegion
      latitude: center.lat
      longitude: center.lng
      latitudeDelta: @props.delta.lat
      longitudeDelta: @props.delta.lng
    , 500

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
      showsUserLocation={true}
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

# Map clustering algorithms from
# http://www.appelsiini.net/2008/introduction-to-marker-clustering-with-google-maps

lonToX = (lon) ->
  Math.round(268435456 + 85445659.4471 * lon * Math.PI / 180)

latToY = (lat) ->
  Math.round(268435456 - 85445659.4471 *
    Math.log((1 + Math.sin(lat * Math.PI / 180)) /
    (1 - Math.sin(lat * Math.PI / 180))) / 2)

pixelDistance = (lat1, lon1, lat2, lon2, zoom) ->
  # TODO: handle international date line properly
  x1 = lonToX(lon1)
  y1 = latToY(lat1)
  x2 = lonToX(lon2)
  y2 = latToY(lat2)
  Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2)) >> (21 - zoom)

makeClusters = (markers, distance, zoom) ->
  markers = markers[..] # copy array
  map_notes = []
  map_clusters = []
  # Loop until all markers have been compared.
  while markers.length > 0
    marker = markers.pop()
    cluster = []
    # Compare against all markers which are left
    removing = []
    for target, key in markers
      pixels = pixelDistance marker.latitude, marker.longitude, target.latitude, target.longitude, zoom
      # If two markers are closer than given distance remove target marker from array and add it to cluster.
      if distance > pixels
        removing.push key
        cluster.push target
    markers =
      for target, key in markers
        continue if key in removing
        target

    # If a marker has been added to cluster, add also the one we were comparing to and remove the original from array.
    if cluster.length > 0
      cluster.push marker
      map_clusters.push cluster
    else
      map_notes.push marker

  {map_notes, map_clusters}

exports.makeClusters = makeClusters
