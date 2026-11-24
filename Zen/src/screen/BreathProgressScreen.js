import React, {useCallback, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {loadSessions, weeklyStats} from '../breath/sessions';

const LANTERN = '#FFB347';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_H = 160;

const Stat = ({value, label}) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BreathProgressScreen = ({navigation}) => {
  const {width, height} = useWindowDimensions();
  const [stats, setStats] = useState(null);

  // Reload every time the screen is shown, e.g. after finishing a session.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadSessions().then(s => alive && setStats(weeklyStats(s)));
      return () => {
        alive = false;
      };
    }, []),
  );

  const background = (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#05081A" />
          <Stop offset="1" stopColor="#2A2150" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#bg)" />
    </Svg>
  );

  if (!stats) {
    return <View style={styles.container}>{background}</View>;
  }

  const {thisWeek, lastWeek, days} = stats;
  const delta =
    thisWeek.end != null && lastWeek.end != null
      ? thisWeek.end - lastWeek.end
      : null;

  return (
    <View style={styles.container}>
      {background}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your week</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {thisWeek.count === 0 ? (
          <View style={styles.card}>
            <View style={styles.emptyLantern} />
            <Text style={styles.heroLine}>No lanterns this week yet</Text>
            <Text style={styles.muted}>
              {lastWeek.count
                ? `Last week you settled to ${lastWeek.end}% on average.`
                : 'Each round you finish shows up here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.muted}>On average you settled to</Text>
            <Text style={styles.hero}>{thisWeek.end}%</Text>
            <Text style={styles.muted}>steadiness by the end of a round</Text>
            {delta != null ? (
              <Text
                style={[
                  styles.delta,
                  delta >= 0 ? styles.deltaUp : styles.deltaDown,
                ]}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} points vs last week (
                {lastWeek.end}%)
              </Text>
            ) : (
              <Text style={styles.muted}>
                Your first week. Next week you'll see the change.
              </Text>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last 7 days</Text>
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
                <Text style={styles.dayName}>
                  {DAY_NAMES[new Date(d.date).getDay()]}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={[styles.swatch, styles.swatchStart]} />
            <Text style={styles.legendText}>where you started</Text>
            <View style={[styles.swatch, styles.swatchEnd]} />
            <Text style={styles.legendText}>where you settled</Text>
          </View>
        </View>

        <View style={[styles.card, styles.statRow]}>
          <Stat value={thisWeek.count} label="rounds" />
          <Stat value={thisWeek.lit} label="lanterns lit" />
          <Stat
            value={thisWeek.start != null ? `${thisWeek.start}%` : '–'}
            label="avg start"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('BreathScreen')}>
          <Text style={styles.buttonText}>Breathe now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default BreathProgressScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#05081A'},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  back: {color: '#C9D3FF', fontSize: 18, padding: 8},
  backSpacer: {width: 70},
  title: {color: '#FFFFFF', fontSize: 20, fontWeight: '500'},
  body: {paddingHorizontal: 20, paddingBottom: 40},
  card: {
    backgroundColor: 'rgba(18,24,56,0.85)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(201,211,255,0.12)',
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#C9D3FF',
    fontSize: 15,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  muted: {color: '#A9B3E0', fontSize: 14, textAlign: 'center'},
  hero: {color: LANTERN, fontSize: 64, fontWeight: '300', marginVertical: 2},
  heroLine: {color: '#FFFFFF', fontSize: 20, marginVertical: 10},
  delta: {fontSize: 15, marginTop: 14, fontWeight: '500'},
  deltaUp: {color: '#8EE3B0'},
  deltaDown: {color: '#F2A6A6'},
  emptyLantern: {
    width: 28,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,179,71,0.35)',
  },
  chart: {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
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
    backgroundColor: 'rgba(201,211,255,0.18)',
  },
  barEnd: {width: 12, borderRadius: 6, backgroundColor: LANTERN},
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(201,211,255,0.25)',
  },
  dayCount: {color: LANTERN, fontSize: 11, marginTop: 6, minHeight: 14},
  dayName: {color: '#7F8AC0', fontSize: 12},
  legend: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  swatch: {width: 10, height: 10, borderRadius: 3, marginRight: 6},
  swatchStart: {backgroundColor: 'rgba(201,211,255,0.3)'},
  swatchEnd: {backgroundColor: LANTERN, marginLeft: 14},
  legendText: {color: '#A9B3E0', fontSize: 12},
  statRow: {flexDirection: 'row', justifyContent: 'space-around'},
  stat: {alignItems: 'center', flex: 1},
  statValue: {color: '#FFFFFF', fontSize: 26, fontWeight: '300'},
  statLabel: {color: '#7F8AC0', fontSize: 12, marginTop: 2},
  button: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: LANTERN,
    borderRadius: 24,
    paddingHorizontal: 44,
    paddingVertical: 12,
  },
  buttonText: {color: '#1A1030', fontSize: 18, fontWeight: '600'},
});
