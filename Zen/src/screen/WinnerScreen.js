import { Image, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native'
import React from 'react'
import Header from '../components/Header'
import { useRoute } from '@react-navigation/native'

const WinnerScreen = ({navigation}) => {
    const route = useRoute();
    const selectedRewards = route.params?.selectedRewards;
    const rewardName = selectedRewards?.[0]?.name || 'Reward';
    
    function handleSubmit() {
        Alert.alert('Great Job !', `Time to enjoy: ${rewardName}`);
        navigation.navigate('ReviewScreen1');   
    }
  return (
    <View style={styles.container}>
         <Header title="" navigation={navigation} />
        <View style={styles.body}>
            <View style={styles.bodyHeading}>
                <Text style={styles.bodyText}>Hurray</Text>
                <Text style={{fontSize:18 , marginTop:2 ,color:"black"}}>We Have a WINNER</Text>
            </View>
            <View style={styles.bodyImage}>
                    <Image
                style={styles.image}
                source={require('../images/winner.png')}
                />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Time to Reward</Text>
            </TouchableOpacity>
           
        </View>
    </View>
  )
}

export default WinnerScreen

const styles = StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: '#F5F5DC',
      flex: 1,
    },
    body: {
      flex: 1,
      alignItems: 'center',
    },
    bodyHeading:{
        margin:20,
        alignItems:"center"
    },
    bodyText:{
        fontSize:25,
        color:"black",
        fontWeight:"600"
    },
    bodyImage:{
       alignItems: 'center',
       marginVertical: 10,
    },
    image: {
      width: 250,
      height: 250,
      resizeMode: 'contain',
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
})