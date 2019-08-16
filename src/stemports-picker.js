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
const RNFS = require("react-native-fs");

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

  initializeGame(game) {
    const siftrDir = `${RNFS.DocumentDirectoryPath}/siftrs/${game.game_id}`;
    return Promise.all([
      new Promise((resolve, reject) => {
        this.props.auth.call('plaques.getPlaquesForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/plaques.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('items.getItemsForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/items.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('tags.getTagsForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/tags.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('tags.getObjectTagsForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/object_tags.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('quests.getQuestsForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/quests.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('requirements.getRequirementRootPackagesForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/requirement_root_packages.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('requirements.getRequirementAndPackagesForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/requirement_and_packages.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('requirements.getRequirementAtomsForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/requirement_atoms.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('requirements.getRequirementAtomsForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/requirement_atoms.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('instances.getInstancesForGame', {
          game_id: game.game_id,
          owner_id: this.props.auth.authToken.user_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/inventory.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('instances.getInstancesForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/instances.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('client.getLogsForPlayer', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/logs.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('factories.getFactoriesForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/factories.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.props.auth.call('triggers.getTriggersForGame', {
          game_id: game.game_id,
        }, (res) => {
          if (res.returnCode === 0) {
            RNFS.writeFile(`${siftrDir}/triggers.txt`, JSON.stringify(res.data));
            resolve();
          }
        });
      }),
    ]);
  }

  onSelect(game) {
    // TODO split initialize into a separate download step
    this.initializeGame(game).then(() => this.props.onSelect(game));
  }

  render() {
    return (
      <ScrollView>
        {
          this.state.games.map(game => (
            <NativeCard
              key={game.game_id}
              game={game}
              onSelect={this.onSelect.bind(this)}
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
