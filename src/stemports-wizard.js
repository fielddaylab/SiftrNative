"use strict";

import React from "react";
import update from "immutability-helper";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView
} from "react-native";
import { styles, Text } from "./styles";
import { GuideLine } from "./stemports-picker";

const WizardLines = [
  {
    header: "First, Collect Violet's Field Notes",
    body: ((quest) => quest.tutorial_1),
  },
  {
    header: "Then, Visit Tour Stops",
    body: ((quest) => quest.tutorial_2),
  },
  {
    header: "Finally, we'll make our own scientific observations!",
    body: ((quest) => quest.tutorial_3),
  },
];

export class StemportsWizard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lineIndex: 0,
    };
  }

  render() {
    const header = WizardLines[this.state.lineIndex].header;
    const body = WizardLines[this.state.lineIndex].body;
    const isLastLine = this.state.lineIndex === WizardLines.length - 1;
    return (
      <View style={{
        flex: 1,
        alignItems: 'stretch',
      }}>
        <GuideLine
          style={{margin: 10}}
          text="Yay, let's get started! Here's what we'll do on this quest."
        />
        <Text style={{
          margin: 10,
          fontSize: 24,
          fontWeight: 'bold',
        }}>
          {header}
        </Text>
        <ScrollView style={{flex: 1}}>
          <Text style={{
            margin: 10,
          }}>
            {body(this.props.quest)}
          </Text>
        </ScrollView>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          borderBottomWidth: 2,
          borderBottomColor: 'rgb(223,230,237)',
          padding: 10,
        }}>
          {
            [...Array(WizardLines.length).keys()].map(i =>
              <TouchableOpacity
                key={i}
                onPress={() => this.setState({lineIndex: i})}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  margin: 5,
                  borderColor: i === this.state.lineIndex ? 'rgb(101,88,245)' : 'rgb(193,205,215)',
                  backgroundColor: i === this.state.lineIndex ? 'rgb(178,172,250)' : 'white',
                }}
              />
            )
          }
        </View>
        <TouchableOpacity
          onPress={isLastLine ? this.props.onClose : (() =>
            this.setState({lineIndex: this.state.lineIndex + 1})
          )}
          style={{
            alignSelf: isLastLine ? 'center' : 'flex-end',
            backgroundColor: 'rgb(101,88,245)',
            padding: 10,
            paddingLeft: 15,
            paddingRight: 15,
            margin: 15,
            borderRadius: 5,
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 17,
          }}>
            {isLastLine ? 'Start Quest!' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
