'use strict'

import React from 'react';
import T from 'prop-types';
import update from 'immutability-helper';

import
{ TouchableOpacity
, View
, ScrollView
, StyleSheet
, TextInput
, Switch
} from 'react-native';
import {styles, Text} from './styles';

import
{ Auth
, Tag
, Game
} from './aris';

import {TimeSlider} from './time-slider';

class FilterHeader extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={{
        alignSelf: 'stretch',
        paddingVertical: 10,
        alignItems: 'center',
        flexDirection: 'row',
      }}>
        <View style={{
          height: 2,
          width: 30,
          backgroundColor: '#EEEEEE',
        }} />
        <Text style={{
          fontSize: 17,
          paddingHorizontal: 15,
        }}>{ this.props.text }</Text>
        <View style={{
          height: 2,
          flex: 1,
          backgroundColor: '#EEEEEE',
        }} />
      </View>
    );
  }
}

export class SearchNotes extends React.Component {

  constructor(props) {
    super(props);
  }

  clickRecent() {
    this.props.onSearch(update(this.props.searchParams, {
      sort: {$set: 'recent'}
    }));
  }

  clickPopular() {
    this.props.onSearch(update(this.props.searchParams, {
      sort: {$set: 'popular'}
    }));
  }

  clickMine() {
    this.props.onSearch(update(this.props.searchParams, {
      mine: {$set: !this.props.searchParams.mine}
    }));
  }

  tagID(tag) {
    return tag.tag_id || tag.field_option_id;
  }

  clickTag(tag) {
    this.props.onSearch(update(this.props.searchParams, {
      tags: {
        $apply: (tag_ids) => {
          if (tag_ids == null) tag_ids = this.props.tags.map((tag) => this.tagID(tag));
          if (tag_ids.indexOf(this.tagID(tag)) !== -1) {
            return tag_ids.filter((tag_id) => tag_id !== this.tagID(tag));
          } else {
            return tag_ids.concat(this.tagID(tag));
          }
        }
      }
    }));
  }

  changeDates(min_time, max_time) {
    this.props.onSearch(update(this.props.searchParams, {
      min_time: {$set: min_time},
      max_time: {$set: max_time},
    }));
  }

  userTyped(text) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.props.onSearch(update(this.props.searchParams, {
        text: {$set: text}
      }));
    }, 250);
  }

  tagChecked(tag) {
    const tags = this.props.searchParams.tags;
    if (tags == null) {
      return true;
    } else {
      return tags.indexOf(this.tagID(tag)) !== -1;
    }
  }

  render() {
    let {sort, mine, tags, text, min_time, max_time} = this.props.searchParams
    if (sort == null) sort = 'recent';
    if (mine == null) mine = false;
    if (tags == null) tags = [];
    if (text == null) text = '';
    if (min_time == null) min_time = 'min';
    if (max_time == null) max_time = 'max';
    return <ScrollView style={{
      backgroundColor: 'white',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }} contentContainerStyle={{
      alignItems: 'center',
    }}>
      <TextInput
        placeholder="search"
        placeholderTextColor="rgb(180,180,180)"
        defaultValue={text}
        onChangeText={this.userTyped.bind(this)}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          alignSelf: 'stretch',
          height: 40,
          borderColor: '#bbb',
          borderWidth: 1,
          margin: 10,
          padding: 10,
          borderRadius: 25,
        }}
      />
      <FilterHeader text="Date Range:" />
      <TimeSlider
        minBound={this.props.game.created.getTime()}
        maxBound={Date.now()}
        p1={min_time}
        p2={max_time}
        onChange={this.changeDates.bind(this)}
      />
      <FilterHeader text="Category:" />
      <View style={{
        alignSelf: 'stretch',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: 10,
      }}>
        {
          this.props.tags.map((tag) => {
            const checked = this.tagChecked(tag);
            const color = this.props.getColor(tag);
            return <View key={this.tagID(tag)} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginVertical: 4,
            }}>
              <View style={{alignItems: 'center', flexDirection: 'row'}}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: color,
                  marginRight: 7,
                }} />
                <Text>{ tag.tag || tag.option }</Text>
              </View>
              <Switch
                value={checked}
                onValueChange={() => this.clickTag(tag)}
              />
            </View>;
          })
        }
      </View>
      <View style={{
        padding: 20,
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        alignSelf: 'stretch',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 5,
        }}>
          <Text>Sort gallery by:</Text>
        </View>
        <TouchableOpacity style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 5,
          marginHorizontal: 5,
          borderColor: 'rgba(0,0,0,0)',
          borderBottomColor: sort === 'recent' ? 'black' : undefined,
          borderWidth: 2,
        }} onPress={this.clickRecent.bind(this)}>
          <Text style={{color: sort === 'recent' ? 'black' : '#D3D3D3'}}>newest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 5,
          marginHorizontal: 5,
          borderColor: 'rgba(0,0,0,0)',
          borderBottomColor: sort === 'popular' ? 'black' : undefined,
          borderWidth: 2,
        }} onPress={this.clickPopular.bind(this)}>
          <Text style={{color: sort === 'popular' ? 'black' : '#D3D3D3'}}>popularity</Text>
        </TouchableOpacity>
      </View>
      <View style={{
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
      }}>
        <Text>
          Only show my notes
        </Text>
        <Switch
          value={mine}
          onChange={() => this.clickMine()}
        />
      </View>
    </ScrollView>
  }

  getTagCount(tag) {
    if (this.props.allNotes == null) return '...';

    if (this.cachedCounts == null || this.props.allNotes !== this.cachedCounts.allNotes) {
      this.cachedCounts = {allNotes: this.props.allNotes};
    }
    if (this.cachedCounts[this.tagID(tag)] == null) {
      if (tag instanceof Tag) {
        this.cachedCounts[this.tagID(tag)] = this.cachedCounts.allNotes.filter((note) => note.tag_id === this.tagID(tag)).length;
      } else {
        this.cachedCounts[this.tagID(tag)] = this.cachedCounts.allNotes.filter((note) => {
          const field_data = note.field_data[tag.field_id];
          if (field_data) {
            return parseInt(field_data) === tag.field_option_id;
          } else {
            return false;
          }
        }).length;
      }
    }
    return this.cachedCounts[this.tagID(tag)];
  }


}

SearchNotes.propTypes = {
  auth: T.instanceOf(Auth).isRequired,
  game: T.instanceOf(Game).isRequired,
  // tags: T.arrayOf(T.instanceOf(Tag)),
  searchParams: T.any,
  onSearch: T.func,
  getColor: T.func,
};

SearchNotes.defaultProps = {
  tags: [],
  searchParams: {},
  onSearch: function(){},
  getColor: () => 'black',
};