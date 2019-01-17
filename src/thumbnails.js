'use strict';

import React from 'react';
import T from 'prop-types';

import {Note} from './aris';

import {clicker} from './utils';

// @ifdef NATIVE
import { Text } from "./styles";
import
{ View
, TouchableOpacity
, Image
, Platform
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import {CacheMedia} from './media';
// @endif

// @ifdef WEB
import InfiniteScroll from 'react-infinite-scroller';
// @endif

// TODO: if the initial batch of thumbnails fits on screen,
// the infinite scroll view isn't attempting to load the next batch

// @ifdef NATIVE
class NoteCard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TouchableOpacity onPress={() => this.props.onSelectNote(this.props.note)} style={{
        borderRadius: 5,
        margin: 5,
        alignItems: 'stretch',
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: {height: 2},
        elevation: 3,
        width: 180,
      }}>
        <View style={{
          // these can't just be on the Image on iOS, see
          // https://facebook.github.io/react-native/docs/images#ios-border-radius-styles
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          overflow: 'hidden',
        }}>
          <Image source={this.props.source} style={{
            width: 180,
            height: 115,
            resizeMode: 'cover',
          }} />
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Text style={{flex: 1, margin: 7, fontWeight: 'bold'}}>
            {this.props.note.user.display_name}
          </Text>
          <View style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            margin: 7,
            backgroundColor: this.props.getColor(this.props.note.tag_id),
          }} />
        </View>
        <Text style={{margin: 7}} numberOfLines={1}>
          {this.props.note.description}
        </Text>
      </TouchableOpacity>
    );
  }
}
// @endif

export class SiftrThumbnails extends React.Component {
  constructor(props) {
    super(props);
  }

  // @ifdef NATIVE
  scrollTop() {
    if (this.refs.scroll != null) {
      this.refs.scroll.scrollTo({y: 0, animated: false});
    }
  }

  render() {
    if (this.props.view === 'hybrid') {
      return (
        <InfiniteScrollView
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
          canLoadMore={this.props.hasMore}
          onLoadMoreAsync={this.props.loadMore}
          horizontal={true}
        >
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}>
            {
              this.props.notes.map((note) =>
                <CacheMedia
                  key={note.note_id}
                  url={note.thumb_url}
                  online={this.props.online}
                  withURL={(url) =>
                    <NoteCard
                      source={url}
                      note={note}
                      onSelectNote={this.props.onSelectNote}
                      getColor={this.props.getColor}
                    />
                  }
                />
              )
            }
          </View>
        </InfiniteScrollView>
      );
    }
    return <InfiniteScrollView
      ref="scroll"
      style={{
        backgroundColor: 'rgb(246,246,246)',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
      canLoadMore={this.props.hasMore}
      onLoadMoreAsync={this.props.loadMore}
    >
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        {
          this.props.pendingNotes.map(({dir, json}) => {
            json = JSON.parse(json);
            let note = new Note(json);
            if (note.game_id !== this.props.game.game_id) return null;
            note.pending = true;
            note.dir = dir.path;
            note.files = json.files;
            let url = '';
            if (Platform.OS === "ios") {
              url = `${dir.path}/${json.files[0].filename}`;
            } else {
              url = `file://${dir.path}/${json.files[0].filename}`;
            }
            return (
              <NoteCard
                key={dir.name}
                source={{uri: url}}
                note={note}
                onSelectNote={this.props.onSelectNote}
                getColor={this.props.getColor}
              />
            );
          }).concat(this.props.notes.map((note) =>
            <CacheMedia
              key={note.note_id}
              url={note.thumb_url}
              online={this.props.online}
              withURL={(url) =>
                <NoteCard
                  source={url}
                  note={note}
                  onSelectNote={this.props.onSelectNote}
                  getColor={this.props.getColor}
                />
              }
            />
          ))
        }
      </View>
    </InfiniteScrollView>;
  }
  // @endif

  // @ifdef WEB
  scrollTop() {
    if (this.refs.scroll != null) {
      this.refs.scroll.scrollTop = 0;
    }
  }

  render() {
    return <div className="siftr-thumbs" ref="scroll">
      <InfiniteScroll
        hasMore={this.props.hasMore}
        loadMore={this.props.loadMore}
        useWindow={false}
        initialLoad={false}
      >
        {
          this.props.notes.map((note) =>
            <a
              className={
                "siftr-thumbnail-card" +
                (this.props.mapHover.indexOf(note.note_id) !== -1 ? ' hybrid-hover' : '')
              }
              key={note.note_id}
              href="#"
              onClick={clicker(() => this.props.onSelectNote(note))}
              onMouseEnter={() => this.props.onMouseEnter(note)}
              onMouseLeave={() => this.props.onMouseLeave(note)}
            >
              <div
                className="siftr-thumbnail"
                style={{backgroundImage: note.thumb_url ? `url(${note.thumb_url})` : undefined}}
              />
              <div className="siftr-thumbnail-info">
                <div className="siftr-thumbnail-username">{note.user.display_name}</div>
                <div
                  className="siftr-thumbnail-dot"
                  style={{backgroundColor: this.props.getColor(note.tag_id)}}
                />
              </div>
            </a>
          )
        }
      </InfiniteScroll>
    </div>
  }
  // @endif
}

SiftrThumbnails.propTypes = {
  notes: T.arrayOf(T.instanceOf(Note)),
  getColor: T.func,
  onSelectNote: T.func,
  onMouseEnter: T.func,
  onMouseLeave: T.func,
  loadMore: T.func,
  hasMore: T.bool,
};

SiftrThumbnails.defaultProps = {
  notes: [],
  getColor: () => 'white',
  onSelectNote: function(){},
  onMouseEnter: function(){},
  onMouseLeave: function(){},
  loadMore: function(){},
  hasMore: false,
};
