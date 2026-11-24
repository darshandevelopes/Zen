import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import {FAR_RIDGE, HORIZON, NEAR_RIDGE, SoftGlow, ridge} from './NightScene';
import {colors} from '../theme';

// Morning counterpart of NightScene, in Home's palette.
export const DayScene = React.memo(({w, h}) => {
  const horizonY = h * HORIZON;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="daysky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7D3C0" />
          <Stop offset="0.55" stopColor="#FAE6D3" />
          <Stop offset="1" stopColor={colors.bg} />
        </LinearGradient>
        <LinearGradient id="meadow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E3E6CF" />
          <Stop offset="1" stopColor={colors.bg} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={w} height={horizonY} fill="url(#daysky)" />
      <Path d={ridge(FAR_RIDGE, w, h)} fill="#CFDCD2" />
      <Path d={ridge(NEAR_RIDGE, w, h)} fill="#A9C4B8" />
      <Rect
        x="0"
        y={horizonY}
        width={w}
        height={h - horizonY}
        fill="url(#meadow)"
      />
    </Svg>
  );
});

const RAYS = Array.from({length: 12}, (_, i) => (i * Math.PI) / 6);

// Sun with rays, centred on (cx, cy). Wrap in Animated.View to fade it in.
export const Sun = ({cx, cy}) => (
  <>
    <SoftGlow size={300} color="#FFD58A" strength={0.6} cx={cx} cy={cy} />
    <Svg
      width={180}
      height={180}
      style={{position: 'absolute', left: cx - 90, top: cy - 90}}>
      <G stroke="#FFC46B" strokeWidth={4} strokeLinecap="round">
        {RAYS.map(a => (
          <Line
            key={a}
            x1={90 + Math.cos(a) * 50}
            y1={90 + Math.sin(a) * 50}
            x2={90 + Math.cos(a) * 78}
            y2={90 + Math.sin(a) * 78}
          />
        ))}
      </G>
      <Circle cx={90} cy={90} r={36} fill="#FFC56B" />
    </Svg>
  </>
);
