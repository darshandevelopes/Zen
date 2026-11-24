import React, {useCallback, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Button, Card, ScreenHeader, useBarStyle} from '../components/ui';
import {colors, space, type} from '../theme';
import {loadSessions, weeklyStats} from '../breath/sessions';
import {loadWorries, vaultStats} from '../worry/vault';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_H = 150;

const Stat = ({value, label}) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={type.small}>{label}</Text>
  </View>
);

const BreathProgressScreen = ({navigation}) => {
  useBarStyle('dark-content');
  const [data, setData] = useState(null);

  // Reload every time the tab is shown, e.g. after finishing a round.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([loadSessions(), loadWorries()]).then(([s, w]) => {
        if (alive) {
          setData({
            ...weeklyStats(s),
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

  if (!data) {
    return <View style={styles.container} />;
  }

  const {thisWeek, lastWeek, days, vault, toCheck} = data;
  const delta =
    thisWeek.end != null && lastWeek.end != null
      ? thisWeek.end - lastWeek.end
      : null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Your week" />
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={styles.centerCard}>
          {thisWeek.count === 0 ? (
            <>
              <Icon name="weather-night" size={36} color={colors.tanDeep} />
              <Text style={[type.h2, styles.gapS]}>
                No rounds this week yet
              </Text>
              <Text style={[type.small, styles.center]}>
                {lastWeek.count
                  ? `Last week you settled to ${lastWeek.end}% on average.`
                  : 'Each breathing round you finish shows up here.'}
              </Text>
            </>
          ) : (
            <>
              <Text style={type.small}>On average you settled to</Text>
              <Text style={styles.hero}>{thisWeek.end}%</Text>
              <Text style={type.small}>steadiness by the end of a round</Text>
              {delta != null ? (
                <Text
                  style={[styles.delta, delta >= 0 ? styles.up : styles.down]}>
                  {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} points vs last week
                  ({lastWeek.end}%)
                </Text>
              ) : (
                <Text style={[type.small, styles.gapS]}>
                  Your first week. Next week you'll see the change.
                </Text>
              )}
            </>
          )}
        </Card>

        <Card style={styles.gap}>
          <Text style={type.label}>Last 7 days</Text>
          <View style={styles.chart}>
            {days.map(d => (
              <View key={d.date} style={styles.col}>
                <View style={styles.barArea}>
                  {d.count ? (
                    <>
                      <View
                        style={[
                          styles.barStart,
                          {height: (CHART_H * d.start) / 100},
                        ]}
                      />
                      <View
                        style={[
                          styles.barEnd,
                          {height: Math.max(4, (CHART_H * d.end) / 100)},
                        ]}
                      />
                    </>
                  ) : (
                    <View style={styles.emptyDot} />
                  )}
                </View>
                <Text style={styles.dayCount}>{d.count || ''}</Text>
                <Text style={type.small}>
                  {DAY_NAMES[new Date(d.date).getDay()]}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={[styles.swatch, styles.swatchStart]} />
            <Text style={type.small}>where you started</Text>
            <View style={[styles.swatch, styles.swatchEnd]} />
            <Text style={type.small}>where you settled</Text>
          </View>
        </Card>

        <Card style={[styles.gap, styles.statRow]}>
          <Stat value={thisWeek.count} label="rounds" />
          <Stat value={thisWeek.lit} label="lanterns lit" />
          <Stat
            value={thisWeek.start != null ? `${thisWeek.start}%` : '–'}
            label="avg start"
          />
        </Card>

        <TouchableOpacity
          onPress={() => navigation.navigate('WorryVault')}
          accessibilityRole="button"
          accessibilityLabel="Open worry vault">
          <Card style={[styles.gap, styles.vaultRow]}>
            <View style={styles.flex}>
              <Text style={type.label}>Worry vault</Text>
              <Text style={[type.h2, styles.gapXs]}>
                {vault.pctDidnt != null
                  ? `${vault.pctDidnt}% never happened`
                  : vault.total
                  ? `${vault.total} saved`
                  : 'Empty so far'}
              </Text>
              <Text style={type.small}>
                {toCheck
                  ? `${toCheck} waiting for you to check`
                  : 'Battle a worry to add one'}
              </Text>
            </View>
            <Icon name="chevron-right" size={26} color={colors.inkMuted} />
          </Card>
        </TouchableOpacity>

        <Button
          title="Breathe now"
          onPress={() => navigation.navigate('BreathScreen')}
          style={styles.cta}
        />
      </ScrollView>
    </View>
  );
};

export default BreathProgressScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {paddingHorizontal: space.m, paddingBottom: space.xl},
  flex: {flex: 1},
  center: {textAlign: 'center'},
  centerCard: {alignItems: 'center'},
  gap: {marginTop: space.m},
  gapS: {marginTop: space.s},
  gapXs: {marginTop: space.xs},
  hero: {fontSize: 60, fontWeight: '300', color: colors.teal},
  delta: {fontSize: 15, fontWeight: '600', marginTop: space.m},
  up: {color: colors.success},
  down: {color: colors.danger},
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.m,
  },
  col: {alignItems: 'center', flex: 1},
  barArea: {
    height: CHART_H,
    width: 22,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barStart: {
    position: 'absolute',
    bottom: 0,
    width: 22,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
  },
  barEnd: {width: 12, borderRadius: 6, backgroundColor: colors.tanDeep},
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  dayCount: {
    color: colors.tanDeep,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    minHeight: 14,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.m,
  },
  swatch: {width: 10, height: 10, borderRadius: 3, marginRight: 6},
  swatchStart: {backgroundColor: colors.line},
  swatchEnd: {backgroundColor: colors.tanDeep, marginLeft: 14},
  statRow: {flexDirection: 'row', justifyContent: 'space-around'},
  stat: {alignItems: 'center', flex: 1},
  statValue: {fontSize: 26, fontWeight: '300', color: colors.ink},
  vaultRow: {flexDirection: 'row', alignItems: 'center'},
  cta: {alignSelf: 'center', marginTop: space.l, minWidth: 200},
});
