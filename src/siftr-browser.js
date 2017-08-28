'use strict';

// @ifdef WEB

import React from 'react';
const T = React.PropTypes;

import
{ Auth
, Game
} from './aris';

import {clicker, withSuccess, P, BUTTON} from './utils';

export class GameList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      downloadedGames: null,
    };
  }

  render() {
    if (this.props.games != null) {
      return <ul>
        {
          this.props.games.map((game) =>
            <li key={game.game_id}>
              <a href="#" onClick={clicker(() => this.props.onSelect(game))}>
                {game.name}
              </a>
            </li>
          )
        }
      </ul>;
    } else {
      return <p>Loading games...</p>;
    }
  }
}

GameList.propTypes = {
  games: T.arrayOf(T.instanceOf(Game)),
  onSelect: T.func,
  online: T.bool,
};

GameList.defaultProps = {
  games: null,
  onSelect: function(){},
  online: true,
};

export class SiftrURL extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: '',
    };
  }

  findSiftr() {
    this.props.auth.searchSiftrs({
      siftr_url: this.state.url
    }, withSuccess((games) => {
      if (games.length === 1) {
        this.props.onSelect(games[0]);
      }
    }));
  }

  render() {
    return <p>
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.keyCode === 13) {
            this.findSiftr();
          }
        }}
        placeholder="Enter a Siftr URL"
        value={this.state.url}
        onChange={(e) => this.setState({url: e.target.value})}
      />
      {' '}
      <BUTTON onClick={this.findSiftr.bind(this)}>Submit</BUTTON>
    </p>;
  }
}

SiftrURL.propTypes = {
  auth: T.instanceOf(Auth).isRequired,
  onSelect: T.func,
};

SiftrURL.defaultProps = {
  onSelect: function(){},
};

// @endif
