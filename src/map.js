'use strict';

import React from 'react';
import T from 'prop-types';
import update from 'immutability-helper';

import {
  Text
, View
, Platform
, Image
, ImageBackground
, Dimensions
} from 'react-native';
import {styles} from './styles';
import Svg, {
  Path
, Circle
, Text as SvgText
} from 'react-native-svg';
import {CacheMedia} from './media';
import MapboxGL from "@react-native-mapbox-gl/maps";

import {fitBounds} from 'google-map-react/utils';

import {
  Note
, Colors
} from './aris';

import TestStyle from './mapbox-style.json';

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

  render() {
    return (
      <SmartMarker
        id={'n' + this.props.note.note_id}
        coordinate={{
          latitude: this.props.lat,
          longitude: this.props.lng,
        }}
        onPress={() => this.props.onSelect(this.props.note)}
        icon={require('../web/assets/img/icon-flag.png')}
        iconSize={[74, 110]}
      />
    );
  }

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

class SmartMarker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      forceSelect: false,
    };
  }

  render() {
    return (
      <MapboxGL.PointAnnotation
        id={this.props.id}
        coordinate={[parseFloat(this.props.coordinate.longitude), parseFloat(this.props.coordinate.latitude)]}
        anchor={{x: 0.5, y: 0.5}}
        onSelected={arg => {
          // Mapbox doesn't just let you listen for "onPress",
          // instead markers are either selected or not.
          // onSelected fires if an unselected marker is tapped.
          // So we have to manually set it to true, and then false shortly after.
          this.setState({forceSelect: true});
          this.props.onPress(arg);
          setTimeout(() => {
            this.setState({forceSelect: false});
          }, 100);
        }}
        selected={this.state.forceSelect}
      >
        <View>
          <Image
            source={this.props.icon}
            style={{
              width: this.props.iconSize[0] * 0.5,
              height: this.props.iconSize[1] * 0.5,
            }}
          />
        </View>
      </MapboxGL.PointAnnotation>
    );
  }
}

export const maxPickupDistance = 10; // meters

export function meterDistance(posn1, posn2) {
  // Haversine formula code from https://stackoverflow.com/a/14561433/509936

  const toRad = function(n) {
     return n * Math.PI / 180;
  }

  var lat2 = parseFloat(posn2.latitude);
  var lon2 = parseFloat(posn2.longitude);
  var lat1 = parseFloat(posn1.latitude);
  var lon1 = parseFloat(posn1.longitude);

  var R = 6371; // km
  var x1 = lat2-lat1;
  var dLat = toRad(x1);
  var x2 = lon2-lon1;
  var dLon = toRad(x2);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;

  return d * 1000;
}

