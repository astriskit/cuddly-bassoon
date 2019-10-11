import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator
} from "react-native";
import Sentiment from "sentiment";
import emojiSent from "emoji-sentiment";
import randomItem from "random-item";
import { emojiData } from "unicode-emoji-data";
import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import Constants from "expo-constants";
import Header from "./Header";

export default class App extends React.Component {
  state = {
    typing: "",
    messages: [],
    botThinking: true
  };

  componentDidMount() {
    this.sentAnalyzer = new Sentiment();
    this.setEmojis();
    this.setState({
      botThinking: false,
      messages: [{ sender: "/b/stupid-bot", message: "Hi!", key: "first" }]
    });
    this.pushNotif("Welcome. Talk to me, please!");
  }

  setEmojis() {
    this.emojiSent = emojiSent
      .map(emoji => {
        let foundEmoji = emojiData.find(
          ({ codepoint }) => codepoint == emoji.sequence
        );
        if (foundEmoji) {
          return { ...emoji, name: foundEmoji.name };
        } else {
          return emoji;
        }
      })
      .filter(
        ({ name = null }) =>
          name &&
          (name.toLowerCase().includes("face") ||
            name.toLowerCase().includes("heart") ||
            name.toLowerCase().includes("kiss") ||
            name.toLowerCase().includes("cat") ||
            name.toLowerCase().includes("monkey") ||
            name.toLowerCase().includes("bomb") ||
            name.toLowerCase().includes("collision") ||
            name.toLowerCase().includes("hand") ||
            name.toLowerCase().includes("man"))
      );
  }

  transformRange = val => {
    return ((val + 5) / 10) * 2 - 1;
  };

  botReact = lastMessage => {
    let { score } = this.sentAnalyzer.analyze(lastMessage);
    let top = this.transformRange(score);
    let delta = 1;
    let sents = this.emojiSent.filter(({ score }) =>
      top >= 0
        ? score >= top || score >= top + delta || score >= top - delta
        : score <= top || score <= top + delta || score <= top - delta
    );
    let items = [];
    for (i = 1; i < 4; i++) {
      items.push(randomItem(sents));
    }
    let message = "I dont know that!";
    if (!items.some(item => !item)) {
      message = items
        .map(item => String.fromCodePoint(`0x${item.sequence}`))
        .join("");
    }
    this.setState({
      botThinking: false,
      messages: [
        {
          sender: "/b/stupid-bot",
          message,
          key: this.state.messages.length.toString()
        },
        ...this.state.messages
      ]
    });
  };

  sendMessage = () => {
    const { typing: message, messages } = this.state;
    messages.unshift({
      sender: "/b/me",
      message,
      key: this.state.messages.length.toString()
    });
    this.setState(
      {
        typing: "",
        botThinking: true,
        messages
      },
      () => {
        setTimeout(() => {
          this.botReact(message);
        }, 400 + Math.random() * 1000);
      }
    );
  };

  async pushNotif(body) {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
      );
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Permissions.askAsync(
          Permissions.NOTIFICATIONS
        );
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      await Notifications.presentLocalNotificationAsync({
        title: "Chat-it reminder",
        body
      });
    } else {
      alert("Must use physical device for Push Notifications");
    }
  }

  renderItem({ item }) {
    return (
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.sender}>{item.sender}</Text>
          <Text style={styles.message}>{item.message}</Text>
        </View>
      </View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <Header title="stupid-react-bot" />
        <FlatList
          data={this.state.messages}
          renderItem={this.renderItem}
          inverted
        />
        <KeyboardAvoidingView behavior="padding">
          <View style={styles.footer}>
            <TextInput
              disabled={this.state.botThinking}
              value={this.state.typing}
              style={styles.input}
              underlineColorAndroid="transparent"
              placeholder="Type something nice"
              onChangeText={text => this.setState({ typing: text })}
            />
            {this.state.botThinking ? (
              <ActivityIndicator size="small" style={styles.send} />
            ) : (
              <TouchableOpacity onPress={this.sendMessage}>
                <Text style={styles.send}>Send</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  row: {
    flexDirection: "row",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  avatar: {
    borderRadius: 20,
    width: 40,
    height: 40,
    marginRight: 10
  },
  rowText: {
    flex: 1
  },
  message: {
    fontSize: 18
  },
  sender: {
    fontWeight: "bold",
    paddingRight: 10
  },
  footer: {
    flexDirection: "row",
    backgroundColor: "#eee"
  },
  input: {
    paddingHorizontal: 20,
    fontSize: 18,
    flex: 1
  },
  send: {
    alignSelf: "center",
    color: "lightseagreen",
    fontSize: 16,
    fontWeight: "bold",
    padding: 20
  }
});
