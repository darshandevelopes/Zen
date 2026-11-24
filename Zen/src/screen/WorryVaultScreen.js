import React, {useCallback, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {loadWorries, setOutcome, vaultStats} from '../worry/vault';

const LANTERN = '#FFB347';
const DAY = 24 * 60 * 60 * 1000;

const ago = at => {
  const days = Math.floor((Date.now() - at) / DAY);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
};

const WorryVaultScreen = ({navigation}) => {
  const {width, height} = useWindowDimensions();
  const [worries, setWorries] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadWorries().then(all => alive && setWorries(all.slice().reverse()));
      return () => {
        alive = false;
      };
    }, []),
  );

  const mark = async (id, outcome) => {
    const all = await setOutcome(id, outcome);
    setWorries(all.slice().reverse());
  };

  const stats = vaultStats(worries || []);

  const header = (
    <View style={styles.hero}>
      {stats.pctDidnt != null ? (
        <>
          <Text style={styles.heroNum}>{stats.pctDidnt}%</Text>
          <Text style={styles.heroText}>
            of the worries you've checked never happened ({stats.didnt} of{' '}
            {stats.checked})
          </Text>
        </>
      ) : (
        <Text style={styles.heroText}>
          {stats.total
            ? 'After a few days, mark whether each worry actually happened. Over time this shows how often your mind is right.'
            : 'Worries you battle are kept here.'}
        </Text>
      )}
    </View>
  );

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <Text style={styles.when}>
        {ago(item.at)} · {item.cleared}% cleared
      </Text>
      <Text style={styles.worry}>“{item.worry}”</Text>
      {!!item.thought && <Text style={styles.thought}>{item.thought}</Text>}
      {item.outcome ? (
        <Text
          style={[
            styles.outcome,
            item.outcome === 'didnt' ? styles.didnt : styles.happened,
          ]}>
          {item.outcome === 'didnt' ? '✓ It didn’t happen' : 'It happened'}
        </Text>
      ) : (
        <View style={styles.row}>
          <Text style={styles.ask}>Did it happen?</Text>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => mark(item.id, 'didnt')}>
            <Text style={styles.chipText}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => mark(item.id, 'happened')}>
            <Text style={styles.chipText}>Yes</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#05081A" />
            <Stop offset="1" stopColor="#2A2150" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#bg)" />
      </Svg>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Worry vault</Text>
        <View style={styles.spacer} />
      </View>
      {worries && (
        <FlatList
          data={worries}
          keyExtractor={w => w.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.push('WorryScreen')}>
              <Text style={styles.buttonText}>Battle a worry</Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
};

export default WorryVaultScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#05081A'},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {color: '#FFFFFF', fontSize: 20, fontWeight: '500'},
  link: {color: '#C9D3FF', fontSize: 17, padding: 8},
  spacer: {width: 60},
  list: {paddingHorizontal: 20, paddingBottom: 40},
  hero: {alignItems: 'center', paddingVertical: 18, paddingHorizontal: 10},
  heroNum: {color: LANTERN, fontSize: 56, fontWeight: '300'},
  heroText: {
    color: '#A9B3E0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  card: {
    backgroundColor: 'rgba(18,24,56,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,211,255,0.12)',
    padding: 18,
    marginBottom: 14,
  },
  when: {color: '#7F8AC0', fontSize: 12},
  worry: {color: '#FFFFFF', fontSize: 17, marginTop: 6},
  thought: {
    color: '#C3CAF0',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  ask: {color: '#A9B3E0', fontSize: 14, flex: 1},
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,179,71,0.6)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginLeft: 8,
  },
  chipText: {color: LANTERN, fontSize: 14, fontWeight: '600'},
  outcome: {fontSize: 14, fontWeight: '600', marginTop: 14},
  didnt: {color: '#8EE3B0'},
  happened: {color: '#A9B3E0'},
  button: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: LANTERN,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  buttonText: {color: '#1A1030', fontSize: 17, fontWeight: '600'},
});
