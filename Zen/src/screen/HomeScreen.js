import {StyleSheet, Text, View, TouchableOpacity, Image} from 'react-native';
import React from 'react';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EntypoIcons from 'react-native-vector-icons/Entypo';

const HomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      {/* <Header
        title='Home'
        navigation={navigation}/> */}
      <View style={styles.Header}>
        <View style={styles.HeaderText}>
          <Text style={styles.selectText}>Home</Text>
          <Text
            style={styles.HeadText}
            onPress={() => navigation.navigate('SakhaHomeScreen')}>
            Sakha
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('BreathProgress')}>
          <Icon name="timelapse" size={40} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <Image
          style={styles.homeImage}
          source={require('../images/homeScreen.jpg')}
        />
        <Text style={styles.bodyText}>{'How You Feeling Today ?'}</Text>
        <View style={styles.line} />
        <View style={{marginVertical: '10%'}}>
          <TouchableOpacity
            style={styles.tabs}
            onPress={() => navigation.navigate('BreathScreen')}>
            <MaterialCommunityIcons
              name="weather-windy"
              size={27}
              color="black"
            />
            <Text style={styles.tabText}>{'Breathe (lantern game)'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabs}
            onPress={() => navigation.navigate('WorryScreen')}>
            <MaterialCommunityIcons
              name="weather-lightning-rainy"
              size={27}
              color="black"
            />
            <Text style={styles.tabText}>{'Worry battle'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabs}
            onPress={() =>
              navigation.navigate('AnxityLevelScreen', {id: 'Anxious'})
            }>
            <MaterialCommunityIcons
              name="emoticon-sad-outline"
              size={29}
              color="black"
            />
            <Text style={styles.tabText}>{'Anxious'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabs}
            onPress={() =>
              navigation.navigate('AnxityLevelScreen', {id: 'Stressed'})
            }>
            <EntypoIcons name="emoji-sad" size={25} color="black" />
            <Text style={styles.tabText}>{'Stressed'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabs}
            onPress={() =>
              navigation.navigate('AnxityLevelScreen', {id: 'Depressed'})
            }>
            <EntypoIcons name="emoji-sad" size={25} color="black" />
            <Text style={styles.tabText}>{'Depressed'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#F5F5DC',
    flex: 1,
  },
  Header: {
    height: '10%',
    flexDirection: 'row',
    padding: 18,
    justifyContent: 'space-between',
  },
  HeaderText: {
    flexDirection: 'row',
  },
  selectText: {
    fontSize: 25,
    color: 'black',
    fontWeight: 'bold',
    marginHorizontal: 10,
    marginTop: 3,
    paddingBottom: 2,
    borderBottomWidth: 3,
    borderColor: '#CBA46F',
  },
  HeadText: {
    color: 'black',
    marginHorizontal: 10,
    marginTop: 9,
    fontSize: 20,
    fontWeight: '500',
  },
  body: {
    height: '100%',
    marginLeft: 25,
    marginTop: 25,
    // backgroundColor:"red"
  },
  homeImage: {
    width: 331,
    height: 221,
    borderRadius: 110,
    marginTop: 25,
  },
  bodyText: {
    marginTop: '10%',
    fontSize: 18,
    color: 'black',
  },
  line: {
    height: 1,
    backgroundColor: 'black',
    width: 250,
    marginTop: 15,
  },
  tabs: {
    flexDirection: 'row',
    width: '85%',
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 20,
    // justifyContent: "space-between",
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
    color: 'black',
  },
});
