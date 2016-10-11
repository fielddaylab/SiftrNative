// react-native-multi-slider by JackDanielsAndCode:
//   https://github.com/JackDanielsAndCode/react-native-multi-slider
// plus Android fix from chung-nguyen:
//   https://github.com/JackDanielsAndCode/react-native-multi-slider/issues/17

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  PropTypes
} = React;
var {
  StyleSheet,
  PanResponder,
  View,
  TouchableHighlight,
  Platform
} = ReactNative;

var converter = {
  valueToPosition: function (value, valuesArray, sliderLength) {
    var arrLength;
    var index = valuesArray.indexOf(value);

    if (index === -1) {
      console.log('Invalid value, array does not contain: ', value)
      return null;
    } else {
      arrLength = valuesArray.length - 1;
      return sliderLength * index / arrLength;
    }
  },
  positionToValue: function (position, valuesArray, sliderLength) {
    var arrLength;
    var index;

    if ( position < 0 || sliderLength < position ) {
      console.log('invalid position: ', position);
      return null;
    } else {
      arrLength = valuesArray.length - 1;
      index = arrLength * position / sliderLength;
      return valuesArray[Math.round(index)];
    }
  },
  createArray: function (start, end, step) {
    var i;
    var length;
    var direction = start - end > 0 ? -1 : 1;
    var result = [];
    if (!step) {
        console.log('invalid step: ', step);
        return result;
    } else {
        length = Math.abs((start - end)/step) + 1;
        for (i=0 ; i<length ; i++){
          result.push(start + i * Math.abs(step)*direction);
        }
        return result;
    }
  }
};

var BasicMarker = React.createClass({

  propTypes: {
    pressed: PropTypes.bool,
    pressedMarkerStyle: View.propTypes.style,
    markerStyle: View.propTypes.style
  },

  render: function () {
    return (
      <View
        style={[this.props.markerStyle, this.props.pressed && this.props.pressedMarkerStyle]}
      />
    );
  }
});

var mockProps = {
  values: [0],
  onValuesChangeStart: function () {
    console.log('press started');
  },
  onValuesChange: function (values) {
    console.log('changing', values);
  },
  onValuesChangeFinish: function (values) {
    console.log('changed', values);
  },
  step: 1,
  min:0,
  max:10,
  selectedStyle: {
    backgroundColor: 'blue'
  },
  unselectedStyle: {
    backgroundColor: 'grey'
  },
  containerStyle: {
    height:30,
  },
  trackStyle: {
    height:7,
    borderRadius: 3.5,
  },
  touchDimensions: {
    height: 30,
    width: 30,
    borderRadius: 15,
    slipDisplacement: 30,
  },
  markerStyle: {
    height:30,
    width: 30,
    borderRadius: 15,
    backgroundColor:'#E8E8E8',
    borderWidth: 0.5,
    borderColor: 'grey',
  },
  customMarker: BasicMarker,
  pressedMarkerStyle: {
    backgroundColor:'#D3D3D3',
  },
  sliderLength: 280
};

var sliderProps = {
  values: PropTypes.arrayOf(PropTypes.number),

  onValuesChangeStart: PropTypes.func,
  onValuesChange: PropTypes.func,
  onValuesChangeFinish: PropTypes.func,

  sliderLength: PropTypes.number,
  sliderOrientation: PropTypes.string,
  touchDimensions: PropTypes.object,

  customMarker: PropTypes.func,

  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,

  optionsArray: PropTypes.array,

  containerStyle: View.propTypes.style,
  trackStyle: View.propTypes.style,
  selectedStyle: View.propTypes.style,
  unselectedStyle: View.propTypes.style,
  markerStyle: View.propTypes.style,
  pressedMarkerStyle: View.propTypes.style
};

