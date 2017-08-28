'use strict'

import React from 'react';
const T = React.PropTypes;
import update from 'immutability-helper';

// @ifdef NATIVE
import
{ TouchableOpacity
, View
, Text
, ScrollView
, StyleSheet
, TextInput
} from 'react-native';
import {styles} from './styles';
// @endif

import
{ Auth
, Tag
, Game
} from './aris';

import {TimeSlider} from './time-slider';
import {clicker} from './utils';

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
    const activityOn = {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      padding: 10,
      backgroundColor: 'rgb(32,37,49)',
      borderColor: 'rgb(32,37,49)',
      borderWidth: 1,
    };
    const activityOff = {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      padding: 10,
      backgroundColor: 'white',
      borderColor: 'rgb(32,37,49)',
      borderWidth: 1,
    };
    const activityTextOn = {
      color: 'white',
    };
    const activityTextOff = {
      color: 'rgb(32,37,49)',
    };
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
        placeholder="Search…"
        defaultValue={text}
        onChangeText={this.userTyped.bind(this)}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          alignSelf: 'stretch',
          height: 50,
          borderColor: '#bbb',
          borderWidth: 1,
          margin: 10,
          padding: 10,
          borderRadius: 25,
        }}
      />
      <View style={{
        alignSelf: 'stretch',
        borderTopColor: 'black',
        borderTopWidth: 2,
        paddingTop: 10,
        paddingBottom: 5,
        alignItems: 'center',
      }}>
        <Text style={{fontSize: 18, fontWeight: 'bold'}}>BY DATE:</Text>
      </View>
      <TimeSlider
        minBound={this.props.game.created.getTime()}
        maxBound={Date.now()}
        p1={min_time}
        p2={max_time}
        onChange={this.changeDates.bind(this)}
      />
      <View style={{
        alignSelf: 'stretch',
        borderTopColor: 'black',
        borderTopWidth: 2,
        paddingTop: 10,
        paddingBottom: 5,
        alignItems: 'center',
        marginTop: 10,
      }}>
        <Text style={{fontSize: 18, fontWeight: 'bold'}}>BY ACTIVITY:</Text>
      </View>
      <View style={{
        alignSelf: 'stretch',
        flexDirection: 'row',
        margin: 10,
      }}>
        <TouchableOpacity onPress={this.clickRecent.bind(this)} style={{flex: 1}}>
          <View style={
            [
              (sort === 'recent' ? activityOn : activityOff),
              {borderTopLeftRadius: 12, borderBottomLeftRadius: 12}
            ]
          }>
            <Text style={
              sort === 'recent' ? activityTextOn : activityTextOff
            }>newest</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.clickPopular.bind(this)} style={{flex: 1}}>
          <View style={
            [
              (sort === 'popular' ? activityOn : activityOff),
              (this.props.auth.authToken == null ? {borderTopRightRadius: 12, borderBottomRightRadius: 12} : undefined)
            ]
          }>
            <Text style={
              sort === 'popular' ? activityTextOn : activityTextOff
            }>popular</Text>
          </View>
        </TouchableOpacity>
        {
          this.props.auth.authToken != null ?
            <TouchableOpacity onPress={this.clickMine.bind(this)} style={{flex: 1}}>
              <View style={
                [
                  (mine ? activityOn : activityOff),
                  {borderTopRightRadius: 12, borderBottomRightRadius: 12}
                ]
              }>
                <Text style={
                  mine ? activityTextOn : activityTextOff
                }>mine</Text>
              </View>
            </TouchableOpacity>
          : undefined
        }
      </View>
      <View style={{
        alignSelf: 'stretch',
        borderTopColor: 'black',
        borderTopWidth: 2,
        paddingTop: 10,
        paddingBottom: 5,
        alignItems: 'center',
      }}>
        <Text style={{fontSize: 18, fontWeight: 'bold'}}>BY CATEGORY:</Text>
      </View>
      <View style={{
        alignSelf: 'stretch',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
      }}>
        {
          this.props.tags.map((tag) => {
            const checked = tags.indexOf(tag.tag_id) !== -1;
            const color = this.props.getColor(tag);
            return <TouchableOpacity key={tag.tag_id} onPress={() => this.clickTag(tag)}>
              <View style={{
                backgroundColor: (checked ? color : 'white'),
                borderColor: color,
                borderWidth: 1,
                padding: 3,
                borderRadius: 3,
                margin: 5,
              }}>
                <Text style={{
                  color: (checked ? 'white' : color),
                  fontSize: 18,
                }}>
                  { checked ? `✓ ${tag.tag}` : `● ${tag.tag}` }
                </Text>
              </View>
            </TouchableOpacity>
          })
        }
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
        <p>
          {
            this.props.tags.map((tag) => {
              const checked = tags.indexOf(tag.tag_id) !== -1;
              const color = this.props.getColor(tag);
              return <a href="#" key={tag.tag_id}
                onClick={clicker(() => this.clickTag(tag))}
                className={`search-tag ${checked ? 'search-tag-on' : ''}`}
                style={{
                  borderColor: color,
                  color: checked ? undefined : color,
                  backgroundColor: checked ? color : undefined,
                }}
              >
                { checked ? `✓ ${tag.tag}` : `● ${tag.tag}` }
              </a>
            })
          }
        </p>
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
