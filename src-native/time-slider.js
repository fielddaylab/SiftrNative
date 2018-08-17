'use strict';

import React from 'react';
import T from 'prop-types';
import createClass from 'create-react-class';

import
{ Dimensions
, View
} from 'react-native';
import {Text} from './styles';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const nubType = T.oneOfType([T.number, T.oneOf(['min', 'max'])]);


export const TimeSlider = createClass({
  displayName: 'TimeSlider',
  propTypes: {
    minBound: T.number.isRequired,
    maxBound: T.number.isRequired,
    p1: nubType.isRequired,
    p2: nubType.isRequired,
    onChange: T.func,
  },

  getDefaultProps() {
    return {
      onChange: function(){},
    };
  },

  getInitialState() {
    return {
      p1: this.props.p1,
      p2: this.props.p2,
      p1_temp: this.props.p1,
      p2_temp: this.props.p2,
    };
  },

  getFrac(time) {
    if (time === 'min')
      return 0;
    else if (time === 'max')
      return 1;
    else
      return (time - this.props.minBound) / (this.props.maxBound - this.props.minBound);
  },

  fracToTime(frac) {
    if (frac === 0)
      return 'min';
    else if (frac === 1)
      return 'max';
    else
      return this.props.minBound + frac * (this.props.maxBound - this.props.minBound);
  },

  isFlipped() {
    if      (this.state.p1 === 'min') return false;
    else if (this.state.p2 === 'min') return true;
    else if (this.state.p1 === 'max') return true;
    else if (this.state.p2 === 'max') return false;
    else                              return this.state.p1 > this.state.p2;
  },

  doChange() {
    if (this.isFlipped()) {
      this.props.onChange(this.state.p2, this.state.p1);
    } else {
      this.props.onChange(this.state.p1, this.state.p2);
    }
  },

  render() {
    const ticks = 100;
    return <View style={{
      flexDirection: 'column',
      alignSelf: 'stretch',
      alignItems: 'center',
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        marginBottom: 12,
      }}>
        <Text style={{fontSize: 18, margin: 10}}>{this.showDate(this.state.p1_temp)}</Text>
        <Text style={{fontSize: 18, margin: 10}}>{this.showDate(this.state.p2_temp)}</Text>
      </View>
      <MultiSlider
        sliderLength={Dimensions.get('window').width - 75}
        min={0}
        max={ticks}
        step={1}
        values={[Math.round(this.getFrac(this.state.p1) * ticks), Math.round(this.getFrac(this.state.p2) * ticks)]}
        onValuesChange={([v1, v2]) => {
          this.setState({
            p1_temp: this.fracToTime(v1 / ticks),
            p2_temp: this.fracToTime(v2 / ticks),
          });
        }}
        onValuesChangeFinish={([v1, v2]) => {
          const p1 = this.fracToTime(v1 / ticks);
          const p2 = this.fracToTime(v2 / ticks);
          this.setState({p1: p1, p2: p2});
          this.props.onChange(p1, p2);
        }}
      />
    </View>;
  },

  showDate(d) {
    if (d === 'min') d = this.props.minBound;
    if (d === 'max') d = this.props.maxBound;
    return new Date(d).toLocaleDateString();
  },

});

export function timeToARIS(time) {
  if (typeof time === 'number') {
    // ISO string is in format "yyyy-mm-ddThh:mm:ss.sssZ"
    // we change it into "yyyy-mm-dd hh:mm:ss" for the ARIS SQL format
    return new Date(time).toISOString().replace('T', ' ').replace(/\.\d\d\dZ$/, '');
  }
}
