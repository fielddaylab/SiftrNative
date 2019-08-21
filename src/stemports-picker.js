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
import {deserializeGame} from "./aris";
const RNFS = require("react-native-fs");

export class StemportsPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      games: [],
      downloadedGames: [],
    };
  }

  componentWillMount() {
    this.getGames(1, 0);
    this.loadDownloadedGames();
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

  loadDownloadedGames() {
    this.setState({downloadedGames: []}, () => {
      RNFS.readDir(`${RNFS.DocumentDirectoryPath}/siftrs`).then(items => {
        items.forEach(item => {
          RNFS.exists(`${item.path}/download_timestamp.txt`).then(exist => {
            if (exist) {
              RNFS.readFile(`${item.path}/game.txt`).then(json => {
                const game = deserializeGame(JSON.parse(json));
                this.setState(state => update(state, {downloadedGames: {$push: [game]}}));
              });
            }
          });
        });
      });
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
        this.props.auth.call('client.touchItemsForPlayer', {
          game_id: game.game_id,
        }, () => {
          this.props.auth.call('instances.getInstancesForGame', {
            game_id: game.game_id,
            owner_id: this.props.auth.authToken.user_id,
          }, (res) => {
            if (res.returnCode === 0) {
              RNFS.writeFile(`${siftrDir}/inventory.txt`, JSON.stringify(res.data));
              resolve();
            }
          });
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
      RNFS.writeFile(`${siftrDir}/game.txt`, JSON.stringify(game)),
    ]).then(RNFS.writeFile(`${siftrDir}/download_timestamp.txt`, Date.now()));
  }

  render() {
    return (
      <ScrollView>
        <Text>Downloaded Games</Text>
        {
          this.state.downloadedGames.map(game => (
            <NativeCard
              key={game.game_id}
              game={game}
              onSelect={() => this.props.onSelect(game)}
              cardMode="compact"
              auth={this.props.auth}
              online={this.props.online}
            />
          ))
        }
        <Text>Available Games</Text>
        {
          this.state.games.map(game => (
            <NativeCard
              key={game.game_id}
              game={game}
              onSelect={() => this.initializeGame(game).then(() => this.loadDownloadedGames())}
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
