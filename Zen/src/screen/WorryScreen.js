import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {NightScene} from '../components/NightScene';
import {
  CHALLENGES,
  MAX_HP,
  balancedThought,
  isCrisis,
  judgeAnswer,
} from '../worry/judge';
import {saveWorry} from '../worry/vault';

const LANTERN = '#FFB347';
const MAX_TRIES = 2; // per challenge, so a brush-off can be retried once

// Overlapping puffs make the cloud: [x, y, radius] inside a 260x130 box.
const PUFFS = [
  [48, 78, 42],
  [100, 52, 56],
  [160, 58, 50],
  [212, 82, 38],
  [130, 92, 46],
  [74, 98, 34],
  [186, 100, 32],
];

const StormCloud = ({hpAnim, shake}) => {
  const scale = hpAnim.interpolate({
    inputRange: [0, MAX_HP],
    outputRange: [0.15, 1],
  });
  const opacity = hpAnim.interpolate({
    inputRange: [0, 0.5, MAX_HP],
    outputRange: [0, 0.6, 1],
  });
  const bob = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const bobY = bob.interpolate({inputRange: [0, 1], outputRange: [-4, 4]});

  const puff = (color, dy, shrink) =>
    PUFFS.map(([x, y, r], i) => (
      <View
        key={`${color}${i}`}
        style={[
          styles.puff,
          {
            left: x - (r - shrink),
            top: y + dy - (r - shrink),
            width: (r - shrink) * 2,
            height: (r - shrink) * 2,
            borderRadius: r - shrink,
            backgroundColor: color,
          },
        ]}
      />
    ));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cloud,
        {
          opacity,
          transform: [{translateX: shake}, {translateY: bobY}, {scale}],
        },
      ]}>
      {puff('#1F2244', 8, 0)}
      {puff('#3A3E68', 0, 0)}
      {puff('#4A4F7E', -4, 10)}
    </Animated.View>
  );
};

const Bolts = ({score}) => (
  <Text style={styles.bolts}>
    {score === 2
      ? '⚡⚡  Direct hit!'
      : score === 1
      ? '⚡  Glancing hit'
      : 'The cloud shrugged it off'}
  </Text>
);

