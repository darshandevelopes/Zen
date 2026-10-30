import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React from 'react';
import {Surface, Title} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Header = ({title, navigation}) => {
  return (
    <Surface style={styles.header}>
      <View style={styles.view}>
        {
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back-ios" size={30} color="black" />
          </TouchableOpacity>
        }
      </View>
      <View style={styles.view}>
        <Title style={{color: 'black'}}>{title}</Title>
      </View>
      {/* <View style={styles.view}>
        {
          <TouchableOpacity onPress={() =>  navigation.navigate("ProfileScreen")}>
            <Icon name="person" size={40} color="white" />
          </TouchableOpacity>
        }
      </View> */}
    </Surface>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    height: '8%',
    elevation: 8,
    //   justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#D2B48C',
  },
  view: {
    marginHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
});
