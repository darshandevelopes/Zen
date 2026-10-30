import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import Header from '../components/Header';
import React, {useState, useRef} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GoogleGenerativeAI} from '@google/generative-ai';
import Icon from 'react-native-vector-icons/FontAwesome';
import {GEMINI_API_KEY} from '../config/env';

const MessageCard = ({message}) => {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.card, isUser ? styles.userCard : styles.botCard]}>
      <Text style={styles.cardText}>{message.text}</Text>
    </View>
  );
};

const SakhaScreen = ({navigation}) => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef();

  async function handleSendPress(message) {
    const trimmed = (message || '').trim();
    if (!trimmed) {
      return;
    }
    setMessages(prevMessages => [
      ...prevMessages,
      {role: 'user', text: trimmed},
    ]);
    const replyText = await chatbotInteraction(trimmed);
    setMessages(prevMessages => [
      ...prevMessages,
      {role: 'model', text: replyText},
    ]);
  }

  async function chatbotInteraction(userInput) {
    try {
      if (!GEMINI_API_KEY) {
        return "I'm not configured with an API key yet. Please check your settings.";
      }
      const client = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = client.getGenerativeModel({model: 'gemini-2.5-flash'});
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [
              {
                text: 'Hello, You are my Stress, anxiety and depression therapist and also recommend movies based on mood only if asked.',
              },
            ],
          },
          {
            role: 'model',
            parts: [{text: 'Great to meet you. How are you feeling today?'}],
          },
        ],
        generationConfig: {
          maxOutputTokens: 100,
        },
      });
      const result = await chat.sendMessage(userInput);
      const response = await result.response;
      const responseText = response.text();
      return responseText || 'Okay I am listening, tell me more about it...';
    } catch (error) {
      console.warn('Error communicating with chatbot:', error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <Header title="सखा" navigation={navigation} />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({animated: true})
          }>
          {messages.map((message, index) => (
            <MessageCard key={index} message={message} />
          ))}
        </ScrollView>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Type your message here.."
            placeholderTextColor="#888"
            onChangeText={newText => setText(newText)}
            value={text}
          />

          <Pressable
            style={styles.send}
            onPress={() => {
              handleSendPress(text);
              setText('');
            }}>
            <Icon name="send" size={20} color="#000" />
          </Pressable>
        </View>
      </SafeAreaProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#F5F5DC',
    flex: 1,
  },
  card: {
    maxWidth: '75%',
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 10,
  },
  userCard: {
    alignSelf: 'flex-end',
    backgroundColor: '#CBA46F',
  },
  botCard: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  cardText: {
    color: '#000000',
    fontSize: 15,
  },
  row: {
    height: 60,
    borderTopWidth: 1,
    borderColor: '#D2B48C',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: '#F5F5DC',
  },
  input: {
    height: 40,
    paddingTop: 10,
    flex: 1,
    color: '#000000',
  },
  scrollView: {
    height: '100%',
    marginBottom: 60,
  },
  send: {
    paddingTop: 10,
    paddingLeft: 10,
    justifyContent: 'center',
  },
});

export default SakhaScreen;