const WorryScreen = ({navigation}) => {
  const {width: w, height: h} = useWindowDimensions();
  const [phase, setPhase] = useState('enter'); // enter | battle | verdict | done | crisis
  const [worry, setWorry] = useState('');
  const [step, setStep] = useState(0);
  const [tries, setTries] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const hp = useRef(MAX_HP);
  const hpAnim = useRef(new Animated.Value(MAX_HP)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  const darkness = hpAnim.interpolate({
    inputRange: [0, MAX_HP],
    outputRange: [0, 0.55],
  });

  const strike = damage => {
    hp.current = Math.max(0, hp.current - damage);
    Animated.timing(hpAnim, {
      toValue: hp.current,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.sequence([
      Animated.timing(flash, {
        toValue: damage === 2 ? 0.5 : 0.25,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(flash, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence(
      [14, -12, 9, -6, 3, 0].map(x =>
        Animated.timing(shake, {
          toValue: damage ? x : x / 3,
          duration: 60,
          useNativeDriver: true,
        }),
      ),
    ).start();
  };

  const begin = () => {
    if (isCrisis(worry)) {
      setPhase('crisis');
      return;
    }
    setPhase('battle');
  };

  const submit = async () => {
    const text = answer.trim();
    if (!text || busy) {
      return;
    }
    setBusy(true);
    const v = await judgeAnswer(worry, CHALLENGES[step], text);
    setBusy(false);
    if (v.crisis) {
      setPhase('crisis');
      return;
    }
    setVerdict(v);
    setTries(t => t + 1);
    strike(v.score);
    setPhase('verdict');
  };

  const retry = () => {
    setAnswer('');
    setPhase('battle');
  };

  const next = async () => {
    // The latest attempt is this challenge's answer (a retry replaces it).
    const kept = [...answers, answer.trim()];
    if (step + 1 < CHALLENGES.length) {
      setStep(step + 1);
      setTries(0);
      setAnswer('');
      setVerdict(null);
      setAnswers(kept);
      setPhase('battle');
      return;
    }
    setBusy(true);
    const cleared = Math.round(((MAX_HP - hp.current) / MAX_HP) * 100);
    const thought = await balancedThought(worry, kept);
    await saveWorry({worry, answers: kept, thought, cleared}).catch(e =>
      console.warn('Could not save worry', e),
    );
    setResult({cleared, thought});
    setBusy(false);
    setPhase('done');
  };

  const card = () => {
    if (phase === 'crisis') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            You don't have to carry this alone
          </Text>
          <Text style={styles.body}>
            It sounds like things are really heavy right now. Talking to a
            person can help. Tele-MANAS is free, confidential, open 24×7, and
            speaks many Indian languages.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openURL('tel:14416')}>
            <Text style={styles.buttonText}>Call Tele-MANAS 14416</Text>
          </TouchableOpacity>
          <Text style={styles.small}>
            In immediate danger? Call 112 or go to the nearest hospital.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (phase === 'enter') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's worrying you?</Text>
          <TextInput
            style={styles.input}
            value={worry}
            onChangeText={setWorry}
            placeholder="e.g. I'll freeze during tomorrow's presentation"
            placeholderTextColor="#6F79A8"
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.button, worry.trim().length < 3 && styles.disabled]}
            disabled={worry.trim().length < 3}
            onPress={begin}>
            <Text style={styles.buttonText}>Turn it into a cloud</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (phase === 'battle') {
      return (
        <View style={styles.card}>
          <Text style={styles.step}>
            Challenge {step + 1} of {CHALLENGES.length}
          </Text>
          <Text style={styles.cardTitle}>{CHALLENGES[step]}</Text>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Be specific. Vague answers bounce off."
            placeholderTextColor="#6F79A8"
            multiline
            maxLength={300}
            editable={!busy}
          />
          <TouchableOpacity
            style={[styles.button, (!answer.trim() || busy) && styles.disabled]}
            disabled={!answer.trim() || busy}
            onPress={submit}>
            {busy ? (
              <View style={styles.row}>
                <ActivityIndicator color="#1A1030" />
                <Text style={[styles.buttonText, styles.busyText]}>
                  Sakha is reading…
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Strike</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    if (phase === 'verdict') {
      const last = step + 1 >= CHALLENGES.length;
      const canRetry = verdict.score === 0 && tries < MAX_TRIES;
      return (
        <View style={styles.card}>
          <Bolts score={verdict.score} />
          {!!verdict.feedback && (
            <Text style={styles.body}>{verdict.feedback}</Text>
          )}
          {canRetry && (
            <TouchableOpacity style={styles.button} onPress={retry}>
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={canRetry ? null : styles.button}
            disabled={busy}
            onPress={next}>
            {busy ? (
              <View style={styles.row}>
                <ActivityIndicator color={canRetry ? LANTERN : '#1A1030'} />
                <Text style={[styles.buttonText, styles.busyText]}>
                  Sakha is writing your takeaway…
                </Text>
              </View>
            ) : (
              <Text style={canRetry ? styles.link : styles.buttonText}>
                {last ? 'Finish' : canRetry ? 'Skip to next' : 'Next challenge'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    // done
    return (
      <View style={styles.card}>
        <Text style={styles.hero}>{result.cleared}%</Text>
        <Text style={styles.small}>of the sky cleared</Text>
        <Text style={styles.thought}>“{result.thought}”</Text>
        <Text style={styles.small}>
          Saved to your worry vault. In a few days, mark whether it actually
          happened.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('WorryVault')}>
          <Text style={styles.buttonText}>Open vault</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <NightScene w={w} h={h} />
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, styles.dark, {opacity: darkness}]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, styles.flash, {opacity: flash}]}
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Worry battle</Text>
        <TouchableOpacity onPress={() => navigation.navigate('WorryVault')}>
          <Text style={styles.link}>Vault</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stage}>
          {phase !== 'enter' && phase !== 'crisis' && (
            <>
              <StormCloud hpAnim={hpAnim} shake={shake} />
              <Text style={styles.worryText} numberOfLines={3}>
                “{worry.trim()}”
              </Text>
            </>
          )}
        </View>
        {card()}
      </ScrollView>
    </View>
  );
};

export default WorryScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#05081A'},
  fill: StyleSheet.absoluteFillObject,
  dark: {backgroundColor: '#000'},
  flash: {backgroundColor: '#E8ECFF'},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {color: '#FFFFFF', fontSize: 18, fontWeight: '500'},
  link: {color: '#C9D3FF', fontSize: 17, padding: 8},
  scroll: {flexGrow: 1, justifyContent: 'space-between', padding: 20},
  stage: {alignItems: 'center', minHeight: 230},
  cloud: {width: 260, height: 140, marginTop: 10},
  puff: {position: 'absolute'},
  worryText: {
    color: '#DDE2FF',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(14,19,48,0.94)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201,211,255,0.14)',
    padding: 22,
    alignItems: 'center',
  },
  step: {
    color: LANTERN,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 10,
  },
  body: {
    color: '#C3CAF0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    marginVertical: 6,
  },
  small: {
    color: '#8F99C8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    alignSelf: 'stretch',
    minHeight: 80,
    maxHeight: 140,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 16,
    backgroundColor: LANTERN,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  disabled: {opacity: 0.4},
  buttonText: {color: '#1A1030', fontSize: 17, fontWeight: '600'},
  busyText: {marginLeft: 10},
  row: {flexDirection: 'row', alignItems: 'center'},
  bolts: {color: LANTERN, fontSize: 22, fontWeight: '600', marginBottom: 4},
  hero: {color: LANTERN, fontSize: 56, fontWeight: '300'},
  thought: {
    color: '#FFFFFF',
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 18,
  },
});
