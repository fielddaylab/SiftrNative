'use strict';

import React from 'react';
import T from 'prop-types';

// @ifdef NATIVE
import {
  Text
, View
, Platform
} from 'react-native';
import MapView from 'react-native-maps';
import {styles} from './styles';
import Svg, {
  Path
, Circle
, Text as SvgText
} from 'react-native-svg';
// @endif

// @ifdef WEB
import GoogleMap from 'google-map-react';
import {ConicGradient} from './conic-gradient';
// @endif

import {fitBounds} from 'google-map-react/utils';

import {
  Note
, Colors
} from './aris';

import {clicker} from './utils';

// @ifdef WEB
// Cache of gradient PNG data URLs
const allConicGradients = {};
const getConicGradient = function(opts) {
  const key = `${opts.stops}_${opts.size}`;
  let grad = allConicGradients[key];
  if (grad == null) {
    grad = new ConicGradient(opts).png;
    allConicGradients[key] = grad;
  }
  return grad;
};
// @endif

const toWord8 = function(n) {
  let s = n.toString(16);
  if (s.length === 1) {
    s = '0' + s;
  }
  return s;
};
const colorAverage = function(c1, c2, numSteps) {
  if (c1 === 'white') c1 = '#ffffff';
  if (c2 === 'white') c2 = '#ffffff';
  let [str1, r1, g1, b1] = c1.match(/^#(..)(..)(..)$/);
  let [str2, r2, g2, b2] = c2.match(/^#(..)(..)(..)$/);
  r1 = parseInt(r1, 16);
  b1 = parseInt(b1, 16);
  g1 = parseInt(g1, 16);
  r2 = parseInt(r2, 16);
  b2 = parseInt(b2, 16);
  g2 = parseInt(g2, 16);
  const rd = (r2 - r1) / numSteps;
  const bd = (b2 - b1) / numSteps;
  const gd = (g2 - g1) / numSteps;
  const ret = [];
  for (let i = 0; i < numSteps; i++) {
    const r = toWord8(Math.round(r1 + rd * i));
    const g = toWord8(Math.round(g1 + gd * i));
    const b = toWord8(Math.round(b1 + bd * i));
    ret.push('#' + r + g + b);
  }
  return ret;
};

class MapCluster extends React.Component {
  constructor(props) {
    super(props);
  }

  // @ifdef NATIVE
  render() {
    const w = 30;
    const r = w / 2;
    let stops = [];
    let startRads = 0;
    for (let tag_id in this.props.cluster.tags) {
      const tag_count = this.props.cluster.tags[tag_id];
      const color = this.props.getColor(tag_id);
      if (tag_count === this.props.cluster.note_count) {
        stops.push(['circle', 'circle', color]);
      } else {
        const endRads = startRads + (tag_count / this.props.cluster.note_count) * 2 * Math.PI;
        stops.push([startRads, endRads, color]);
        startRads = endRads;
      }
    }
    const blurStops = function(){
      if (stops.length === 0 || stops[0][0] === 'circle') {
        return false;
      }
      const newStops = [];
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const [startRads, endRads, color] = stop;
        const nextColor = stops[(i + 1) % stops.length][2]
        const midpoint = startRads + (endRads - startRads) * 0.6
        newStops.push([startRads, midpoint, color]);
        let numSteps = Math.ceil((endRads - midpoint) * 10);
        if (numSteps < 4) numSteps = 4;
        const stepLength = (endRads - midpoint) / numSteps;
        const colorSteps = colorAverage(color, nextColor, numSteps);
        for (let j = 0; j < numSteps; j++) {
          newStops.push([midpoint + stepLength * j, midpoint + stepLength * (j + 1), colorSteps[j]]);
        }
      }
      stops = newStops;
    };
    blurStops();
    return <MapView.Marker
      coordinate={{
        latitude: this.props.lat,
        longitude: this.props.lng,
      }}
      title=""
      description=""
      pinColor="black"
      onPress={() => this.props.onSelect(this.props.cluster)}
    >
      <View style={{width: w + 13, height: w + 3}}>
        <View style={{
          position: 'absolute',
          top: 2,
          left: 6,
          width: w,
          height: w,
          borderRadius: r,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }} />
        <Svg width={w + 11} height={w + 1}>
          {
            (function(){
              const results = [];
              for (let i = 0; i < stops.length; i++) {
                const [startRads, endRads, color] = stops[i];
                if (startRads === 'circle') {
                  results.push(<Circle
                    key={i}
                    cx={r + 5}
                    cy={r}
                    r={r}
                    fill={color}
                  />);
                } else {
                  const x1 = Math.cos(startRads) * r + r + 5;
                  const y1 = Math.sin(startRads) * r + r;
                  const x2 = Math.cos(endRads) * r + r + 5;
                  const y2 = Math.sin(endRads) * r + r;
                  const large = (endRads - startRads >= Math.PI ? 1 : 0);
                  results.push(<Path
                    key={i}
                    d={`M${r+5},${r} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} z`}
                    fill={color}
                  />);
                }
              }
              return results;
            })()
          }
          <SvgText
            textAnchor="middle"
            stroke="black"
            fill="white"
            x={r + 5}
            y={Platform.OS === 'ios' ? 1 : 4}
            fontSize={w * (2/3)}
            fontWeight={Platform.OS === 'ios' ? '900' : 'bold'}
          >{this.props.cluster.note_count}</SvgText>
        </Svg>
      </View>
      <MapView.Callout tooltip={true} />
    </MapView.Marker>;
  }
  // @endif

  // @ifdef WEB
  render() {
    const width = 30;
    const stops = [];
    let percent = 0;
    let last_color;
    for (let tag_id in this.props.cluster.tags) {
      const tag_count = this.props.cluster.tags[tag_id];
      percent += (tag_count / this.props.cluster.note_count) * 100;
      const color = this.props.getColor(tag_id);
      stops.push(`${color} 1 ${percent}%`);
      last_color = color;
    }
    stops.unshift(`${last_color} 1 0%`);
    const gradient = getConicGradient({stops: stops.join(', '), size: width});
    let className = 'siftr-map-cluster';
    if (this.props.thumbHover && this.props.cluster.note_ids.indexOf('' + this.props.thumbHover) !== -1) {
      className += ' hybrid-hover';
    }
    return <div className={className} style={{background: `url(${gradient})`}}
      onClick={clicker(() => this.props.onSelect(this.props.cluster))}
      onMouseEnter={() => this.props.onMouseEnter(this.props.cluster)}
      onMouseLeave={() => this.props.onMouseLeave(this.props.cluster)}
    >
      <span className="siftr-map-cluster-number">
        {this.props.cluster.note_count}
      </span>
    </div>
  }
  // @endif
}

MapCluster.propTypes = {
  cluster: T.any.isRequired,
  lat: T.number.isRequired,
  lng: T.number.isRequired,
  getColor: T.func,
  onSelect: T.func,
  onMouseEnter: T.func,
  onMouseLeave: T.func,
};

MapCluster.defaultProps = {
  getColor: function(){return 'white';},
  onSelect: function(){},
  onMouseEnter: function(){},
  onMouseLeave: function(){},
};

class MapNote extends React.Component {
  constructor(props) {
    super(props);
  }

  // @ifdef NATIVE
  render() {
    const w = 16;
    const r = w / 2;
    return <MapView.Marker
      coordinate={{
        latitude: this.props.lat,
        longitude: this.props.lng,
      }}
      title=""
      description=""
      pinColor={this.props.getColor(this.props.note.tag_id)}
      onPress={() => {
        this.props.onSelect(this.props.note);
      }}
    >
      <View style={{width: w + 3, height: w + 3}}>
        <View style={{
          position: 'absolute',
          top: 2,
          left: 1,
          width: w,
          height: w,
          borderRadius: r,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }} />
        <View style={{
          width: w,
          height: w,
          borderRadius: r,
          backgroundColor: this.props.getColor(this.props.note.tag_id),
        }} />
      </View>
      <MapView.Callout tooltip={true} />
    </MapView.Marker>
  }
  // @endif

  // @ifdef WEB
  render() {
    let className = 'siftr-map-note';
    if (this.props.thumbHover && this.props.note.note_id === this.props.thumbHover) {
      className += ' hybrid-hover';
    }
    return <div className={className}>
      <div className="siftr-map-note-shadow" />
      <div
        className="siftr-map-note-pin"
        style={{backgroundColor: this.props.getColor(this.props.note.tag_id)}}
        onClick={clicker(() => this.props.onSelect(this.props.note))}
        onMouseEnter={() => this.props.onMouseEnter(this.props.note)}
        onMouseLeave={() => this.props.onMouseLeave(this.props.note)}
      />
    </div>;
  }
  // @endif
}

MapNote.propTypes = {
  note: T.any.isRequired,
  lat: T.number.isRequired,
  lng: T.number.isRequired,
  getColor: T.func,
  onSelect: T.func,
  onMouseEnter: T.func,
  onMouseLeave: T.func,
};

MapNote.defaultProps = {
  getColor: function(){return 'white';},
  onSelect: function(){},
  onMouseEnter: function(){},
  onMouseLeave: function(){},
};

export class SiftrMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMapReady: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    // very important optimization. the map takes the longest to rerender
    if (this.props.center.lat !== nextProps.center.lat) return true;
    if (this.props.center.lng !== nextProps.center.lng) return true;
    // @ifdef NATIVE
    if (this.props.delta.lat !== nextProps.delta.lat) return true;
    if (this.props.delta.lng !== nextProps.delta.lng) return true;
    // @endif
    // @ifdef WEB
    if (this.props.zoom !== nextProps.zoom) return true;
    // @endif
    if (this.props.map_notes !== nextProps.map_notes && (this.props.map_notes.length !== 0 || nextProps.map_notes.length !== 0)) return true;
    if (this.props.pendingNotes !== nextProps.pendingNotes && (this.props.pendingNotes.length !== 0 || nextProps.pendingNotes.length !== 0)) return true;
    if (this.props.map_clusters !== nextProps.map_clusters && (this.props.map_clusters.length !== 0 || nextProps.map_clusters.length !== 0)) return true;
    // NOTE: onMove, onLayout, onSelectNote are all looked up dynamically when they happen
    if (this.props.getColor !== nextProps.getColor) return true;
    if (this.props.colors !== nextProps.colors) return true;
    if (this.props.thumbHover !== nextProps.thumbHover) return true;
    if (this.props.tags !== nextProps.tags) return true;
    // the only state
    if (this.state.isMapReady !== nextState.isMapReady) return true;
    return false;
  }

  // @ifdef NATIVE
  openCluster(cluster) {
    const coordinates = [
      {latitude: cluster.min_latitude, longitude: cluster.min_longitude},
      {latitude: cluster.max_latitude, longitude: cluster.max_longitude},
    ];
    const options = {
      edgePadding: {
        top: 25,
        bottom: 25,
        left: 25,
        right: 25,
      },
      animated: true,
    };
    this.refs.theMapView.fitToCoordinates(coordinates, options);
  }
  // @endif

  // @ifdef WEB
  openCluster(cluster) {
    const close = (x, y) => (Math.abs(x - y) < 0.00005);
    if (close(cluster.min_latitude, cluster.max_latitude) && close(cluster.min_longitude, cluster.min_longitude)) {
      // Calling fitBounds on a single point breaks for some reason
      this.props.onMove({
        center: {
          lat: (cluster.min_latitude  + cluster.max_latitude ) / 2,
          lng: (cluster.min_longitude + cluster.max_longitude) / 2,
        },
        zoom: 21,
      });
      return;
    }
    // adjust bounds if all the points are on a single orthogonal line
    // (fitBounds also breaks in this case)
    let bounds;
    if (close(cluster.min_latitude, cluster.max_latitude)) {
      bounds = {
        nw: {
          lat: cluster.max_latitude + 0.0005,
          lng: cluster.min_longitude,
        },
        se: {
          lat: cluster.min_latitude - 0.0005,
          lng: cluster.max_longitude,
        },
      };
    } else if (close(cluster.min_longitude, cluster.max_longitude)) {
      bounds = {
        nw: {
          lat: cluster.max_latitude,
          lng: cluster.min_longitude - 0.0005,
        },
        se: {
          lat: cluster.min_latitude,
          lng: cluster.max_longitude + 0.0005,
        },
      };
    } else {
      bounds = {
        nw: {
          lat: cluster.max_latitude,
          lng: cluster.min_longitude,
        },
        se: {
          lat: cluster.min_latitude,
          lng: cluster.max_longitude,
        },
      };
    }
    const size = {
      width: this.refs.mapContainer.clientWidth * 0.9,
      height: this.refs.mapContainer.clientHeight * 0.9,
      // we shrink the stated map size a bit,
      // to make sure we end up with some buffer around the points
    };
    const {center, zoom} = fitBounds(bounds, size);
    this.props.onMove({center, zoom});
  }
  // @endif

  renderClusters() {
    // @ifdef NATIVE
    if (!this.state.isMapReady) return null;
    // @endif
    return this.props.map_clusters.map((map_cluster, i) => {
      const lat = (map_cluster.min_latitude + map_cluster.max_latitude) / 2;
      const lng = (map_cluster.min_longitude + map_cluster.max_longitude) / 2;
      return <MapCluster
        key={`${lat} ${lng}`}
        lat={lat}
        lng={lng}
        cluster={map_cluster}
        getColor={this.props.getColor}
        onSelect={this.openCluster.bind(this)}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        thumbHover={this.props.thumbHover}
      />;
    });
  }

  renderNotes() {
    // @ifdef NATIVE
    if (!this.state.isMapReady) return null;
    // @endif
    return this.props.map_notes.map((map_note) =>
      <MapNote
        key={map_note.note_id}
        lat={map_note.latitude}
        lng={map_note.longitude}
        note={map_note}
        getColor={this.props.getColor}
        onSelect={(...args) => this.props.onSelectNote(...args)}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        thumbHover={this.props.thumbHover}
      />
    ).concat(this.props.pendingNotes.map(({dir, json}) => {
      json = JSON.parse(json);
      let note = new Note(json);
      note.pending = true;
      note.files = json.files;
      return <MapNote
        key={dir.name}
        lat={note.latitude}
        lng={note.longitude}
        note={note}
        getColor={this.props.getColor}
        onSelect={(...args) => this.props.onSelectNote(...args)}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        thumbHover={this.props.thumbHover}
      />;
    }));
  }

  // @ifdef NATIVE
  componentWillMount() {
    this.moveMapNative({
      latitude: this.props.center.lat,
      longitude: this.props.center.lng,
      latitudeDelta: this.props.delta.lat,
      longitudeDelta: this.props.delta.lng,
    });
  }

  moveMapNative({latitude, longitude, latitudeDelta, longitudeDelta}) {
    this.props.onMove({
      center: {
        lat: latitude,
        lng: longitude,
      },
      delta: {
        lat: latitudeDelta,
        lng: longitudeDelta,
      },
      bounds: {
        nw: {
          lat: latitude + latitudeDelta,
          lng: longitude - longitudeDelta,
        },
        se: {
          lat: latitude - latitudeDelta,
          lng: longitude + longitudeDelta,
        },
      },
    });
  }

  componentDidMount() {
    // this is a hack, because of a problem with react-native-maps.
    // see https://github.com/airbnb/react-native-maps/issues/1577
    if (Platform.OS === 'ios') {
      this.refs.theMapView.animateToRegion({
        latitude: this.props.center.lat,
        longitude: this.props.center.lng,
        latitudeDelta: this.props.delta.lat,
        longitudeDelta: this.props.delta.lng,
      }, 1);
    }
  }

  moveToPoint(center) {
    this.refs.theMapView.animateToRegion({
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: this.props.delta.lat,
      longitudeDelta: this.props.delta.lng,
    }, 500);
  }

  render() {
    return <MapView
      ref="theMapView"
      onLayout={(...args) => {
        setTimeout(() => {
          this.setState({isMapReady: true});
        }, 500);
        this.props.onLayout(...args);
      }}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
      initialRegion={{
        latitude: this.props.center.lat,
        longitude: this.props.center.lng,
        latitudeDelta: this.props.delta.lat,
        longitudeDelta: this.props.delta.lng,
      }}
      onRegionChangeComplete={this.moveMapNative.bind(this)}
      showsUserLocation={true}
    >
      {this.renderClusters()}
      {this.renderNotes()}
    </MapView>;
  }
  // @endif

  // @ifdef WEB
  moveMapWeb({center: {lat, lng}, zoom, bounds: {nw, se}}) {
    this.props.onMove({
      center: {lat, lng},
      zoom: zoom,
      bounds: {nw, se},
    });
  }

  render() {
    return <div className="siftr-map" ref="mapContainer">
      <GoogleMap
        center={this.props.center}
        zoom={this.props.zoom}
        bootstrapURLKeys={{
          key: 'AIzaSyDlMWLh8Ho805A5LxA_8FgPOmnHI0AL9vw'
        }}
        onChange={this.moveMapWeb.bind(this)}
        options={(maps) => {
          return {
            fullscreenControl: false,
            styles:
              [{"featureType":"all","stylers":[{"saturation":0},{"hue":"#e7ecf0"}]},{"featureType":"road","stylers":[{"saturation":-70}]},{"featureType":"transit","stylers":[{"visibility":"off"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"visibility":"simplified"},{"saturation":-60}]}]
          };
        }}
      >
        {this.renderClusters()}
        {this.renderNotes()}
      </GoogleMap>
      <div className="siftr-map-legend">
        Legend:
        {
          this.props.tags ? (
            this.props.tags.map((tag) =>
              <span className="siftr-map-legend-tag" key={tag.tag_id}>
                <div
                  className="siftr-thumbnail-dot"
                  style={{backgroundColor: this.props.getColor(tag)}}
                />
                {tag.tag}
              </span>
            )
          ) : null
        }
      </div>
    </div>;
  }
  // @endif
}

