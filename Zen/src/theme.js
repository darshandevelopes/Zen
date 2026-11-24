// One palette for the whole app, taken from Home's illustration and the lotus icon.
export const colors = {
  bg: '#F5F5DC', // Home's cream
  surface: '#FFFFFF', // white cards, like the original Home buttons
  surfaceAlt: '#F1EBDB',
  line: '#E6DCC6',
  ink: '#2B2420',
  inkSoft: '#5F5348',
  inkMuted: '#9A8C7E',
  tan: '#D2B48C',
  tanDeep: '#A97F4A', // lotus centre petal
  accent: '#8B5E34', // warm brown, deeper than the lotus petals
  accentSoft: '#F1E4CF',
  terracotta: '#E8826A', // flowers
  terracottaSoft: '#FBE3DA',
  success: '#3F7D57',
  danger: '#B5473A',
  lantern: '#FFB347', // night scenes only
};

export const space = {xs: 4, s: 8, m: 16, l: 24, xl: 32};
export const radius = {card: 20, pill: 999, input: 14};

export const type = {
  title: {fontSize: 26, fontWeight: '700', color: colors.ink},
  h2: {fontSize: 20, fontWeight: '600', color: colors.ink},
  body: {fontSize: 16, lineHeight: 22, color: colors.inkSoft},
  small: {fontSize: 13, lineHeight: 18, color: colors.inkMuted},
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.tanDeep,
  },
};

export const shadow = {
  shadowColor: '#5F4A2E',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: {width: 0, height: 4},
  elevation: 2,
};
