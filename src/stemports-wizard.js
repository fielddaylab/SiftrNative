"use strict";

import React from "react";
import update from "immutability-helper";
import {CacheMedia} from './media';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView
} from "react-native";
import { styles, Text } from "./styles";
import { GuideLine } from "./stemports-picker";
import Markdown from "react-native-simple-markdown";

const WizardLines = [
  {
    header: ((quest) => quest.tutorial_1_title || "First, Collect Violet's Field Notes"),
    media_id: ((quest) => parseInt(quest.tutorial_1_media_id) || 0),
    body: ((quest) => quest.tutorial_1 || "Violet left her field notes all over the place! Find and collect them so you can add them to your own field guide."),
  },
  {
    header: ((quest) => quest.tutorial_2_title || "Then, Visit Tour Stops"),
    media_id: ((quest) => parseInt(quest.tutorial_2_media_id) || 0),
    body: ((quest) => quest.tutorial_2 || "Find all the tour stops along the way, and visit each one. You'll learn new things, and collect extra field notes!"),
  },
  {
    header: ((quest) => quest.tutorial_3_title || "Finally, we'll make our own scientific observations!"),
    media_id: ((quest) => parseInt(quest.tutorial_3_media_id) || 0),
    body: ((quest) => quest.tutorial_3 || "Once you create your own Field Guide, you'll be able to find new examples and document them!"),
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
    const line = WizardLines[this.state.lineIndex];
    const isLastLine = this.state.lineIndex === WizardLines.length - 1;
    return (
      <View style={{
        flex: 1,
        alignItems: 'stretch',
      }}>
        <ScrollView style={{flex: 1}}>
          <Text style={{
            margin: 10,
            fontSize: 24,
            fontWeight: 'bold',
          }}>
            {line.header(this.props.quest)}
          </Text>
          <CacheMedia
            media_id={line.media_id(this.props.quest)}
            auth={this.props.auth}
            online={this.props.online}
            withURL={(url) => (
              <Image
                source={url}
                style={{
                  height: 200,
                  resizeMode: 'contain',
                }}
              />
            )}
          />
          <View style={{
            margin: 10,
          }}>
            <Markdown>{line.body(this.props.quest)}</Markdown>
          </View>
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
