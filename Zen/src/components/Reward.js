import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Reward = ({reward}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Text style={styles.name}>{reward.name}</Text>
      </View>
    </View>
  )
}

export default Reward

const styles = StyleSheet.create({
    name:{
        fontSize:18,
        color:"black" ,
        marginVertical:8 ,
        marginHorizontal:8,
        padding:2 
    },
     creditName:{
        color:"black"
    }
})