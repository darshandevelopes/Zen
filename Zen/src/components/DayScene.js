import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Circle, G, Line, Path, Rect} from 'react-native-svg';
import {FAR_RIDGE, HORIZON, NEAR_RIDGE, ridge} from './NightScene';
import {colors} from '../theme';

// Morning counterpart of NightScene in Home's palette. Flat colours only:
// gradients are reserved for the breathing screen.
export const DayScene = React.memo(({w, h}) => {
  const horizonY = h * HORIZON;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Rect x="0" y="0" width={w} height={horizonY} fill="#F8E6D6" />
      <Path d={ridge(FAR_RIDGE, w, h)} fill="#E8D5B5" />
      <Path d={ridge(NEAR_RIDGE, w, h)} fill={colors.tan} />
      <Rect
        x="0"
        y={horizonY}
        width={w}
        height={h - horizonY}
        fill={colors.bg}
      />
    </Svg>
  );
});

const RAYS = Array.from({length: 12}, (_, i) => (i * Math.PI) / 6);

// Sun with rays, centred on (cx, cy). Wrap in Animated.View to fade it in.
export const Sun = ({cx, cy}) => (
  <Svg
    width={180}
    height={180}
    style={{position: 'absolute', left: cx - 90, top: cy - 90}}>
    <Circle cx={90} cy={90} r={56} fill="#FFE2A8" opacity={0.6} />
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
);
