import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Button, Card, ScreenHeader, useBarStyle} from '../components/ui';
import {colors, radius, space, type} from '../theme';
import {loadWorries, setOutcome, vaultStats} from '../worry/vault';

const DAY = 24 * 60 * 60 * 1000;

const ago = at => {
  const days = Math.floor((Date.now() - at) / DAY);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
};

const Chip = ({title, onPress}) => (
  <TouchableOpacity
    style={styles.chip}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`It ${title === 'No' ? "didn't happen" : 'happened'}`}>
    <Text style={styles.chipText}>{title}</Text>
  </TouchableOpacity>
);

const WorryVaultScreen = ({navigation}) => {
  useBarStyle('dark-content');
  const insets = useSafeAreaInsets();
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
          <Text style={[type.body, styles.center]}>
            of the worries you've checked never happened ({stats.didnt} of{' '}
            {stats.checked})
          </Text>
        </>
      ) : (
        <Text style={[type.body, styles.center]}>
          {stats.total
            ? 'After a few days, mark whether each worry actually happened. Over time this shows how often your mind is right.'
            : 'Worries you battle are kept here.'}
        </Text>
      )}
    </View>
  );

  const renderItem = ({item}) => (
    <Card style={styles.item}>
      <Text style={type.small}>
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
          <Text style={[type.body, styles.ask]}>Did it happen?</Text>
          <Chip title="No" onPress={() => mark(item.id, 'didnt')} />
          <Chip title="Yes" onPress={() => mark(item.id, 'happened')} />
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Worry vault" onBack={() => navigation.goBack()} />
      {worries && (
        <FlatList
          data={worries}
          keyExtractor={w => w.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={[
            styles.list,
            {paddingBottom: insets.bottom + space.l},
          ]}
          ListFooterComponent={
            <Button
              title="Battle a worry"
              onPress={() => navigation.push('WorryScreen')}
              style={styles.footer}
            />
          }
        />
      )}
    </View>
  );
};

export default WorryVaultScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  list: {paddingHorizontal: space.m},
  hero: {
    alignItems: 'center',
    paddingVertical: space.l,
    paddingHorizontal: space.m,
  },
  heroNum: {fontSize: 56, fontWeight: '300', color: colors.teal},
  center: {textAlign: 'center'},
  item: {marginBottom: space.m, padding: space.m + 2},
  worry: {...type.h2, fontSize: 18, marginTop: space.s},
  thought: {
    ...type.body,
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: space.s,
  },
  row: {flexDirection: 'row', alignItems: 'center', marginTop: space.m},
  ask: {flex: 1},
  chip: {
    minWidth: 56,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: space.m,
    marginLeft: space.s,
  },
  chipText: {color: colors.teal, fontSize: 15, fontWeight: '600'},
  outcome: {fontSize: 15, fontWeight: '600', marginTop: space.m},
  didnt: {color: colors.success},
  happened: {color: colors.inkMuted},
  footer: {alignSelf: 'center', marginTop: space.s, minWidth: 200},
});
