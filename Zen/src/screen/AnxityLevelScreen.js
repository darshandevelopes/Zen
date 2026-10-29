import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Header from '../components/Header';
import Slider from '@react-native-community/slider';
import {useRoute} from '@react-navigation/native';

const AnxityLevelScreen = ({navigation}) => {
  const [anxietyLevel, setAnxietyLevel] = useState(1);
  const [idealLevel, setIdealLevel] = useState(1);
  const handleSliderChange = value => {
    setAnxietyLevel(value);
  };
  const idealhandleSliderChange = value => {
    setIdealLevel(value);
  };
  const route = useRoute();
  const id = route.params?.id || 'Anxious';
  const sad = Math.max(0, anxietyLevel - idealLevel);
  return (
    <View style={styles.container}>
      <Header title="" navigation={navigation} />
      <View style={styles.body}>
        <View style={styles.silderView}>
          <Text style={styles.bodyText}>How {id} you are ?</Text>
          <View style={{flexDirection: 'row'}}>
            <Text style={{fontSize: 25, marginTop: 5, color: 'black'}}>
              {'1'}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              minimumTrackTintColor="#D2B48C"
              maximumTrackTintColor="black"
              step={1}
              value={anxietyLevel}
              onValueChange={handleSliderChange}
            />
            <Text style={{fontSize: 25, marginTop: 5, color: 'black'}}>
              {'10'}
            </Text>
          </View>
        </View>
        <View style={styles.silderView}>
          <Text style={styles.bodyText}>{'Pick ideal level'}</Text>
          <View style={{flexDirection: 'row'}}>
            <Text style={{fontSize: 25, marginTop: 5, color: 'black'}}>
              {'1'}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              minimumTrackTintColor="#D2B48C"
              maximumTrackTintColor="black"
              step={1}
              value={idealLevel}
              onValueChange={idealhandleSliderChange}
            />
            <Text style={{fontSize: 25, marginTop: 5, color: 'black'}}>
              {'10'}
            </Text>
          </View>
        </View>
        <View style={styles.coinCalcView}>
          <Text style={styles.calcText}>
            SAD Coins ({sad}) = {id} level ({anxietyLevel}) - Ideal level (
            {idealLevel})
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ActivityScreen', {coin: sad})}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AnxityLevelScreen;

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
    marginBottom: 10,
  },
  slider: {
    height: 50,
    width: '90%',
  },
  body: {
    margin: 20,
    flex: 1,
  },
  silderView: {
    marginVertical: 20,
  },
  coinCalcView: {
    marginTop: 40,
    marginBottom: 20,
  },
  calcText: {
    fontSize: 18,
    color: 'black',
  },
  button: {
    width: 200,
    backgroundColor: '#D2B48C',
    height: 40,
    borderRadius: 5,
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  buttonText: {
    fontSize: 20,
    textAlign: 'center',
    color: 'black',
  },
});
