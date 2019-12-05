'use strict';

import React from 'react';
import {
  View
, ScrollView
, TouchableOpacity
, Image
} from 'react-native';
import {Text} from './styles';
import {CacheMedia} from './media';

export const getQuestProgress = (details) => {
  let progress = [];
  details && details.reqRoots.forEach(root => {
    if (!root.req) return;
    // this is all hacked for now, to match how generated quests look
    const requirement = root.req.ands[0].atoms[0].requirement;
    let done = root.ands[0].atoms.filter(o => o.bool).length;
    let total = root.ands[0].atoms.length;
    if (requirement === 'PLAYER_HAS_NOTE_WITH_QUEST') {
      done = root.ands[0].atoms[0].qty;
      total = root.ands[0].atoms[0].atom.qty;
    }
    let subquestLabel = root.req.ands[0].atoms[0].requirement;
    if (subquestLabel === 'PLAYER_HAS_ITEM') {
      subquestLabel = 'Explore and Collect Remnants';
    } else if (subquestLabel === 'PLAYER_HAS_NOTE_WITH_QUEST') {
      subquestLabel = `Make ${total} Observations`;
    }
    let circles = [];
    for (let i = 0; i < total; i++) {
      circles.push(i < done);
    }
    progress.push({
      subquestLabel: subquestLabel,
      done: done,
      total: total,
      root: root,
    });
  });
  return progress;
};

export const QuestDotDetails = function(props) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: 'rgb(67,139,176)',
      flexDirection: 'column',
      paddingLeft: 10,
      paddingRight: 10,
    }}>
      <View style={{height: 80}} />
      <View style={{
        backgroundColor: 'white',
        flex: 1,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingTop: 10,
      }}>
        <ScrollView style={{flex: 1, padding: 5}}>
          <View style={{
            flexDirection: 'row',
          }}>
            <Text style={{flex: 1, margin: 10, fontSize: 20}}>{props.currentQuest.name}</Text>
          </View>
          {
            (() => {
              if (!props.quests) return;
              if (!props.currentQuest) return;
              const details = props.quests &&
                props.quests.displayInfo &&
                props.quests.displayInfo.find(o =>
                  parseInt(o.quest.quest_id) === parseInt(props.currentQuest.quest_id)
                );
              const progress = getQuestProgress(details);
              return progress.map((o, i) => {
                const {subquestLabel, done, total, root} = o;
                let circles = [];
                for (let i = 0; i < total; i++) {
                  circles.push(i < done);
                }
                return (
                  <View key={root.req.requirement_root_package_id} style={{
                    padding: 15,
                    borderColor: 'black',
                    borderTopWidth: 1,
                    marginLeft: 10,
                    marginRight: 10,
                    paddingLeft: 5,
                    paddingRight: 5,
                  }}>
                    <Text style={{margin: 5}}>
                      {subquestLabel}
                    </Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                      {circles.map((b, i) =>
                        <View
                          key={i}
                          style={{
                            backgroundColor: b ? 'rgb(178,172,250)' : 'white',
                            borderColor: 'black',
                            borderWidth: 2,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            margin: 3,
                          }}
                        />
                      )}
                    </View>
                  </View>
                );
              });
            })()
          }
        </ScrollView>
        <View style={{
          margin: 15,
          alignItems: 'center',
        }}>
          <TouchableOpacity onPress={props.onClose}>
            <Image
              style={{
                width: 140 * 0.45,
                height: 140 * 0.45,
              }}
              source={require("../web/assets/img/quest-close.png")}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
        <Image
          style={{
            width: 72,
            height: 78,
          }}
          source={require("../web/assets/img/puffin.png")}
        />
      </View>
    </View>
  );
}

