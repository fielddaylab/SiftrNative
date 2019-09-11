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
        paddingTop: 80,
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
            props.status === 'active' && props.setCurrentQuest && (
              <View style={{
                margin: 15,
                alignItems: 'center',
              }}>
                <TouchableOpacity onPress={() =>
                  props.setCurrentQuest(props.quest)
                } style={{
                  backgroundColor: 'white',
                  padding: 10,
                  borderRadius: 10,
                  fontSize: 20,
                }}>
                  <Text>Set as Current Quest</Text>
                </TouchableOpacity>
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
            width: 278 * 0.45,
            height: 306 * 0.45,
          }}
          source={require("../web/assets/img/spirit_companion_01.png")}
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
          setCurrentQuest={this.props.setCurrentQuest}
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
          paddingTop: 80,
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
              width: 278 * 0.45,
              height: 306 * 0.45,
            }}
            source={require("../web/assets/img/spirit_companion_01.png")}
          />
        </View>
      </View>
    );
  }
}