export class SiftrMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMapReady: false,
      legendOpen: false,
    };
  }

  openCluster(cluster) {
    return; // disable cluster zoom in stemports
    const coordinates = [
      {latitude: cluster.min_latitude, longitude: cluster.min_longitude},
      {latitude: cluster.max_latitude, longitude: cluster.max_longitude},
    ];
    const options = {
      edgePadding: {
        top: 35,
        bottom: 35,
        left: 35,
        right: 35,
      },
      animated: true,
    };
    this.refs.theMapView.fitToCoordinates(coordinates, options);
  }


  renderNotes() {
    if (!this.state.isMapReady) return null;
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

  moveToPoint(center) {
    // removed
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.showStops && !prevProps.showStops) {
      const allCoordinates = this.props.triggers.map((trigger) => {
        const inst = this.props.instances.find(inst => parseInt(inst.instance_id) === parseInt(trigger.instance_id));
        if (!inst) return;
        if (inst.object_type !== 'PLAQUE') return;
        const plaque = this.props.plaques.find(p => parseInt(p.plaque_id) === parseInt(inst.object_id));
        if (!plaque) return;
        return {
          latitude: parseFloat(trigger.latitude),
          longitude: parseFloat(trigger.longitude),
        };
      }).filter(x => x);
      let minLatitude = Math.min(...(allCoordinates.map(x => x.latitude)));
      let maxLatitude = Math.max(...(allCoordinates.map(x => x.latitude)));
      let minLongitude = Math.min(...(allCoordinates.map(x => x.longitude)));
      let maxLongitude = Math.max(...(allCoordinates.map(x => x.longitude)));
      // if (minLatitude === maxLatitude) {
      //   minLatitude -= 0.01;
      //   maxLatitude += 0.01;
      // }
      // if (minLongitude === maxLongitude) {
      //   minLongitude -= 0.01;
      //   maxLongitude += 0.01;
      // }
      const stopBounds = {
        ne: [maxLongitude, maxLatitude],
        sw: [minLongitude, minLatitude],
        paddingLeft: 100,
        paddingRight: 100,
        paddingTop: 100,
        paddingBottom: 100,
      };

      this.theMapCamera.setCamera({
        bounds: stopBounds,
        pitch: 0,
        heading: 0,
        minZoomLevel: 0,
        animationDuration: 300,
      });
    } else if (this.props.warp && !this.props.showStops && this.theMapCamera) {
      this.theMapCamera.setCamera({
        centerCoordinate: [
          parseFloat(this.props.location.coords.longitude),
          parseFloat(this.props.location.coords.latitude),
        ],
        pitch: 60,
        zoomLevel: prevProps.showStops ? 22 : undefined,
        animationDuration: 300,
      });
    }
  }

  getCenter(cb) {
    if (!this.theMapView) {
      cb(null);
      return;
    }
    this.theMapView.getCenter().then(loc => cb({
      longitude: loc[0],
      latitude: loc[1],
    })).catch(err => {
      cb(null)
    });
  }

  render() {
    if (!this.props.theme) return null; // wait for theme to load
    const {height, width} = Dimensions.get('window');
    return <MapboxGL.MapView
      ref={r => (this.theMapView = r)}
      onLayout={this.props.onLayout}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
      zoomEnabled={!this.props.showStops}
      scrollEnabled={false}
      rotateEnabled={!this.props.showStops}
      pitchEnabled={false}
      contentInset={[height * 0.45, 0, 0, 0]}
      onPress={e => {
        const [longitude, latitude] = e.geometry.coordinates;
        this.props.onPress({latitude, longitude});
      }}
    >
      <MapboxGL.Camera
        ref={r => (this.theMapCamera = r)}
        defaultSettings={{
          zoomLevel: 22,
          centerCoordinate: (this.props.location && [
            parseFloat(this.props.location.coords.longitude),
            parseFloat(this.props.location.coords.latitude),
          ]),
          pitch: 60,
        }}
        animationDuration={300}
        centerCoordinate={this.props.showStops ? undefined
          : this.props.warp ? (this.props.location && [
              parseFloat(this.props.location.coords.longitude),
              parseFloat(this.props.location.coords.latitude),
              ])
          : undefined /* use followUserLocation */
        }
        followUserLocation={!(this.props.showStops || this.props.warp)}
        followUserMode={this.props.trackDirection ? 'compass' : 'normal'}
        pitch={this.props.showStops ? 0 : 60}
        followPitch={60}
        followZoomLevel={22}
      />
      <MapboxGL.Style
        json={TestStyle}
      />
      {this.renderNotes()}
      {
        this.props.triggers && this.props.instances && this.props.triggers.map((trigger) => {
          const inst = this.props.instances.find(inst => parseInt(inst.instance_id) === parseInt(trigger.instance_id));
          if (!inst) return;
          let icon;
          let iconSize;
          let plaque;
          let item;
          if (inst.object_type === 'PLAQUE') {
            const visited = this.props.logs && this.props.logs.some(log =>
              log.event_type === 'VIEW_PLAQUE' && parseInt(log.content_id) === parseInt(inst.object_id)
            );
            icon = visited ?
              require('../web/assets/img/icon-blaze-visited.png') :
              require('../web/assets/img/icon-blaze.png');
            iconSize=[108, 140];
            plaque = this.props.plaques.find(p => parseInt(p.plaque_id) === parseInt(inst.object_id));
          } else if (inst.object_type === 'ITEM') {
            icon = require('../web/assets/img/icon-chest.png');
            iconSize=[92, 76];
            item = this.props.items.find(p => parseInt(p.item_id) === parseInt(inst.object_id));
          } else {
            return;
          }
          const select = {trigger: trigger, instance: inst, plaque: plaque, item: item};

          return (
            <SmartMarker
              id={'t' + trigger.trigger_id}
              key={trigger.trigger_id}
              coordinate={{
                latitude: parseFloat(trigger.latitude),
                longitude: parseFloat(trigger.longitude),
              }}
              onPress={() => this.props.onSelectItem(select)}
              icon={icon}
              iconSize={iconSize}
            />
          );
        })
      }
      <MapboxGL.UserLocation
        visible={!this.props.showStops}
      />
    </MapboxGL.MapView>;
  }

  getMapStyles(props = this.props) {
    return makeMapStyles(props.game, props.theme);
  }

}

/*
SiftrMap.propTypes = {
  center: T.shape({
    lat: T.number.isRequired,
    lng: T.number.isRequired,
  }).isRequired,
  delta: T.shape({
    lat: T.number.isRequired,
    lng: T.number.isRequired,
  }).isRequired,
  map_notes: T.arrayOf(T.instanceOf(Note)),
  map_clusters: T.array,
  onMove: T.func,
  onLayout: T.func,
  onSelectNote: T.func,
  getColor: T.func,
  colors: T.any, // only used to rerender map when colors are loaded
};
*/

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