export const QuestDetails = function(props) {
  const media_id = props.quest[props.status + '_media_id'];
  return (
    <View style={{
      flex: 1,
      backgroundColor: 'rgb(67,139,176)',
      flexDirection: 'column',
      paddingLeft: 10,
      paddingRight: 10,
    }}>
      <View style={{height: 80}} />
      <View style={{
        backgroundColor: '#aea',
        flex: 1,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingTop: 10,
      }}>
        <ScrollView style={{flex: 1}}>
          {
            props.message && (
              <View style={{
                margin: 15,
              }}>
                <Text>{ props.message }</Text>
              </View>
            )
          }
          {
            media_id && (
              <CacheMedia
                media_id={media_id}
                auth={props.auth}
                online={true}
                withURL={(url) => (
                  <View>
                    <Image
                      source={url}
                      style={{
                        height: 200,
                        resizeMode: 'contain',
                      }}
                    />
                  </View>
                )}
              />
            )
          }
          <View style={{
            margin: 15,
          }}>
            <Text style={{fontWeight: 'bold'}}>{ props.quest.name }</Text>
          </View>
          <View style={{
            margin: 15,
          }}>
            <Text>{ props.quest[props.status + '_description'] }</Text>
          </View>
          {
            (props.quest.sub_active || []).map(sub =>
              <View key={sub.quest_id} style={{margin: 15}}>
                <Text>[ ] {sub.name}</Text>
              </View>
            )
          }
          {
            (props.quest.sub_complete || []).map(sub =>
              <View key={sub.quest_id} style={{margin: 15}}>
                <Text>[x] {sub.name}</Text>
              </View>
            )
          }
        </ScrollView>
        <View style={{
          margin: 15,
          alignItems: 'center',
        }}>
          <TouchableOpacity onPress={props.onClose}>
            <Image
              style={{
                width: 140 * 0.45,
                height: 140 * 0.45,
              }}
              source={require("../web/assets/img/quest-close.png")}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
        <Image
          style={{
            width: 72,
            height: 78,
          }}
          source={require("../web/assets/img/puffin.png")}
        />
      </View>
    </View>
  );
}

const QuestEntry = function(props) {
  return (
    <TouchableOpacity onPress={props.onPress} style={{
      padding: 15,
      borderColor: '#092E50',
      borderTopWidth: 1,
      borderBottomWidth: 1,
    }}>
      <Text style={{fontWeight: 'bold'}}>{props.quest.name}</Text>
      <Text>{props.quest[props.status + '_description']}</Text>
    </TouchableOpacity>
  );
};

export class QuestsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewingQuest: null,
      tab: 'active',
    };
  }

  render() {
    if (this.state.viewingQuest) {
      return (
        <QuestDetails
          quest={this.state.viewingQuest.quest}
          status={this.state.viewingQuest.status}
          onClose={() => this.setState({viewingQuest: null})}
          auth={this.props.auth}
        />
      );
    }
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'rgb(67,139,176)',
        flexDirection: 'column',
        paddingLeft: 10,
        paddingRight: 10,
      }}>
        <View style={{height: 80}} />
        <View style={{
          backgroundColor: '#aea',
          flex: 1,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          paddingTop: 10,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingBottom: 10,
          }}>
            <TouchableOpacity style={{
              borderBottomWidth: 4,
              borderBottomColor: this.state.tab === 'active' ? '#5DE3D4' : 'rgba(0,0,0,0)',
              padding: 5,
            }} onPress={() => this.setState({tab: 'active'})}>
              <Text>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              borderBottomWidth: 4,
              borderBottomColor: this.state.tab === 'complete' ? '#5DE3D4' : 'rgba(0,0,0,0)',
              padding: 5,
            }} onPress={() => this.setState({tab: 'complete'})}>
              <Text>Complete</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{flex: 1}}>
            {
              this.props.quests && (
                this.props.quests[this.state.tab].map((quest) =>
                  <QuestEntry
                    key={quest.quest_id}
                    quest={quest}
                    onPress={() => this.setState({viewingQuest: {quest: quest, status: this.state.tab}})}
                    status={this.state.tab}
                  />
                )
              )
            }
          </ScrollView>
          <View style={{
            margin: 15,
            alignItems: 'center',
          }}>
            <TouchableOpacity onPress={this.props.onClose}>
              <Image
                style={{
                  width: 140 * 0.45,
                  height: 140 * 0.45,
                }}
                source={require("../web/assets/img/quest-close.png")}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{
          position: 'absolute',
          top: 10,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}>
          <Image
            style={{
              width: 72,
              height: 78,
            }}
            source={require("../web/assets/img/puffin.png")}
          />
        </View>
      </View>
    );
  }
}