var Slider = React.createClass({

  propTypes: sliderProps,

  getDefaultProps: function() {
    return mockProps;
  },

  getInitialState() {
    this.optionsArray = this.props.optionsArray || converter.createArray(this.props.min,this.props.max,this.props.step);
    this.stepLength = this.props.sliderLength/this.optionsArray.length;

    var initialValues = this.props.values.map(value => converter.valueToPosition(value,this.optionsArray,this.props.sliderLength));

    return {
      pressedOne: true,
      valueOne: this.props.values[0],
      valueTwo: this.props.values[1],
      pastOne: initialValues[0],
      pastTwo: initialValues[1],
      positionOne: initialValues[0],
      positionTwo: initialValues[1]
    };
  },

  componentWillMount() {
    var customPanResponder = function (start,move,end) {
      return PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => true,
        onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => true,
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
        onPanResponderGrant: (evt, gestureState) => start(),
        onPanResponderMove: (evt, gestureState) => move(gestureState),
        onPanResponderTerminationRequest: (evt, gestureState) => true,
        onPanResponderRelease: (evt, gestureState) => end(gestureState),
        onPanResponderTerminate: (evt, gestureState) => end(gestureState),
        onShouldBlockNativeResponder: (evt, gestureState) => true
      })
    };

    this._panResponderOne = customPanResponder(this.startOne, this.moveOne, this.endOne);
    this._panResponderTwo = customPanResponder(this.startTwo, this.moveTwo, this.endTwo);

  },

  componentWillReceiveProps(nextProps) {
    var { values } = this.props;
    if (nextProps.values.join() !== values.join()) {
      this.set(nextProps);
    }
  },

  set(config) {
    var { max, min, optionsArray, step, values } = config || this.props;
    this.optionsArray = optionsArray || converter.createArray(min, max, step);
    this.stepLength = this.props.sliderLength/this.optionsArray.length;

    var initialValues = values.map(value => converter.valueToPosition(value,this.optionsArray,this.props.sliderLength));

    this.setState({
      pressedOne: true,
      valueOne: values[0],
      valueTwo: values[1],
      pastOne: initialValues[0],
      pastTwo: initialValues[1],
      positionOne: initialValues[0],
      positionTwo: initialValues[1]
    });
  },

  startOne () {
    this.props.onValuesChangeStart();
    this.setState({
      onePressed: !this.state.onePressed
    });
  },

  startTwo () {
    this.props.onValuesChangeStart();
    this.setState({
      twoPressed: !this.state.twoPressed
    });
  },

  moveOne(gestureState) {
    var unconfined = gestureState.dx + this.state.pastOne;
    var bottom     = 0;
    var top        = (this.state.positionTwo - this.stepLength) || this.props.sliderLength;
    var confined   = unconfined < bottom ? bottom : (unconfined > top ? top : unconfined);
    var value      = converter.positionToValue(this.state.positionOne, this.optionsArray, this.props.sliderLength);

    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (Math.abs(gestureState.dy) < slipDisplacement || !slipDisplacement) {
      this.setState({
        positionOne: confined
      });
    }
    if ( value !== this.state.valueOne ) {
      this.setState({
        valueOne: value
      }, function () {
        var change = [this.state.valueOne];
        if (this.state.valueTwo) {
          change.push(this.state.valueTwo);
        }
        this.props.onValuesChange(change);
      });
    }
  },

  moveTwo(gestureState) {
    var unconfined  = gestureState.dx + this.state.pastTwo;
    var bottom      = this.state.positionOne + this.stepLength;
    var top         = this.props.sliderLength;
    var confined    = unconfined < bottom ? bottom : (unconfined > top ? top : unconfined);
    var value       = converter.positionToValue(this.state.positionTwo, this.optionsArray, this.props.sliderLength);
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (Math.abs(gestureState.dy) < slipDisplacement || !slipDisplacement) {
      this.setState({
        positionTwo: confined
      });
    }
    if ( value !== this.state.valueTwo ) {
      this.setState({
        valueTwo: value
      }, function () {
        this.props.onValuesChange([this.state.valueOne,this.state.valueTwo]);
      });
    }
  },

  endOne(gestureState) {
    this.setState({
      pastOne: this.state.positionOne,
      onePressed: !this.state.onePressed
    }, function () {
      var change = [this.state.valueOne];
      if (this.state.valueTwo) {
        change.push(this.state.valueTwo);
      }
      this.props.onValuesChangeFinish(change);
    });
  },

  endTwo(gestureState) {
    this.setState({
      twoPressed: !this.state.twoPressed,
      pastTwo: this.state.positionTwo,
    }, function () {
      this.props.onValuesChangeFinish([this.state.valueOne,this.state.valueTwo]);
    });
  },

  render() {
    if (Platform.OS === 'android') {

      var {positionOne, positionTwo} = this.state;
      var {selectedStyle, unselectedStyle, sliderLength} = this.props;
      var twoMarkers = positionTwo;

      var fixedPositionOne = Math.floor(positionOne / this.stepLength) * this.stepLength;
      var fixedPositionTwo = Math.floor(positionTwo / this.stepLength) * this.stepLength;

      var trackOneLength = fixedPositionOne;
      var trackOneStyle = twoMarkers ? unselectedStyle : selectedStyle;
      var trackThreeLength = twoMarkers ? sliderLength - (fixedPositionTwo) : 0;
      var trackThreeStyle = unselectedStyle;
      var trackTwoLength = sliderLength - trackOneLength - trackThreeLength;
      var trackTwoStyle = twoMarkers ? selectedStyle : unselectedStyle;
      var Marker = this.props.customMarker;
      var {slipDisplacement, height, width, borderRadius} = this.props.touchDimensions;
      var touchStyle = {
        height: height,
        width: width,
        borderRadius: borderRadius || 0
      };

      return (
        <View style={[styles.container, this.props.containerStyle]}>
          <View style={[styles.fullTrack, { width: sliderLength }]}>
            <View style={[this.props.trackStyle, styles.track, trackOneStyle, { width: trackOneLength }]} />
            <View style={[this.props.trackStyle, styles.track, trackTwoStyle, { width: trackTwoLength }]} />
            { twoMarkers && (
              <View style={[this.props.trackStyle, styles.track, trackThreeStyle, { width: trackThreeLength }]} />
            ) }


            <View
              style={[styles.touch, touchStyle, {left: -(trackTwoLength + trackThreeLength + width / 2)}]}
              ref={component => this._markerOne = component}
              {...this._panResponderOne.panHandlers}
              >
              <Marker
                pressed={this.state.onePressed}
                value={this.state.valueOne}
                markerStyle={this.props.markerStyle}
                pressedMarkerStyle={this.props.pressedMarkerStyle}
                />
            </View>

            { twoMarkers && (positionOne !== this.props.sliderLength) && (
              <View
                style={[styles.touch, touchStyle, {left: -(trackThreeLength + width * 1.5)}]}
                ref={component => this._markerTwo = component}
                {...this._panResponderTwo.panHandlers}
                >
                <Marker
                  pressed={this.state.twoPressed}
                  value={this.state.valueOne}
                  markerStyle={this.props.markerStyle}
                  pressedMarkerStyle={this.props.pressedMarkerStyle}
                  />
              </View>
            ) }

          </View>
        </View>
      );

    } else {

      var {positionOne, positionTwo} = this.state;
      var {selectedStyle, unselectedStyle, sliderLength} = this.props;
      var twoMarkers = positionTwo;

      var trackOneLength = positionOne;
      var trackOneStyle = twoMarkers ? unselectedStyle : selectedStyle;
      var trackThreeLength = twoMarkers ? sliderLength - (positionTwo) : 0;
      var trackThreeStyle = unselectedStyle;
      var trackTwoLength = sliderLength - trackOneLength - trackThreeLength;
      var trackTwoStyle = twoMarkers ? selectedStyle : unselectedStyle;
      var Marker = this.props.customMarker;
      var {slipDisplacement, height, width, borderRadius} = this.props.touchDimensions;
      var touchStyle = {
        height: height,
        width: width,
        left: -width/2,
        borderRadius: borderRadius || 0
      };

      return (
        <View style={[styles.container, this.props.containerStyle]}>
          <View style={[styles.fullTrack, {width:sliderLength}]}>
            <View style={[this.props.trackStyle, styles.track, trackOneStyle, {width: trackOneLength}]} />
            <View style={[this.props.trackStyle, styles.track, trackTwoStyle, {width: trackTwoLength}]}>
              <View
                style={[styles.touch,touchStyle]}
                ref={component => this._markerOne = component}
                {...this._panResponderOne.panHandlers}
              >
                <Marker
                  pressed={this.state.onePressed}
                  markerStyle={this.props.markerStyle}
                  pressedMarkerStyle={this.props.pressedMarkerStyle}
                />
              </View>
            </View>
            {twoMarkers && (
              <View style={[this.props.trackStyle, styles.track, trackThreeStyle, {width: trackThreeLength}]}>
                {(positionOne !== this.props.sliderLength) && (
                  <View
                    style={[styles.touch,touchStyle]}
                    ref={component => this._markerTwo = component}
                    {...this._panResponderTwo.panHandlers}
                  >
                    <Marker
                      pressed={this.state.twoPressed}
                      markerStyle={this.props.markerStyle}
                      pressedMarkerStyle={this.props.pressedMarkerStyle}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      );

    }
  }
});

module.exports = Slider;

var styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  fullTrack: {
    flexDirection: 'row',
  },
  track: {
    justifyContent: 'center'
  },
  touch: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  }
});
