import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DayScene, Sun} from '../components/DayScene';
import {
  Button,
  Card,
  Disclaimer,
  ScreenHeader,
  useBarStyle,
} from '../components/ui';
import {colors, radius, space, type} from '../theme';
import {
  CHALLENGES,
  MAX_HP,
  balancedThought,
  isCrisis,
  judgeAnswer,
} from '../worry/judge';
import {saveWorry} from '../worry/vault';

const MAX_TRIES = 2; // per challenge, so a brush-off can be retried once
const HEADER_H = 60; // ScreenHeader height below the status bar
const CLOUD_CY = 100; // cloud centre below the header (scroll padding + margin + half height)

// Overlapping puffs make the cloud: [x, y, radius] inside a 260x140 box.
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
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const step = toValue =>
      Animated.timing(bob, {
        toValue,
        duration: 2600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const scale = hpAnim.interpolate({
    inputRange: [0, MAX_HP],
    outputRange: [0.15, 1],
  });
  const opacity = hpAnim.interpolate({
    inputRange: [0, 0.5, MAX_HP],
    outputRange: [0, 0.6, 1],
  });
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
      {puff('#767C96', 8, 0)}
      {puff('#9298AF', 0, 0)}
      {puff('#B1B6C9', -5, 12)}
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
  useBarStyle('dark-content');
  const {width: w, height: h} = useWindowDimensions();
  const insets = useSafeAreaInsets();
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

  const battling = phase !== 'enter' && phase !== 'crisis';
  const overcast = hpAnim.interpolate({
    inputRange: [0, MAX_HP],
    outputRange: [0, 0.28],
  });
  const sunOpacity = hpAnim.interpolate({
    inputRange: [0, MAX_HP],
    outputRange: [1, 0.15],
  });

  const strike = damage => {
    hp.current = Math.max(0, hp.current - damage);
    if (damage) {
      Vibration.vibrate(damage === 2 ? [0, 25, 60, 25] : 20);
    }
    Animated.timing(hpAnim, {
      toValue: hp.current,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.sequence([
      Animated.timing(flash, {
        toValue: damage === 2 ? 0.6 : 0.3,
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

  const begin = () => setPhase(isCrisis(worry) ? 'crisis' : 'battle');

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
        <Card style={styles.card}>
          <Text style={[type.h2, styles.center]}>
            You don't have to carry this alone
          </Text>
          <Text style={[type.body, styles.center, styles.gap]}>
            It sounds like things are really heavy right now. Talking to a
            person can help. Tele-MANAS is free, confidential, open 24×7, and
            speaks many Indian languages.
          </Text>
          <Button
            title="Call Tele-MANAS 14416"
            onPress={() => Linking.openURL('tel:14416')}
            style={styles.gapL}
          />
          <Text style={[type.small, styles.center, styles.gap]}>
            In immediate danger? Call 112 or go to the nearest hospital.
          </Text>
          <Button
            title="Back"
            kind="ghost"
            onPress={() => navigation.goBack()}
          />
        </Card>
      );
    }
    if (phase === 'enter') {
      return (
        <Card style={styles.card}>
          <Text style={type.label}>Worry battle</Text>
          <Text style={[type.h2, styles.gap]}>What's worrying you?</Text>
          <Text style={[type.small, styles.gapS]}>
            Write it as a sentence. You'll take it apart with three questions.
          </Text>
          <TextInput
            style={styles.input}
            value={worry}
            onChangeText={setWorry}
            placeholder="e.g. I'll freeze during tomorrow's presentation"
            placeholderTextColor={colors.inkMuted}
            multiline
            maxLength={200}
            accessibilityLabel="Your worry"
          />
          <Button
            title="Turn it into a cloud"
            disabled={worry.trim().length < 3}
            onPress={begin}
            style={styles.gapL}
          />
          <Disclaimer />
        </Card>
      );
    }
    if (phase === 'battle') {
      return (
        <Card style={styles.card}>
          <Text style={type.label}>
            Challenge {step + 1} of {CHALLENGES.length}
          </Text>
          <Text style={[type.h2, styles.gap]}>{CHALLENGES[step]}</Text>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Be specific. Vague answers bounce off."
            placeholderTextColor={colors.inkMuted}
            multiline
            maxLength={300}
            editable={!busy}
            accessibilityLabel="Your answer"
          />
          <Button
            title={busy ? 'Sakha is reading…' : 'Strike'}
            busy={busy}
            disabled={!answer.trim()}
            onPress={submit}
            style={styles.gapL}
          />
        </Card>
      );
    }
    if (phase === 'verdict') {
      const last = step + 1 >= CHALLENGES.length;
      const canRetry = verdict.score === 0 && tries < MAX_TRIES;
      const nextTitle = busy
        ? 'Sakha is writing your takeaway…'
        : last
        ? 'Finish'
        : canRetry
        ? 'Skip to next'
        : 'Next challenge';
      return (
        <Card style={styles.card}>
          <Bolts score={verdict.score} />
          {!!verdict.feedback && (
            <Text style={[type.body, styles.gap]}>{verdict.feedback}</Text>
          )}
          {canRetry && (
            <Button title="Try again" onPress={retry} style={styles.gapL} />
          )}
          <Button
            title={nextTitle}
            busy={busy}
            kind={canRetry ? 'ghost' : 'primary'}
            onPress={next}
            style={canRetry ? styles.gapS : styles.gapL}
          />
        </Card>
      );
    }
    return (
      <Card style={styles.card}>
        <Text style={[styles.hero, styles.center]}>{result.cleared}%</Text>
        <Text style={[type.small, styles.center]}>of the sky cleared</Text>
        <Text style={styles.thought}>“{result.thought}”</Text>
        <Text style={[type.small, styles.center, styles.gap]}>
          Saved to your worry vault. In a few days, mark whether it actually
          happened.
        </Text>
        <Button
          title="Open vault"
          onPress={() => navigation.navigate('WorryVault')}
          style={styles.gapL}
        />
        <Button title="Done" kind="ghost" onPress={() => navigation.goBack()} />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <DayScene w={w} h={h} />
      {battling && (
        <Animated.View
          pointerEvents="none"
          style={[styles.fill, {opacity: sunOpacity}]}>
          <Sun cx={w / 2} cy={insets.top + HEADER_H + CLOUD_CY} />
        </Animated.View>
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          styles.overcast,
          {opacity: battling ? overcast : 0},
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, styles.flash, {opacity: flash}]}
      />

      <ScreenHeader
        title="Worry battle"
        onBack={() => navigation.goBack()}
        right={{
          title: 'Vault',
          onPress: () => navigation.navigate('WorryVault'),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + space.m},
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stage}>
          {battling && (
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
  container: {flex: 1, backgroundColor: colors.bg},
  fill: StyleSheet.absoluteFillObject,
  overcast: {backgroundColor: '#5E667F'},
  flash: {backgroundColor: '#FFFFFF'},
  scroll: {flexGrow: 1, justifyContent: 'space-between', padding: space.m},
  stage: {alignItems: 'center', minHeight: 230},
  cloud: {width: 260, height: 140, marginTop: 14},
  puff: {position: 'absolute'},
  worryText: {
    ...type.body,
    color: colors.ink,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: space.m,
    paddingHorizontal: space.l,
  },
  card: {alignItems: 'stretch'},
  center: {textAlign: 'center'},
  gapS: {marginTop: space.s},
  gap: {marginTop: space.s + 2},
  gapL: {marginTop: space.l},
  input: {
    minHeight: 96,
    maxHeight: 150,
    marginTop: space.m,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.input,
    padding: space.m,
    textAlignVertical: 'top',
  },
  bolts: {fontSize: 22, fontWeight: '700', color: colors.terracotta},
  hero: {fontSize: 56, fontWeight: '300', color: colors.teal},
  thought: {
    ...type.body,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: space.l,
  },
});
