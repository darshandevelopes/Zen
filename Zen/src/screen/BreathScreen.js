import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  INHALE_MS,
  EXHALE_MS,
  LIT_THRESHOLD,
  scoreBreath,
  hint,
  altitude,
  summarize,
} from '../breath/scoring';
import {saveSession} from '../breath/sessions';

const TOTAL_BREATHS = 10;
const HORIZON = 0.72; // fraction of screen height where sky meets lake
const RISE = 0.25; // how far (fraction of height) a perfect lantern climbs
const GUIDE_Y = 0.2;

const LANTERN = '#FFB347';
const LANTERN_DEEP = '#E07B24';
const FLAME = '#FFF1C1';
const SKY_TOP = '#05081A';
const SKY_HORIZON = '#3A2A5E';
const LAKE_TOP = '#161D48';
const LAKE_BOTTOM = '#04060F';
const MOON = '#F4EBD0';

// Spots for released lanterns, kept clear of the guide and the lantern's path.
const SKY_SPOTS = [
  [0.1, 0.16],
  [0.9, 0.3],
  [0.18, 0.42],
  [0.82, 0.48],
  [0.22, 0.3],
  [0.92, 0.62],
  [0.3, 0.55],
  [0.7, 0.6],
  [0.08, 0.58],
  [0.62, 0.5],
];

// Deterministic "random" so the sky looks the same every visit.
let seed = 11;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const STARS = Array.from({length: 48}, (_, i) => ({
  x: rand(),
  y: rand() * HORIZON * 0.92,
  size: 1 + Math.round(rand() * 2),
  group: i % 3,
}));
const LAKE_LINES = Array.from({length: 14}, () => ({
  x: rand() * 0.9,
  y: HORIZON + 0.02 + rand() * (0.95 - HORIZON),
  w: 20 + rand() * 90,
}));

