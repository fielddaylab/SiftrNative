"use strict";

import React from "react";
import update from "immutability-helper";
import {
  View,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { styles, Text } from "./styles";
import { NativeCard } from './native-browser';

export class StemportsPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      games: [],
    };
  }

  componentWillMount() {
    this.getGames(1, 0);
  }

  getGames(game_id, missed) {
    if (missed >= 20) {
      return;
    }
    this.props.auth.getGame({game_id}, res => {
      if (res.returnCode === 0) {
        this.setState(state => update(state, {games: {$push: [res.data]}}));
        this.getGames(game_id + 1, 0);
      } else {
        this.getGames(game_id + 1, missed + 1);
      }
    });
  }

  render() {
    return (
      <ScrollView>
        {
          this.state.games.map(game => (
            <NativeCard
              key={game.game_id}
              game={game}
              onSelect={this.props.onSelect}
              cardMode="compact"
              auth={this.props.auth}
              online={this.props.online}
            />
          ))
        }
      </ScrollView>
    );
  }
}
