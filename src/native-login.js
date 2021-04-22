"use strict";

import React from "react";
import T from "prop-types";
import createClass from "create-react-class";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Dimensions,
  KeyboardAvoidingView
} from "react-native";
import { styles, Text } from "./styles";
import Hyperlink from 'react-native-hyperlink';

export var NativeLogin = createClass({
  displayName: "NativeLogin",
  getDefaultProps: function() {
    return {
      onLogin: function() {},
      onRegister: function() {}
    };
  },
  getInitialState: function() {
    return {
      page: "sign-in",
      keyboard: false,
      username: "",
      password: "",
      password2: "",
      email: ""
    };
  },
  doLogin: function() {
    this.props.onLogin(this.state.username, this.state.password);
  },
  doRegister: function() {
    if (this.state.password === "") {
      Alert.alert("You must enter a password.");
    } else if (this.state.password !== this.state.password2) {
      Alert.alert("Passwords don't match.");
    } else {
      this.props.onRegister(
        this.state.username,
        this.state.password,
        this.state.email
      );
    }
  },
  componentDidMount: function() {
    var verb;
    this.onKeyboardShow = () => {
      this.setState({
        keyboard: true
      });
    };
    this.onKeyboardHide = () => {
      this.setState({
        keyboard: false
      });
    };
    verb = Platform.OS === "ios" ? "Will" : "Did";
    Keyboard.addListener(`keyboard${verb}Show`, this.onKeyboardShow);
    Keyboard.addListener(`keyboard${verb}Hide`, this.onKeyboardHide);
  },
  componentWillUnmount: function() {
    var verb;
    verb = Platform.OS === "ios" ? "Will" : "Did";
    Keyboard.removeListener(`keyboard${verb}Show`, this.onKeyboardShow);
    Keyboard.removeListener(`keyboard${verb}Hide`, this.onKeyboardHide);
  },
  render: function() {
    var height, tablet;
    ({ height } = Dimensions.get("window"));
    tablet = height > 900;
    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={{
          flex: 1,
          flexDirection: "column"
        }}
      >
        <StatusBar barStyle="light-content" />
        <ImageBackground
          source={
            this.state.page === "sign-in"
              ? require("../web/assets/img/bg1.jpg")
              : require("../web/assets/img/bg2.jpg")
          }
          style={{
            flex: this.state.keyboard && !tablet ? 0 : 1,
            flexDirection: "column",
            backgroundColor: "rgba(0,0,0,0)",
            alignItems: "center",
            justifyContent: "space-between",
            width: null,
            height: null
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                height: 40
              }}
            />
          </TouchableWithoutFeedback>
          {!(this.state.keyboard && !tablet) ? (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <Image
                  source={require("../web/assets/img/stemports-logo.png")}
                  style={{
                    width: 1522 / 7,
                    height: 476 / 7,
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          ) : (
            void 0
          )}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-around",
                alignSelf: "stretch"
              }}
            >
              {this.props.viola ? (
                <TouchableOpacity
                  style={{
                    padding: 16,
                    borderBottomWidth: 7,
                    borderBottomColor: "rgba(0,0,0,0)"
                  }}
                  onPress={this.props.backToViola}
                >
                  <Text
                    style={{
                      color: "white"
                    }}
                  >
                    Back
                  </Text>
                </TouchableOpacity>
              ) : (
                void 0
              )}
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderBottomWidth: 7,
                  borderBottomColor:
                    this.state.page === "sign-in" ? "white" : "rgba(0,0,0,0)"
                }}
                onPress={() => {
                  this.setState({
                    page: "sign-in",
                    password: "",
                    password2: "",
                    email: ""
                  });
                }}
              >
                <Text
                  style={{
                    color: "white"
                  }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderBottomWidth: 7,
                  borderBottomColor:
                    this.state.page === "sign-up" ? "white" : "rgba(0,0,0,0)"
                }}
                onPress={() => {
                  this.setState({
                    page: "sign-up",
                    password: "",
                    password2: "",
                    email: ""
                  });
                }}
              >
                <Text
                  style={{
                    color: "white"
                  }}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ImageBackground>
        {function() {
          switch (this.state.page) {
            case "sign-in":
              return (
                <View
                  style={{
                    flex: 1,
                    flexDirection: "column",
                    backgroundColor: "white",
                  }}
                >
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "stretch"
                      }}
                    >
                      <TextInput
                        placeholder="Username"
                        placeholderTextColor="rgb(180,180,180)"
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus={true}
                        onChangeText={username => {
                          this.setState({ username });
                        }}
                        value={this.state.username}
                        onSubmitEditing={() => {
                          this.passwordBox.focus();
                        }}
                        returnKeyType="next"
                      />
                      <TextInput
                        ref={box => {
                          this.passwordBox = box;
                        }}
                        placeholder="Password"
                        placeholderTextColor="rgb(180,180,180)"
                        secureTextEntry={true}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={password => {
                          this.setState({ password });
                        }}
                        value={this.state.password}
                        onSubmitEditing={this.doLogin}
                        returnKeyType="go"
                      />
                    </View>
                  </TouchableWithoutFeedback>
                  <TouchableOpacity
                    onPress={
                      this.props.online ? this.doLogin : undefined
                    }
                    style={{
                      backgroundColor:
                        this.props.online ? "rgb(97,132,63)" : 'gray',
                      alignItems: "center",
                      justifyContent: "center",
                      paddingTop: 20,
                      paddingBottom: 35, // for iphone x
                      flexDirection: 'row',
                    }}
                  >
                    {
                      this.props.online || (
                        <Image
                          style={{
                            resizeMode: "contain",
                            width: 112 / 4,
                            height: 82 / 4,
                            marginRight: 13,
                          }}
                          source={require("../web/assets/img/no-internet.png")}
                        />
                      )
                    }
                    <Text
                      style={{
                        color: "white"
                      }}
                    >
                      {
                        this.props.online ? 'Log in' : 'No connection'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            case "sign-up":
              return (
                <View
                  style={{
                    flex: 1,
                    flexDirection: "column",
                    backgroundColor: "white",
                  }}
                >
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "stretch"
                      }}
                    >
                      <TextInput
                        placeholder="Username"
                        placeholderTextColor="rgb(180,180,180)"
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus={true}
                        onChangeText={username => {
                          this.setState({ username });
                        }}
                        value={this.state.username}
                        onSubmitEditing={() => {
                          this.passwordBox.focus();
                        }}
                        returnKeyType="next"
                      />
                      <TextInput
                        ref={box => {
                          this.passwordBox = box;
                        }}
                        placeholder="Password"
                        placeholderTextColor="rgb(180,180,180)"
                        secureTextEntry={true}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={password => {
                          this.setState({ password });
                        }}
                        value={this.state.password}
                        onSubmitEditing={() => {
                          this.password2Box.focus();
                        }}
                        returnKeyType="next"
                      />
                      <TextInput
                        ref={box => {
                          this.password2Box = box;
                        }}
                        placeholder="Password (confirm)"
                        placeholderTextColor="rgb(180,180,180)"
                        secureTextEntry={true}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={password2 => {
                          this.setState({ password2 });
                        }}
                        value={this.state.password2}
                        onSubmitEditing={() => {
                          this.emailBox.focus();
                        }}
                        returnKeyType="next"
                      />
                      <TextInput
                        ref={box => {
                          this.emailBox = box;
                        }}
                        placeholder="Email (optional)"
                        placeholderTextColor="rgb(180,180,180)"
                        secureTextEntry={true}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={email => {
                          this.setState({ email });
                        }}
                        value={this.state.email}
                        onSubmitEditing={this.doRegister}
                        returnKeyType="go"
                      />
                      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                        <Hyperlink
                          linkStyle={{color: '#2980b9'}}
                          linkText={(url) => 'Terms of Use'}
                          linkDefault={true}
                        >
                          <Text>
                            https://docs.google.com/document/d/16P8kIfHka-zHXoQcd9mWlUWiOkaTp6I7UcpD_GoB8LY/edit
                          </Text>
                        </Hyperlink>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                  <TouchableOpacity
                    onPress={this.doRegister}
                    style={{
                      backgroundColor: "rgb(97,132,63)",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingTop: 20,
                      paddingBottom: 35, // for iphone x
                    }}
                  >
                    <Text
                      style={{
                        color: "white"
                      }}
                    >
                      Create account
                    </Text>
                  </TouchableOpacity>
                </View>
              );
          }
        }.call(this)}
      </KeyboardAvoidingView>
    );
  }
});
