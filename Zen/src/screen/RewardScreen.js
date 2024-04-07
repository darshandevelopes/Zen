import { StyleSheet, Text, View ,FlatList ,TouchableOpacity ,Pressable} from 'react-native'
import React ,{useState} from 'react'
import Header from '../../components/Header';
import Reward from '../components/Reward';
import { useRoute } from "@react-navigation/native";


const REWARD_LIST= [
    {
      id: '1',
      name: 'Go eat Icecream',
      
      
      

    },
    {
      id: '2',
      name: 'Buy Something',
  
    },
    {
      id: '3',
      name: 'Mobile Game',
  

    },
    {
      id: '4',
      name: 'Nap',

    },
  ];

const RewardScreen = ({navigation}) => {
    let route = useRoute();
    let aclist = route.params?.activitylist;
    console.log(aclist)
    const [selectedReward, setSelectedReaward] = useState([]);
    const toggleActivity = (id) => {
        const index = selectedReward.findIndex((item) => item === id);
        if (index === -1) {
            setSelectedReaward([...selectedReward, id]);
        } else {
          const updatedActivities = [...selectedReward];
          updatedActivities.splice(index, 1);
          setSelectedReaward(updatedActivities);
        }
      };
  return (
    <View style={styles.container}>
    <Header title="" navigation={navigation} />
   <View style={styles.body}> 
   <View style={styles.bodyUpper}>
    <Text  style={styles.bodyText} >{"Reward : "}</Text>
   </View>
   <View style={styles.bodylower}>
   <FlatList
     data={REWARD_LIST}
     keyExtractor={item => item.id}
     renderItem={({item}) => (
        <Pressable
        onPress={() => toggleActivity(item.id)}
        style={[styles.activityCard, { backgroundColor: selectedReward.includes(item.id) ? '#FEDDB3' : 'white' }]}
      >
        <Reward reward={item} />
      </Pressable>
     )}
     /> 
   </View>
   <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ConfirmScreen',{"aclist":aclist})}>
      <Text style={styles.buttonText}>Next</Text>
    </TouchableOpacity>
    
   
   </View>
   
    </View>
  )
}

export default RewardScreen

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
        marginVertical:5
      },
      body:{
        margin:10,
        padding:8
      },
      bodyUpper:{
        paddingVertical:20,
      },
      activityCard: {
        padding: 2,
        marginVertical: 5,
        marginLeft:3,
        borderWidth: 1,
        borderColor: 'black',
        height: 50,
        borderRadius: 10,
        backgroundColor:"#FFFFFF"
        
      },
      button: {
        width: 200,
        backgroundColor: '#D2B48C',
        height: 33,
        borderRadius: 5,
        margin: "60%",
        marginHorizontal: 66,
      },
      buttonText: {
        fontSize: 20,
        textAlign: 'center',
        color: 'black',
        padding: 2,
      },
      bodylower:{
        marginVertical:20
      }
})