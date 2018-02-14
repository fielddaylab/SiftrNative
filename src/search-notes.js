'use strict'

import React from 'react';
import T from 'prop-types';
import update from 'immutability-helper';

// @ifdef NATIVE
import
{ TouchableOpacity
, View
, ScrollView
, StyleSheet
, TextInput
, Switch
} from 'react-native';
import {styles, Text} from './styles';
// @endif

import
{ Auth
, Tag
, Game
} from './aris';

// @ifdef WEB
import {ToggleSwitch} from './toggle';
// @endif

import {TimeSlider} from './time-slider';
import {clicker} from './utils';

// @ifdef NATIVE

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
// @endif

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

  clickTag(tag) {
    this.props.onSearch(update(this.props.searchParams, {
      tags: {
        $apply: (tag_ids) => {
          if (tag_ids == null) tag_ids = [];
          if (tag_ids.indexOf(tag.tag_id) !== -1) {
            return tag_ids.filter((tag_id) => tag_id !== tag.tag_id);
          } else {
            return tag_ids.concat(tag.tag_id);
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

  // @ifdef NATIVE
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
            const checked = tags.indexOf(tag.tag_id) !== -1;
            const color = this.props.getColor(tag);
            return <View key={tag.tag_id} style={{
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
                <Text>{ tag.tag }</Text>
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
    </ScrollView>
  }
  // @endif

  // @ifdef WEB
  render() {
    let {sort, mine, tags, text, min_time, max_time} = this.props.searchParams
    if (sort == null) sort = 'recent';
    if (mine == null) mine = false;
    if (tags == null) tags = [];
    if (text == null) text = '';
    if (min_time == null) min_time = 'min';
    if (max_time == null) max_time = 'max';
    return <div className="siftr-search">
      <p>
        <input type="text"
          placeholder="Search…"
          defaultValue={text}
          onChange={(e) => this.userTyped(e.target.value)}
          className="search-text"
        />
      </p>
      <hr />
      <h2>BY DATE:</h2>
      <TimeSlider
        minBound={this.props.game.created.getTime()}
        maxBound={Date.now()}
        p1={min_time}
        p2={max_time}
        onChange={this.changeDates.bind(this)}
      />
      <hr />
      <h2>BY ACTIVITY:</h2>
      <div className="activity-buttons">
        <a href="#"
          className={`activity-button ${sort === 'recent' ? 'activity-on' : ''}`}
          onClick={clicker(this.clickRecent.bind(this))}
        >
          newest
        </a>
        <a href="#"
          className={`activity-button ${sort === 'popular' ? 'activity-on' : ''}`}
          onClick={clicker(this.clickPopular.bind(this))}
        >
          popular
        </a>
        {
          this.props.auth.authToken !== null ?
            <a href="#"
              className={`activity-button ${mine ? 'activity-on' : ''}`}
              onClick={clicker(this.clickMine.bind(this))}
            >
              mine
            </a>
          : undefined
        }
      </div>
      <hr />
      <h2>BY CATEGORY:</h2>
      {
        this.props.tags.map((tag) => {
          const checked = tags.indexOf(tag.tag_id) !== -1;
          const color = this.props.getColor(tag);
          return (
            <p key={tag.tag_id}>
              <ToggleSwitch checked={checked} onClick={() => this.clickTag(tag)}>
                <span className="tag-badge" style={{backgroundColor: color}}>...</span>
                {' '}
                {tag.tag}
              </ToggleSwitch>
            </p>
          );
        })
      }
    </div>
  }
  // @endif

}

SearchNotes.propTypes = {
  auth: T.instanceOf(Auth).isRequired,
  game: T.instanceOf(Game).isRequired,
  tags: T.arrayOf(T.instanceOf(Tag)),
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
