import { StyleSheet, Text, View, FlatList, Pressable, TouchableOpacity, Alert } from 'react-native';
import React ,{useState} from 'react'
import Header from '../components/Header';
import Acitivity from '../components/Acitivity';
import { useRoute } from "@react-navigation/native";

const DEFAULT_ACTIVITIES = [
  {
    id: '1',
    name: 'Going for a walk outside',
    credit: 2,
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
    credit: 2,
  },
];

const ProgessTracker = ({navigation}) => {
  let route = useRoute();
  let finalls = route.params?.final;
  const activitiesToTrack = finalls && finalls.length > 0 ? finalls : DEFAULT_ACTIVITIES;
  const [selectedActivities, setSelectedActivities] = useState([]);
    
  const handlePress = (id) => {
    if (selectedActivities.includes(id)) {
      setSelectedActivities(selectedActivities.filter(a => a !== id));
    } else {
      setSelectedActivities([...selectedActivities, id]);
    }
  };
  const handleDone = () => {
    if (selectedActivities.length >= activitiesToTrack.length && activitiesToTrack.length > 0) {
      navigation.navigate('WinnerScreen', {
        selectedRewards: route.params?.selectedRewards,
      });
    } else {
      Alert.alert('Incomplete Activities', 'Please complete all activities before proceeding.');
    }
  };
  return (
    <View style={styles.container}>
      <Header title="" navigation={navigation} />
      <View style={styles.body}> 
        <View style={styles.bodyUpper}>
          <Text style={styles.bodyText}>{"Progress Tracker : "}</Text>
          <Text style={styles.subText}>
            Completed {selectedActivities.length} of {activitiesToTrack.length}
          </Text>
        </View>
        <View style={styles.bodylower}>
          <FlatList
            data={activitiesToTrack}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePress(item.id)}
                style={[
                  styles.activityCard,
                  { backgroundColor: selectedActivities.includes(item.id) ? '#C3E6CB' : '#FFFFFF' },
                ]}
              >
                <Acitivity activity={item} />
              </Pressable>
            )}
          /> 
        </View>
        <TouchableOpacity style={styles.button} onPress={handleDone} >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ProgessTracker

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
      subText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 10,
      },
      body:{
        margin:10,
        padding:8,
        flex: 1,
      },
      bodyUpper:{
        paddingVertical:10,
      },
      activityCard: {
        padding: 8,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 10,
        backgroundColor:"#FFFFFF"
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
      bodylower:{
        flex: 1,
      }
})