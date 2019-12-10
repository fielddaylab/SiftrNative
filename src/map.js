'use strict';

import React from 'react';
import T from 'prop-types';
import update from 'immutability-helper';

// @ifdef NATIVE
import {
  Text
, View
, Platform
, Image
, ImageBackground
, Dimensions
} from 'react-native';
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import {styles} from './styles';
import Svg, {
  Path
, Circle
, Text as SvgText
} from 'react-native-svg';
import {CacheMedia} from './media';
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

class MapNote extends React.Component {
  constructor(props) {
    super(props);
  }

  thumbFocused(props = this.props) {
    return props.thumbHover && props.thumbHover == this.props.note.note_id;
  }

  // @ifdef NATIVE
  render() {
    return (
      <SmartMarker
        coordinate={{
          latitude: this.props.lat,
          longitude: this.props.lng,
        }}
        onPress={() => this.props.onSelect(this.props.note)}
        icon={require('../web/assets/img/icon-flag.png')}
      />
    );
  }
  // @endif

  // @ifdef WEB
  render() {
    let className = 'siftr-map-note';
    if (this.thumbFocused()) {
      className += ' hybrid-hover';
    }
    return <div className={className}>
      <div className="siftr-map-note-shadow" />
      <div
        className="siftr-map-note-pin"
        style={{backgroundColor: this.props.getColor(this.props.note)}}
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

export function makeMapStyles(game, theme) {
  let styles = [];
  if (theme) {
    styles = JSON.parse(theme.gmaps_styles);
  }
  styles.push({
    featureType: 'transit',
    stylers: [{visibility: 'off'}],
  });
  styles.push({
    featureType: 'poi',
    stylers: [{visibility: 'off'}],
  });
  if (!game.map_show_roads) {
    styles.push({
      featureType: 'road',
      stylers: [{visibility: 'off'}],
    });
  }
  if (!game.map_show_labels) {
    styles.push({
      elementType: 'labels',
      stylers: [{visibility: 'off'}],
    });
    styles.push({
      featureType: 'administrative.land_parcel',
      stylers: [{visibility: 'off'}],
    });
    styles.push({
      featureType: 'administrative.neighborhood',
      stylers: [{visibility: 'off'}],
    });
  }
  return styles;
}

var color_codes = {};
function stringToColorCode(str) {
    return (str in color_codes) ? color_codes[str] : (color_codes[str] = '#'+ ('000000' + (Math.random()*0xFFFFFF<<0).toString(16)).slice(-6));
}

// @ifdef NATIVE
class SmartMarker extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MapView.Marker
        tracksViewChanges={false}
        coordinate={this.props.coordinate}
        anchor={{x: 0.5, y: 0.5}}
        title=""
        description=""
        pinColor="blue"
        onPress={this.props.onPress}
        icon={this.props.icon}
      >
        <MapView.Callout tooltip={true} />
      </MapView.Marker>
    );
  }
}
// @endif

export class SiftrMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMapReady: false,
      legendOpen: false,
    };
  }

  // @ifdef NATIVE
  openCluster(cluster) {
    return; // disable cluster zoom in stemports
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
      if (note.game_id !== this.props.game.game_id) return null;
      note.pending = true;
      note.dir = dir.path;
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
    }).filter((x) => x != null));
  }

  // @ifdef NATIVE
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!this.refs.theMapView) return;
    if (!prevProps.location && !this.props.location) return;
    if ( prevProps.location
      && this.props.location
      && prevProps.location.coords.latitude === this.props.location.coords.latitude
      && prevProps.location.coords.longitude === this.props.location.coords.longitude
    ) return;

    this.refs.theMapView.setCamera({
      center: this.props.location.coords,
    });
  }

  moveToPoint(center) {
    // removed
  }

  render() {
    if (!this.props.theme) return null; // wait for theme to load
    const {height, width} = Dimensions.get('window');
    return <MapView
      provider={PROVIDER_GOOGLE}
      ref="theMapView"
      onMapReady={() => {
        // this is a hack, because of a problem with react-native-maps.
        // see https://github.com/airbnb/react-native-maps/issues/1577
        if (Platform.OS === 'ios' && false) {
          this.refs.theMapView.animateToRegion({
            latitude: this.props.center.lat,
            longitude: this.props.center.lng,
            latitudeDelta: this.props.delta.lat,
            longitudeDelta: this.props.delta.lng,
          }, 1);
        }
      }}
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
      scrollEnabled={false}
      pitchEnabled={false}
      zoomEnabled={false}
      mapPadding={{
        top: height * 0.45,
      }}
      initialCamera={{
        center: this.props.location ? this.props.location.coords : {
          latitude: 0,
          longitude: 0,
        },
        heading: 0,
        pitch: 90,
        zoom: 20.5,
        altitude: 0, // not used
      }}
      showsUserLocation={false}
      showsBuildings={false}
      customMapStyle={this.getMapStyles()}
      mapType={this.props.game.map_type === 'STREET' ? 'standard' : 'hybrid'}
    >
      {
        this.props.location && (
          <MapView.Circle
            center={this.props.location.coords}
            radius={10}
            fillColor="rgba(0,100,255,0.2)"
          />
        )
      }
      {this.renderNotes()}
      {
        this.props.triggers && this.props.instances && this.props.triggers.map((trigger) => {
          const inst = this.props.instances.find(inst => parseInt(inst.instance_id) === parseInt(trigger.instance_id));
          if (!inst) return;
          let icon;
          let plaque;
          let item;
          if (inst.object_type === 'PLAQUE') {
            const visited = this.props.logs && this.props.logs.some(log =>
              log.event_type === 'VIEW_PLAQUE' && parseInt(log.content_id) === parseInt(inst.object_id)
            );
            icon = visited ? 
              require('../web/assets/img/icon-blaze-visited.png') :
              require('../web/assets/img/icon-blaze.png');
            plaque = this.props.plaques.find(p => parseInt(p.plaque_id) === parseInt(inst.object_id));
          } else if (inst.object_type === 'ITEM') {
            icon = require('../web/assets/img/icon-chest.png');
            item = this.props.items.find(p => parseInt(p.item_id) === parseInt(inst.object_id));
          } else {
            return;
          }
          const select = {trigger: trigger, instance: inst, plaque: plaque, item: item};

          return (
            <SmartMarker
              key={trigger.trigger_id}
              coordinate={{
                latitude: parseFloat(trigger.latitude),
                longitude: parseFloat(trigger.longitude),
              }}
              onPress={() => this.props.onSelectItem(select)}
              icon={icon}
            />
          );
        })
      }
    </MapView>;
  }
  // @endif

  getMapStyles(props = this.props) {
    return makeMapStyles(props.game, props.theme);
  }

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
            styles: this.getMapStyles(),
            mapTypeId: this.props.game.map_type === 'STREET' ? maps.MapTypeId.ROADMAP : maps.MapTypeId.HYBRID,
          };
        }}
      >
        {this.renderNotes()}
      </GoogleMap>
      <div className={`siftr-map-legend ${this.state.legendOpen ? 'selected' : ''}`}>
        <a href="#" className="legendtoggle" onClick={(e) => {
          e.preventDefault();
          this.setState((oldState) => update(oldState, {legendOpen: {$apply: (x) => !x}}));
        }}>
          Legend
        </a>
        <div className="legend-wrap">
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
