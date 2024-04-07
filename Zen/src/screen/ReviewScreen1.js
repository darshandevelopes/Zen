import { StyleSheet, Text, View ,TouchableOpacity } from 'react-native'
import React ,{useState} from 'react'
import Header from '../../components/Header'
import Slider from '@react-native-community/slider';

const ReviewScreen1 = ({navigation}) => {
const [anxietyLevel, setAnxietyLevel] = useState(0);
const handleSliderChange = value => {
    setAnxietyLevel(value);
  };
  return (
    <View style={styles.container}>
      <Header title="" navigation={navigation} />
      <View style={styles.body}>
        <View style={styles.silderView}>
          <Text style={styles.bodyText}>{'How Anxious you feeling now ?'}</Text>
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
        {/* <View style={styles.silderView}>
         
        </View> */}
        {/* <View>
          <Text style={{marginTop: '60%', fontSize: 18, color: 'black'}}>
            {'SAD Coins = Anxious level - Ideal level'}
          </Text>
        </View> */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('HomeScreen')}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ReviewScreen1

const styles = StyleSheet.create({
    container: {
        height: '100%',
        backgroundColor: '#F5F5DC',
        flex: 1,
      },
    
      slider: {
        height: 50,
        width: '90%',
      },
      body: {
        margin: 20,
      },
      silderView: {
        marginVertical: 30,
      },
     
      button: {
        width: 200,
        backgroundColor: '#D2B48C',
        height: 33,
        borderRadius: 5,
        margin: 70,
        marginHorizontal: 66,
      },
      buttonText: {
        fontSize: 20,
        textAlign: 'center',
        color: 'black',
        padding: 2,
      },
})