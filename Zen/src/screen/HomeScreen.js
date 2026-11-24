import React, {useCallback, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Card, useBarStyle} from '../components/ui';
import {colors, radius, space, type} from '../theme';
import {loadSessions, weeklyStats} from '../breath/sessions';
import {loadWorries, vaultStats} from '../worry/vault';

const greeting = () => {
  const hr = new Date().getHours();
  return hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
};

const PAD = space.m + 4;
const HERO_RATIO = 534 / 400; // homeScreen.jpg

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const Action = ({icon, tint, title, subtitle, onPress}) => (
  <TouchableOpacity
    style={styles.action}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${subtitle}`}>
    <View style={[styles.actionIcon, {backgroundColor: tint}]}>
      <Icon name={icon} size={26} color={colors.teal} />
    </View>
    <View style={styles.actionText}>
      <Text style={type.h2}>{title}</Text>
      <Text style={type.small}>{subtitle}</Text>
    </View>
    <Icon name="chevron-right" size={26} color={colors.inkMuted} />
  </TouchableOpacity>
);

const HomeScreen = ({navigation}) => {
  useBarStyle('dark-content');
  const insets = useSafeAreaInsets();
  const heroW = useWindowDimensions().width - 2 * PAD;
  const [data, setData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([loadSessions(), loadWorries()]).then(([s, w]) => {
        if (alive) {
          setData({
            week: weeklyStats(s),
            vault: vaultStats(w),
            toCheck: w.filter(x => !x.outcome).length,
          });
        }
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const week = data?.week;
  const breathSub = week?.thisWeek.count
    ? `${plural(week.thisWeek.count, 'round')} this week · ${plural(
        week.thisWeek.lit,
        'lantern',
      )} lit`
    : '2-minute lantern round';
  const worrySub = data?.vault.total
    ? `${plural(data.vault.total, 'worry')} battled${
        data.toCheck ? ` · ${data.toCheck} to check` : ''
      }`
    : 'Take a worry apart in three questions';
  const up = week && week.thisWeek.end >= week.lastWeek.end;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {paddingTop: insets.top + space.m},
      ]}>
      <View style={styles.topRow}>
        <Text style={type.title}>{greeting()}</Text>
        <Image
          source={require('../images/zen_icon_master.png')}
          style={styles.logo}
        />
      </View>

      <Image
        style={[styles.hero, {width: heroW, height: heroW / HERO_RATIO}]}
        source={require('../images/homeScreen.jpg')}
        resizeMode="cover"
        accessibilityLabel="Illustration of a calm woman among flowers"
      />

      <Text style={[type.h2, styles.question]}>
        What do you need right now?
      </Text>

      <Card style={styles.actions}>
        <Action
          icon="weather-windy"
          tint={colors.tealSoft}
          title="Breathe"
          subtitle={breathSub}
          onPress={() => navigation.navigate('BreathScreen')}
        />
        <View style={styles.divider} />
        <Action
          icon="weather-lightning-rainy"
          tint={colors.terracottaSoft}
          title="Worry battle"
          subtitle={worrySub}
          onPress={() => navigation.navigate('WorryScreen')}
        />
      </Card>

      <TouchableOpacity
        onPress={() => navigation.navigate('Week')}
        accessibilityRole="button"
        accessibilityLabel="Your week">
        <Card style={styles.weekCard}>
          <View style={styles.weekText}>
            <Text style={type.label}>Your week</Text>
            <Text style={[type.h2, styles.gapS]}>
              {week?.thisWeek.end != null
                ? `Settled to ${week.thisWeek.end}%`
                : 'No rounds yet'}
            </Text>
            {week?.thisWeek.end != null && week.lastWeek.end != null && (
              <Text style={[type.small, up ? styles.up : styles.down]}>
                {up ? '▲' : '▼'}{' '}
                {Math.abs(week.thisWeek.end - week.lastWeek.end)} vs last week
              </Text>
            )}
          </View>
          <View style={styles.spark}>
            {(week?.days || Array(7).fill({})).map((d, i) => (
              <View
                key={i}
                style={[
                  styles.sparkBar,
                  {height: d.count ? 6 + (34 * d.end) / 100 : 4},
                  d.count ? styles.sparkOn : null,
                ]}
              />
            ))}
          </View>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  content: {paddingHorizontal: PAD, paddingBottom: space.l},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {width: 44, height: 44, borderRadius: 12},
  hero: {
    borderRadius: radius.card,
    marginTop: space.l,
  },
  question: {marginTop: space.l, marginBottom: space.m},
  actions: {paddingVertical: space.s, paddingHorizontal: space.m},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingVertical: space.s,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {flex: 1, marginLeft: space.m},
  divider: {height: StyleSheet.hairlineWidth, backgroundColor: colors.line},
  weekCard: {marginTop: space.m, flexDirection: 'row', alignItems: 'center'},
  weekText: {flex: 1},
  gapS: {marginTop: space.xs},
  up: {color: colors.success},
  down: {color: colors.danger},
  spark: {flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 4},
  sparkBar: {width: 8, borderRadius: 4, backgroundColor: colors.line},
  sparkOn: {backgroundColor: colors.tanDeep},
});