SiftrMap.propTypes = {
  center: T.shape({
    lat: T.number.isRequired,
    lng: T.number.isRequired,
  }).isRequired,
  // @ifdef NATIVE
  delta: T.shape({
    lat: T.number.isRequired,
    lng: T.number.isRequired,
  }).isRequired,
  // @endif
  // @ifdef WEB
  zoom: T.number.isRequired,
  onMouseEnter: T.func,
  onMouseLeave: T.func,
  // @endif
  map_notes: T.arrayOf(T.instanceOf(Note)),
  map_clusters: T.array,
  onMove: T.func,
  onLayout: T.func,
  onSelectNote: T.func,
  getColor: T.func,
  colors: T.any, // only used to rerender map when colors are loaded
};

SiftrMap.defaultProps = {
  map_notes: [],
  map_clusters: [],
  onMove: function(){},
  onLayout: function(){},
  onSelectNote: function(){},
};

// Map clustering algorithms from
// http://www.appelsiini.net/2008/introduction-to-marker-clustering-with-google-maps

const lonToX = function(lon) {
  return Math.round(268435456 + 85445659.4471 * lon * Math.PI / 180);
};

const latToY = function(lat) {
  return Math.round(268435456 - 85445659.4471 *
    Math.log((1 + Math.sin(lat * Math.PI / 180)) /
    (1 - Math.sin(lat * Math.PI / 180))) / 2);
};

