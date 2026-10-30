import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const Acitivity = ({activity}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Text style={styles.name}>{activity.name}</Text>
        <Text>Credit : {activity.credit}</Text>
      </View>
    </View>
  );
};

export default Acitivity;

const styles = StyleSheet.create({
  name: {
    fontSize: 18,
    color: 'black',
    marginVertical: 8,
    padding: 2,
  },
  creditName: {
    color: 'black',
  },
});
