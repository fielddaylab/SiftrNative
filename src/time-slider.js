'use strict';

import React from 'react';
import T from 'prop-types';
import createClass from 'create-react-class';

// @ifdef NATIVE
import
{ Dimensions
, View
} from 'react-native';
import {Text} from './styles';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
// @endif

const nubType = T.oneOfType([T.number, T.oneOf(['min', 'max'])]);

// @ifdef WEB
const TimeSliderNub = createClass({
  propTypes: {
    fraction: T.number.isRequired,
    getSlider: T.func.isRequired,
    onChange: T.func,
    onPointerEnd: T.func,
  },

  getDefaultProps() {
    return {
      onChange: function(){},
      onPointerEnd: function(){},
    };
  },

  pointerDown(inputType) {
    return (event) => {
      if (this.dragListener != null) return;
      this.dragListener = (e) => {
        const rect = this.props.getSlider().getBoundingClientRect();
        let x;
        if (inputType === 'mouse') x = e.clientX;
        if (inputType === 'touch') x = e.touches[0].clientX;
        let fraction = (x - (rect.left + 10)) / (rect.width - 20);
        fraction = Math.max(0, Math.min(1, fraction));
        this.props.onChange(fraction);
      };
      const move = `${inputType}move`;
      window.addEventListener(move, this.dragListener);
      let end;
      if (inputType === 'mouse') end = 'mouseup';
      if (inputType === 'touch') end = 'touchend';
      window.addEventListener(end, () => {
        if (this.dragListener != null) {
          window.removeEventListener(move, this.dragListener);
          delete this.dragListener;
          this.props.onPointerEnd()
        }
      });
    };
  },

  render() {
    return <div
      className="time-slider-nub"
      style={{
        left: `calc((100% - 20px) * ${this.props.fraction})`
      }}
      onMouseDown={this.pointerDown('mouse')}
      onTouchStart={this.pointerDown('touch')}
    />;
  },
});
// @endif

export const TimeSlider = createClass({
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

  // @ifdef NATIVE
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
  // @endif

  showDate(d) {
    if (d === 'min') d = this.props.minBound;
    if (d === 'max') d = this.props.maxBound;
    return new Date(d).toLocaleDateString();
  },

  // @ifdef WEB
  render() {
    const flip = this.isFlipped();
    return <div>
      <div className="date-bounds">
        <span>{this.showDate(flip ? this.state.p2 : this.state.p1)}</span>
        <span>{this.showDate(flip ? this.state.p1 : this.state.p2)}</span>
      </div>
      <div
        className="time-slider"
        ref="timeSlider"
      >
        <TimeSliderNub
          fraction={this.getFrac(this.state.p1)}
          getSlider={() => this.refs.timeSlider}
          onChange={(frac) => this.setState({p1: this.fracToTime(frac)})}
          onPointerEnd={this.doChange}
        />
        <TimeSliderNub
          fraction={this.getFrac(this.state.p2)}
          getSlider={() => this.refs.timeSlider}
          onChange={(frac) => this.setState({p2: this.fracToTime(frac)})}
          onPointerEnd={this.doChange}
        />
      </div>
    </div>;
  },
  // @endif
});

export function timeToARIS(time) {
  if (typeof time === 'number') {
    // ISO string is in format "yyyy-mm-ddThh:mm:ss.sssZ"
    // we change it into "yyyy-mm-dd hh:mm:ss" for the ARIS SQL format
    return new Date(time).toISOString().replace('T', ' ').replace(/\.\d\d\dZ$/, '');
  }
}