const pixelDistance = function(lat1, lon1, lat2, lon2, zoom) {
  // TODO: handle international date line properly
  const x1 = lonToX(lon1);
  const y1 = latToY(lat1);
  const x2 = lonToX(lon2);
  const y2 = latToY(lat2);
  return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2)) >> (21 - zoom)
};

export const makeClusters = function(markers, distance, zoom) {
  markers = markers.slice(); // copy array
  const map_notes = [];
  const map_clusters = [];
  // Loop until all markers have been compared.
  while (markers.length > 0) {
    const marker = markers.pop();
    const cluster = [];
    // Compare against all markers which are left
    const removing = [];
    for (let key = 0; key < markers.length; key++) {
      const target = markers[key];
      const pixels = pixelDistance(marker.latitude, marker.longitude, target.latitude, target.longitude, zoom);
      // If two markers are closer than given distance remove target marker from array and add it to cluster.
      if (distance > pixels) {
        removing.push(key);
        cluster.push(target);
      }
    }
    const old_markers = markers;
    markers = [];
    for (let key = 0; key < old_markers.length; key++) {
      if (removing.indexOf(key) === -1) {
        markers.push(old_markers[key]);
      }
    }

    // If a marker has been added to cluster, add also the one we were comparing to and remove the original from array.
    if (cluster.length > 0) {
      cluster.push(marker);
      map_clusters.push(cluster);
    } else {
      map_notes.push(marker);
    }
  }

  return {map_notes, map_clusters};
};