// Hill ridges as [x fraction, height fraction above the horizon].
const FAR_RIDGE = [
  [0, 0.05],
  [0.14, 0.078],
  [0.32, 0.042],
  [0.58, 0.1],
  [0.82, 0.05],
  [1, 0.07],
];
const NEAR_RIDGE = [
  [0, 0.03],
  [0.2, 0.048],
  [0.4, 0.02],
  [0.64, 0.052],
  [0.86, 0.024],
  [1, 0.045],
];
// Smooth closed path through the ridge points, down to the horizon line.
const ridge = (pts, w, h) => {
  const base = h * HORIZON;
  const P = pts.map(([x, f]) => [x * w, base - f * h]);
  let d = `M0 ${base} L${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length; i++) {
    const mx = (P[i - 1][0] + P[i][0]) / 2;
    d += ` C${mx} ${P[i - 1][1]} ${mx} ${P[i][1]} ${P[i][0]} ${P[i][1]}`;
  }
  return `${d} L${w} ${base} Z`;
};

// A 0→1→0 loop that runs for as long as the component is mounted.
const useLoop = duration => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const step = toValue =>
      Animated.timing(v, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return v;
};

const Glow = ({size, color, opacity, cx, cy}) => (
  <View
    style={{
      position: 'absolute',
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity,
    }}
  />
);

// True radial falloff: brightest at the centre, fully transparent at the edge.
let glowId = 0;
const SoftGlow = ({size, color, strength, cx, cy}) => {
  const id = useRef(`glow${glowId++}`).current;
  return (
    <Svg
      width={size}
      height={size}
      style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2}}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={strength} />
          <Stop offset="0.35" stopColor={color} stopOpacity={strength * 0.4} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
};

// Static backdrop: gradient sky, twinkling stars, moon, hills, shimmering lake.
// Memoized so per-breath state changes never re-render it.
const Scenery = React.memo(({w, h}) => {
  const tw = [useLoop(1700), useLoop(2500), useLoop(3300)];
  const drift = useLoop(4200);
  const starOpacity = useMemo(
    () =>
      tw.map(t => t.interpolate({inputRange: [0, 1], outputRange: [0.2, 1]})),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const horizonY = h * HORIZON;
  const moonX = w * 0.87;
  const moonY = h * 0.12;

  const driftX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 12],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={horizonY} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SKY_TOP} />
            <Stop offset="0.55" stopColor="#141238" />
            <Stop offset="1" stopColor={SKY_HORIZON} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={horizonY} fill="url(#sky)" />
      </Svg>

      {STARS.map((s, i) => (
        <Animated.View
          key={`st${i}`}
          style={{
            position: 'absolute',
            left: s.x * w,
            top: s.y * h,
            width: s.size,
            height: s.size,
            borderRadius: s.size,
            backgroundColor: '#DDE4FF',
            opacity: starOpacity[s.group],
          }}
        />
      ))}

      <SoftGlow size={150} color={MOON} strength={0.3} cx={moonX} cy={moonY} />
      <Glow size={40} color={MOON} opacity={1} cx={moonX} cy={moonY} />
      <Glow
        size={10}
        color="#000"
        opacity={0.06}
        cx={moonX - 8}
        cy={moonY - 5}
      />
      <Glow
        size={7}
        color="#000"
        opacity={0.06}
        cx={moonX + 7}
        cy={moonY + 6}
      />

      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFA06E" stopOpacity="0" />
            <Stop offset="1" stopColor="#FFA06E" stopOpacity="0.14" />
          </LinearGradient>
          <LinearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={LAKE_TOP} />
            <Stop offset="1" stopColor={LAKE_BOTTOM} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y={horizonY - 90} width={w} height="90" fill="url(#haze)" />
        <Path d={ridge(FAR_RIDGE, w, h)} fill="#1E2150" />
        <Path d={ridge(NEAR_RIDGE, w, h)} fill="#121638" />
        <Rect
          x="0"
          y={horizonY}
          width={w}
          height={h - horizonY}
          fill="url(#lake)"
        />
      </Svg>
      <View style={[styles.waterline, {top: horizonY}]} />

      {/* Moon's broken reflection on the water */}
      {[40, 34, 28, 22, 16, 12].map((lw, i) => (
        <Animated.View
          key={`mr${i}`}
          style={{
            position: 'absolute',
            left: moonX - lw / 2,
            top: horizonY + 12 + i * 16,
            width: lw,
            height: 2,
            borderRadius: 1,
            backgroundColor: MOON,
            opacity: starOpacity[i % 3].interpolate({
              inputRange: [0.2, 1],
              outputRange: [0.08, 0.3],
            }),
            transform: [
              {translateX: i % 2 ? driftX : Animated.multiply(driftX, -0.5)},
            ],
          }}
        />
      ))}

      {LAKE_LINES.map((l, i) => (
        <Animated.View
          key={`ll${i}`}
          style={{
            position: 'absolute',
            left: l.x * w,
            top: l.y * h,
            width: l.w,
            height: 1.5,
            borderRadius: 1,
            backgroundColor: '#8C9BE0',
            opacity: 0.12,
            transform: [
              {translateX: i % 2 ? driftX : Animated.multiply(driftX, -1)},
            ],
          }}
        />
      ))}
    </View>
  );
});

const LanternBody = ({scale = 1, flicker}) => {
  const flameScale = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.08],
  });
  const flameOpacity = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });
  return (
    <View style={{width: 34 * scale, height: 48 * scale, alignItems: 'center'}}>
      <View style={[styles.cap, {width: 20 * scale, height: 4 * scale}]} />
      <View
        style={[
          styles.body,
          {width: 34 * scale, height: 38 * scale, borderRadius: 12 * scale},
        ]}>
        <View
          style={[
            styles.panel,
            {width: 20 * scale, height: 30 * scale, borderRadius: 8 * scale},
          ]}
        />
        <Animated.View
          style={[
            styles.flame,
            {
              width: 10 * scale,
              height: 14 * scale,
              borderRadius: 6 * scale,
              opacity: flameOpacity,
              transform: [{scale: flameScale}],
            },
          ]}
        />
      </View>
      <View style={[styles.cap, {width: 14 * scale, height: 4 * scale}]} />
    </View>
  );
};

// The player's lantern, its halo, and its reflection on the lake.
const Lantern = React.memo(({w, h, lift, glow}) => {
  const flicker = useLoop(650);
  const sway = useLoop(3000);
  const horizonY = h * HORIZON;
  const top = horizonY - 40;
  const left = w / 2 - 17;

  const y = lift.interpolate({inputRange: [0, 1], outputRange: [0, -h * RISE]});
  const rotate = sway.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });
  const haloScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const haloOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const reflY = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, h * RISE * 0.35],
  });
  const reflOpacity = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.1],
  });
  const reflX = sway.interpolate({inputRange: [0, 1], outputRange: [-3, 3]});

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left,
          top: horizonY + 10,
          opacity: reflOpacity,
          transform: [
            {translateY: reflY},
            {translateX: reflX},
            {scaleY: -0.75},
          ],
        }}>
        <LanternBody flicker={flicker} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left,
          top,
          transform: [{translateY: y}, {rotate}],
        }}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity: haloOpacity,
            transform: [{scale: haloScale}],
          }}>
          <SoftGlow
            size={230}
            color={LANTERN}
            strength={0.45}
            cx={17}
            cy={24}
          />
        </Animated.View>
        <LanternBody flicker={flicker} />
      </Animated.View>
    </>
  );
});

// A lantern released into the sky: drifts up into its spot, then flickers.
const SkyLantern = ({x, y}) => {
  const rise = useRef(new Animated.Value(0)).current;
  const flicker = useLoop(900 + Math.round(x * 400));
  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [rise]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 7,
        top: y - 10,
        opacity: rise,
        transform: [
          {
            translateY: rise.interpolate({
              inputRange: [0, 1],
              outputRange: [90, 0],
            }),
          },
          {
            scale: rise.interpolate({
              inputRange: [0, 1],
              outputRange: [1.4, 1],
            }),
          },
        ],
      }}>
      <SoftGlow size={56} color={LANTERN} strength={0.5} cx={7} cy={10} />
      <LanternBody scale={0.42} flicker={flicker} />
    </Animated.View>
  );
};

const Guide = React.memo(({w, h, guide, secs}) => {
  const cx = w / 2;
  const cy = h * GUIDE_Y;
  const ring = (from, to) => ({
    transform: [
      {scale: guide.interpolate({inputRange: [0, 1], outputRange: [from, to]})},
    ],
  });
  return (
    <View
      pointerEvents="none"
      style={[styles.guideBox, {left: cx - 60, top: cy - 60}]}>
      <Animated.View style={[styles.guideFill, ring(0.75, 1.6)]} />
      <Animated.View style={[styles.guideEcho, ring(1.15, 2.0)]} />
      <Animated.View style={[styles.guideRing, ring(1, 1.7)]} />
      <Text style={styles.secs}>{secs}</Text>
    </View>
  );
});

// Native touch time, not JS handling time: a busy JS thread must not skew the score.
const touchTime = e => e?.nativeEvent?.timestamp ?? Date.now();

const BreathScreen = ({navigation}) => {
  const {width: w, height: h} = useWindowDimensions();
  const [phase, setPhase] = useState('in');
  const [secs, setSecs] = useState(INHALE_MS / 1000);
  const [scores, setScores] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [started, setStarted] = useState(false);
  const [holding, setHolding] = useState(false);

  const guide = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(1)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const pressAt = useRef(null);
  const releaseAt = useRef(null);
  const pendingInhale = useRef(null);
  const phaseEnd = useRef(0);

  const done = scores.length >= TOTAL_BREATHS;

  // Pacing guide: grows 4s, shrinks 6s, forever.
  useEffect(() => {
    let alive = true;
    const run = next => {
      if (!alive) {
        return;
      }
      const duration = next === 'in' ? INHALE_MS : EXHALE_MS;
      phaseEnd.current = Date.now() + duration;
      setPhase(next);
      Animated.timing(guide, {
        toValue: next === 'in' ? 1 : 0,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(({finished}) => finished && run(next === 'in' ? 'out' : 'in'));
    };
    run('in');
    const tick = setInterval(
      () =>
        setSecs(Math.max(1, Math.ceil((phaseEnd.current - Date.now()) / 1000))),
      200,
    );
    return () => {
      alive = false;
      clearInterval(tick);
      guide.stopAnimation();
    };
  }, [guide]);

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: done ? 1 : 0,
      duration: done ? 900 : 0,
      useNativeDriver: true,
    }).start();
  }, [done, reveal]);

  const setGlow = on =>
    Animated.timing(glow, {
      toValue: on ? 1 : 0,
      duration: on ? 500 : 900,
      useNativeDriver: true,
    }).start();

  const record = score => {
    const next = [...scores, score];
    setScores(next);
    if (next.length === TOTAL_BREATHS) {
      saveSession(next).catch(e => console.warn('Could not save session', e));
    }
    Animated.timing(lift, {
      toValue: altitude(next),
      duration: 1400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    ripple.setValue(0);
    Animated.timing(ripple, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const onPressIn = e => {
    if (done) {
      return;
    }
    const now = touchTime(e);
    if (pendingInhale.current != null) {
      const exhale = now - releaseAt.current;
      record(scoreBreath(pendingInhale.current, exhale));
      setFeedback(hint(pendingInhale.current, exhale));
      pendingInhale.current = null;
      if (scores.length + 1 >= TOTAL_BREATHS) {
        return;
      }
    }
    setStarted(true);
    setHolding(true);
    setGlow(true);
    pressAt.current = now;
  };

  const onPressOut = e => {
    setHolding(false);
    setGlow(false);
    if (pressAt.current == null || done) {
      return;
    }
    const now = touchTime(e);
    pendingInhale.current = now - pressAt.current;
    releaseAt.current = now;
    pressAt.current = null;
  };

  const restart = () => {
    setScores([]);
    setFeedback('');
    setStarted(false);
    pressAt.current = null;
    pendingInhale.current = null;
    lift.setValue(0);
  };

  const summary = summarize(scores);
  const litCount = scores.filter(s => s >= LIT_THRESHOLD).length;
  const horizonY = h * HORIZON;

  return (
    <Pressable
      style={styles.container}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityLabel="Hold while breathing in, release while breathing out">
      <Scenery w={w} h={h} />

      {SKY_SPOTS.slice(0, litCount).map(([x, y], i) => (
        <SkyLantern key={`l${i}`} x={x * w} y={y * h} />
      ))}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            left: w / 2 - 40,
            top: horizonY - 2,
            opacity: ripple.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 0],
            }),
            transform: [
              {
                scale: ripple.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 3.2],
                }),
              },
            ],
          },
        ]}
      />
      <Lantern w={w} h={h} lift={lift} glow={glow} />

      <Guide w={w} h={h} guide={guide} secs={secs} />
      <View
        pointerEvents="none"
        style={[styles.textBox, {top: h * GUIDE_Y + 112}]}>
        <Text style={styles.phase}>
          {phase === 'in' ? 'Breathe in' : 'Breathe out'}
        </Text>
        <Text style={styles.sub}>
          {!started
            ? 'Hold the screen while you breathe in.\nLet go as you breathe out.'
            : holding
            ? 'breathing in…'
            : feedback}
        </Text>
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {Array.from({length: TOTAL_BREATHS}, (_, i) => (
            <View
              key={`d${i}`}
              style={[
                styles.dot,
                i < scores.length &&
                  (scores[i] >= LIT_THRESHOLD ? styles.dotLit : styles.dotDone),
              ]}
            />
          ))}
        </View>
      </View>

      {done && (
        <Animated.View style={[styles.overlay, {opacity: reveal}]}>
          <View style={styles.card}>
            <View style={styles.miniRow}>
              {Array.from({length: summary.lit}, (_, i) => (
                <View key={`m${i}`} style={styles.mini} />
              ))}
            </View>
            <Text style={styles.resultTitle}>
              {summary.lit} lantern{summary.lit === 1 ? '' : 's'} lit
            </Text>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{summary.start}%</Text>
                <Text style={styles.statLabel}>first breaths</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
              <View style={styles.stat}>
                <Text style={[styles.statNum, styles.statEnd]}>
                  {summary.end}%
                </Text>
                <Text style={styles.statLabel}>last breaths</Text>
              </View>
            </View>
            <Text style={styles.resultNote}>
              {summary.end > summary.start
                ? 'Your breathing settled as you went.'
                : 'Every round trains the rhythm. Try once more?'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={restart}>
              <Text style={styles.buttonText}>Again</Text>
            </TouchableOpacity>
            <View style={styles.resultLinks}>
              <TouchableOpacity
                onPress={() => navigation.navigate('BreathProgress')}>
                <Text style={styles.back}>Your week</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.back}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
};

export default BreathScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: SKY_TOP},
  waterline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(180,190,255,0.18)',
  },
  cap: {backgroundColor: '#5A2E14', borderRadius: 2},
  body: {
    backgroundColor: LANTERN_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {position: 'absolute', backgroundColor: LANTERN},
  flame: {backgroundColor: FLAME},
  ripple: {
    position: 'absolute',
    width: 80,
    height: 14,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,190,120,0.8)',
  },
  guideBox: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    backgroundColor: 'rgba(150,170,255,0.09)',
  },
  guideEcho: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(201,211,255,0.15)',
  },
  guideRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(221,228,255,0.6)',
  },
  secs: {color: 'rgba(255,255,255,0.85)', fontSize: 30, fontWeight: '200'},
  textBox: {position: 'absolute', left: 0, right: 0, alignItems: 'center'},
  phase: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 1,
  },
  sub: {
    color: '#A9B3E0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    minHeight: 44,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  back: {color: '#C9D3FF', fontSize: 18, padding: 8},
  dots: {flexDirection: 'row', gap: 6},
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,211,255,0.4)',
  },
  dotDone: {backgroundColor: 'rgba(201,211,255,0.35)', borderWidth: 0},
  dotLit: {backgroundColor: LANTERN, borderWidth: 0},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,8,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '84%',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: '#121838',
    borderWidth: 1,
    borderColor: 'rgba(255,179,71,0.25)',
  },
  miniRow: {flexDirection: 'row', gap: 6, marginBottom: 16, minHeight: 16},
  mini: {
    width: 10,
    height: 14,
    borderRadius: 4,
    backgroundColor: LANTERN,
  },
  resultTitle: {color: LANTERN, fontSize: 30, fontWeight: '600'},
  statRow: {flexDirection: 'row', alignItems: 'center', marginTop: 22},
  stat: {alignItems: 'center', minWidth: 100},
  statNum: {color: '#C9D3FF', fontSize: 30, fontWeight: '300'},
  statEnd: {color: '#FFFFFF', fontWeight: '500'},
  statLabel: {color: '#7F8AC0', fontSize: 12, marginTop: 2},
  arrow: {color: '#7F8AC0', fontSize: 22, marginHorizontal: 8},
  resultNote: {
    color: '#A9B3E0',
    fontSize: 15,
    marginTop: 18,
    textAlign: 'center',
  },
  button: {
    marginTop: 26,
    backgroundColor: LANTERN,
    borderRadius: 24,
    paddingHorizontal: 44,
    paddingVertical: 12,
  },
  buttonText: {color: '#1A1030', fontSize: 18, fontWeight: '600'},
  resultLinks: {flexDirection: 'row', gap: 28, marginTop: 6},
});
