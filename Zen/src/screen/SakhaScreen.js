import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {GoogleGenerativeAI} from '@google/generative-ai';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GEMINI_API_KEY} from '../config/env';
import {isCrisis} from '../worry/judge';
import {Disclaimer, ScreenHeader, useBarStyle} from '../components/ui';
import {colors, radius, space, type} from '../theme';

// SDK 0.5 has no systemInstruction, so the persona is set as an opening exchange.
const PERSONA = `You are Sakha (सखा, Marathi for "friend"), the user's warm, supportive friend inside the Zen app. Speak as "your Sakha", never "a Sakha".
- You are not a therapist or doctor; never claim to be one or diagnose anything.
- Keep replies short: 2-4 sentences, plain text, no markdown.
- Listen first, reflect feelings back, ask one gentle question at a time.
- When it fits, suggest the app's tools: "Breathe" (a 2-minute paced-breathing round) or "Worry battle" (take a worry apart with three questions).
- Reply in the user's language: English, Hindi or Hinglish.
- If the user mentions self-harm or suicide, respond with care and urge them to call Tele-MANAS on 14416 (free, 24x7) or 112 in an emergency.`;
const GREETING =
  "Hi, I'm your Sakha. Sakha means 'friend' in Marathi, and that's what I'm here to be. What's on your mind today?";
const STARTERS = [
  "I can't stop overthinking",
  'Stressed about exams',
  'I just need to vent',
];

// shortcut: Gemini key ships in the app (owner's call, not public yet); move behind a server proxy before release.
const newChat = () =>
  new GoogleGenerativeAI(GEMINI_API_KEY)
    .getGenerativeModel({model: 'gemini-2.5-flash'})
    .startChat({
      history: [
        {role: 'user', parts: [{text: PERSONA}]},
        {role: 'model', parts: [{text: GREETING}]},
      ],
    });

const Bubble = ({message}) => {
  if (message.role === 'crisis') {
    return (
      <View style={[styles.bubble, styles.crisis]}>
        <Text style={styles.crisisText}>
          You don't have to carry this alone. Tele-MANAS is free and
          confidential, 24×7.
        </Text>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => Linking.openURL('tel:14416')}
          accessibilityRole="button"
          accessibilityLabel="Call Tele-MANAS 14416">
          <Icon name="phone" size={18} color={colors.surface} />
          <Text style={styles.callText}>Call 14416</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const mine = message.role === 'user';
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.bubbleText, mine && styles.mineText]}>
        {message.text}
      </Text>
    </View>
  );
};

const SakhaScreen = () => {
  useBarStyle('dark-content');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([{role: 'model', text: GREETING}]);
  const [typing, setTyping] = useState(false);
  const chat = useRef(null);
  const scroll = useRef(null);

  const send = async raw => {
    const msg = (raw || '').trim();
    if (!msg || typing) {
      return;
    }
    setText('');
    setMessages(m => [
      ...m,
      {role: 'user', text: msg},
      ...(isCrisis(msg) ? [{role: 'crisis'}] : []),
    ]);
    setTyping(true);
    let reply;
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('No Gemini API key configured');
      }
      chat.current = chat.current || newChat();
      const result = await chat.current.sendMessage(msg);
      reply = result.response.text().trim();
    } catch (e) {
      console.warn('Sakha failed', e);
      reply =
        "I couldn't connect just now. Check your internet and try again. I'm still here.";
    }
    setTyping(false);
    setMessages(m => [
      ...m,
      {role: 'model', text: reply || "I'm listening. Tell me more."},
    ]);
  };

  const reset = () => {
    chat.current = null;
    setMessages([{role: 'model', text: GREETING}]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="सखा 🫂"
        right={messages.length > 1 ? {title: 'New chat', onPress: reset} : null}
      />
      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          scroll.current?.scrollToEnd({animated: true})
        }
        keyboardShouldPersistTaps="handled">
        <Disclaimer style={styles.disclaimer} />
        {messages.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {typing && (
          <View style={[styles.bubble, styles.theirs, styles.typing]}>
            <ActivityIndicator size="small" color={colors.tanDeep} />
            <Text style={[type.small, styles.typingText]}>
              Sakha is typing…
            </Text>
          </View>
        )}
        {messages.length === 1 && (
          <View style={styles.starters}>
            {STARTERS.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.starter}
                onPress={() => send(s)}
                accessibilityRole="button">
                <Text style={styles.starterText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your message…"
          placeholderTextColor={colors.inkMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          accessibilityLabel="Message"
        />
        <TouchableOpacity
          style={[styles.send, (!text.trim() || typing) && styles.sendOff]}
          disabled={!text.trim() || typing}
          onPress={() => send(text)}
          accessibilityRole="button"
          accessibilityLabel="Send">
          <Icon name="send" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SakhaScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  list: {paddingHorizontal: space.m, paddingBottom: space.m},
  disclaimer: {marginTop: 0, marginBottom: space.m},
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: space.m,
    paddingVertical: space.s + 2,
    marginVertical: space.xs,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderBottomRightRadius: 6,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  bubbleText: {fontSize: 16, lineHeight: 22, color: colors.ink},
  mineText: {color: colors.surface},
  typing: {flexDirection: 'row', alignItems: 'center'},
  typingText: {marginLeft: space.s},
  crisis: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    backgroundColor: colors.terracottaSoft,
  },
  crisisText: {...type.body, color: colors.ink},
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: space.m,
    minHeight: 40,
    marginTop: space.s,
  },
  callText: {color: colors.surface, fontWeight: '600', marginLeft: space.s},
  starters: {flexDirection: 'row', flexWrap: 'wrap', marginTop: space.s},
  starter: {
    borderWidth: 1.5,
    borderColor: colors.tan,
    borderRadius: radius.pill,
    paddingHorizontal: space.m,
    minHeight: 40,
    justifyContent: 'center',
    marginRight: space.s,
    marginTop: space.s,
  },
  starterText: {color: colors.inkSoft, fontSize: 14, fontWeight: '500'},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: space.m,
    paddingTop: 11,
    paddingBottom: 11,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: space.s,
  },
  sendOff: {opacity: 0.4},
});
