'use strict';

import React from 'react';
const T = React.PropTypes;

import {Note} from './aris';

import {clicker} from './utils';

// @ifdef NATIVE
import
{ View
, TouchableOpacity
, Image
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view'; // TODO test
// @endif

// @ifdef WEB
import InfiniteScroll from 'react-infinite-scroller';
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
    return <InfiniteScrollView
      ref="scroll"
      style={{
        backgroundColor: 'white',
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
          this.props.notes.map((note) =>
            <TouchableOpacity onPress={() => this.props.onSelectNote(note)} key={note.note_id}>
              <Image source={
                note.thumb_url != null ? {uri: note.thumb_url} : null
              } style={{
                width: 160,
                height: 160,
                margin: 5,
              }}>
                <View style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 15,
                  height: 15,
                  borderRadius: 999,
                  backgroundColor: this.props.getColor(note.tag_id),
                }} />
              </Image>
            </TouchableOpacity>
          )
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
              key={note.note_id}
              href="#"
              onClick={clicker(() => this.props.onSelectNote(note))}
            >
              <div
                className="siftr-thumbnail"
                style={{backgroundImage: `url(${note.thumb_url})`}}
              >
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
  loadMore: T.func,
  hasMore: T.bool,
};

SiftrThumbnails.defaultProps = {
  notes: [],
  getColor: () => 'white',
  onSelectNote: function(){},
  loadMore: function(){},
  hasMore: false,
};
