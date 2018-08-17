'use strict';

import React from 'react';
import T from 'prop-types';

import {Note} from './aris';

import {clicker} from './utils';

import
{ View
, TouchableOpacity
, ImageBackground
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import {CacheMedia} from './media';


// TODO: if the initial batch of thumbnails fits on screen,
// the infinite scroll view isn't attempting to load the next batch

export class SiftrThumbnails extends React.Component {
  constructor(props) {
    super(props);
  }

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
              <CacheMedia
                url={note.thumb_url}
                withURL={(url) =>
                  <ImageBackground source={
                    url != null ? {uri: url} : null
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
                  </ImageBackground>
                }
              />
            </TouchableOpacity>
          )
        }
      </View>
    </InfiniteScrollView>;
  }

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
