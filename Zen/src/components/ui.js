import React, {useCallback} from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, radius, shadow, space, type} from '../theme';

// Status bar is translucent app-wide; each screen picks icon colour on focus.
export const useBarStyle = style =>
  useFocusEffect(useCallback(() => StatusBar.setBarStyle(style), [style]));

export const Card = ({style, children}) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Button = ({
  title,
  onPress,
  kind = 'primary',
  busy,
  disabled,
  style,
}) => {
  const off = disabled || busy;
  const fg = kind === 'primary' ? colors.surface : colors.accent;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled: !!off, busy: !!busy}}
      disabled={off}
      onPress={onPress}
      style={[
        styles.button,
        kind === 'primary' ? styles.primary : styles.ghost,
        off && styles.off,
        style,
      ]}>
      {busy && <ActivityIndicator color={fg} style={styles.spinner} />}
      <Text style={[styles.buttonText, {color: fg}]}>{title}</Text>
    </TouchableOpacity>
  );
};

// Top bar for light screens: optional back, centred title, optional right action.
export const ScreenHeader = ({title, onBack, right, dark}) => {
  const insets = useSafeAreaInsets();
  const tint = dark ? '#C9D3FF' : colors.accent;
  return (
    <View style={[styles.header, {paddingTop: insets.top + space.s}]}>
      <View style={styles.side}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}>
            <Text style={[styles.headerLink, {color: tint}]}>‹ Back</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text
        style={[styles.headerTitle, dark && styles.headerTitleDark]}
        numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {right && (
          <TouchableOpacity
            onPress={right.onPress}
            accessibilityRole="button"
            accessibilityLabel={right.title}
            hitSlop={12}>
            <Text style={[styles.headerLink, {color: tint}]}>
              {right.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const Disclaimer = ({style}) => (
  <Text style={[type.small, styles.disclaimer, style]}>
    Zen is a self-help tool, not a substitute for professional care.
  </Text>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: space.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {backgroundColor: colors.accent},
  ghost: {backgroundColor: 'transparent'},
  off: {opacity: 0.4},
  spinner: {marginRight: space.s},
  buttonText: {fontSize: 16, fontWeight: '600'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.m,
    paddingBottom: space.s,
  },
  side: {width: 80, minHeight: 44, justifyContent: 'center'},
  sideRight: {alignItems: 'flex-end'},
  headerLink: {fontSize: 17, fontWeight: '500'},
  headerTitle: {flex: 1, textAlign: 'center', ...type.h2},
  headerTitleDark: {color: '#FFFFFF'},
  disclaimer: {textAlign: 'center', marginTop: space.m},
});
