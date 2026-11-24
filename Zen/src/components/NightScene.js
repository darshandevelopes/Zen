import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export const HORIZON = 0.72; // fraction of screen height where sky meets lake

export const SKY_TOP = '#05081A';
export const SKY_HORIZON = '#3A2A5E';
export const LAKE_TOP = '#161D48';
export const LAKE_BOTTOM = '#04060F';
export const MOON = '#F4EBD0';

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
export const FAR_RIDGE = [
  [0, 0.05],
  [0.14, 0.078],
  [0.32, 0.042],
  [0.58, 0.1],
  [0.82, 0.05],
  [1, 0.07],
];
export const NEAR_RIDGE = [
  [0, 0.03],
  [0.2, 0.048],
  [0.4, 0.02],
  [0.64, 0.052],
  [0.86, 0.024],
  [1, 0.045],
];
// Smooth closed path through the ridge points, down to the horizon line.
export const ridge = (pts, w, h) => {
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
export const useLoop = duration => {
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

export const Glow = ({size, color, opacity, cx, cy}) => (
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
export const SoftGlow = ({size, color, strength, cx, cy}) => {
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
export const NightScene = React.memo(({w, h}) => {
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

const styles = StyleSheet.create({
  waterline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(180,190,255,0.18)',
  },
});
