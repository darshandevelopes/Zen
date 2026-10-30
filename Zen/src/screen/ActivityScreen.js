import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import Header from '../components/Header';
import Acitivity from '../components/Acitivity';
import {useRoute} from '@react-navigation/native';

const ACTIVITY_LIST = [
  {
    id: '1',
    name: 'Going for a walk outside',
    credit: 3,
  },
  {
    id: '2',
    name: 'Take a deep breath',
    credit: 1,
  },
  {
    id: '3',
    name: 'Listen your fav music',
    credit: 2,
  },
  {
    id: '4',
    name: 'Progressive muscle relaxation',
    credit: 4,
  },
  {
    id: '5',
    name: 'Reading a good Book',
    credit: 4,
  },
  {
    id: '6',
    name: 'Watch a ted talks!',
    credit: 4,
  },
];

const ActivityScreen = ({navigation}) => {
  let route = useRoute();
  const initialCoins =
    typeof route.params?.coin === 'number' ? route.params.coin : 0;
  const [coins, setCoins] = useState(initialCoins);

  const [selectedActivities, setSelectedActivities] = useState([]);

  const toggleActivity = (id, credit) => {
    if (selectedActivities.includes(id)) {
      setSelectedActivities(
        selectedActivities.filter(activity => activity !== id),
      );
      setCoins(coins + credit);
    } else {
      setSelectedActivities([...selectedActivities, id]);
      if (coins - credit > 0) {
        setCoins(coins - credit);
      } else {
        setCoins(0);
      }
    }
  };
  const results = ACTIVITY_LIST.filter(activity =>
    selectedActivities.includes(activity.id),
  );

  const handleNext = () => {
    if (results.length === 0) {
      Alert.alert(
        'Select Activity',
        'Please select at least one activity to proceed.',
      );
      return;
    }
    navigation.navigate('RewardScreen', {activitylist: results});
  };

  return (
    <View style={styles.container}>
      <Header title="" navigation={navigation} />
      <View style={styles.body}>
        <View style={styles.bodyUpper}>
          <Text style={styles.bodyText}>{'Your SAD Credit is : '}</Text>
          <Text style={{fontSize: 25, color: 'black'}}>{coins}</Text>
          <Text style={{fontSize: 18, color: 'black', marginVertical: 20}}>
            {'Challenge  : Spend all the Coins Today  '}
          </Text>
          <Text style={{fontSize: 20, color: 'black', marginVertical: 1}}>
            {'Select below activities : '}
          </Text>
        </View>
        <View style={styles.bodylower}>
          <FlatList
            data={ACTIVITY_LIST}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <Pressable
                onPress={() => toggleActivity(item.id, item.credit)}
                style={[
                  styles.activityCard,
                  {
                    backgroundColor: selectedActivities.includes(item.id)
                      ? '#FEDDB3'
                      : 'white',
                  },
                ]}>
                <Acitivity activity={item} />
              </Pressable>
            )}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActivityScreen;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#F5F5DC',
    flex: 1,
  },
  bodyText: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
    marginVertical: 5,
  },
  body: {
    padding: 8,
    height: '70%',
  },
  bodyUpper: {
    paddingVertical: 20,
  },
  activityCard: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: 'black',
    height: 85,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  button: {
    width: 200,
    backgroundColor: '#D2B48C',
    height: 33,
    borderRadius: 5,
    margin: 10,
    marginHorizontal: 80,
  },
  buttonText: {
    fontSize: 20,
    textAlign: 'center',
    color: 'black',
    padding: 2,
  },
  bodylower: {
    height: '80%',
  },
});
