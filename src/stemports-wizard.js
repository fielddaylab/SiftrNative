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
import { styles, Text, FixedMarkdown } from "./styles";
import { GuideLine } from "./stemports-picker";

const WizardLines = [
  {
    media_id: ((quest) => parseInt(quest.tutorial_1_media_id) || 0),
    header: ((quest) => quest.tutorial_1_title || "First, Collect Carson's Field Notes"),
    body: ((quest) => quest.tutorial_1 || "Carson left her field notes all over the place! Find and collect them so you can add them to your own field guide."),
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
            fontFamily: 'League Spartan',
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
            <FixedMarkdown text={line.body(this.props.quest)} />
          </View>
        </ScrollView>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          borderBottomColor: 'rgb(223,230,237)',
          padding: 10,
        }}>
          {
            [...Array(WizardLines.length).keys()].map(i =>
              <TouchableOpacity
                key={i}
                onPress={() => this.setState({lineIndex: i})}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 12,
                  borderWidth: 2,
                  margin: 5,
                  backgroundColor: i === this.state.lineIndex ? 'rgb(100,112,51)' : 'rgb(189,202,132)',
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
            backgroundColor: 'rgb(100,112,51)',
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
