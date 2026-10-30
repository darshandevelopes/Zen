import 'react-native-gesture-handler';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './src/screen/HomeScreen';
import AnxityLevelScreen from './src/screen/AnxityLevelScreen';
import ActivityScreen from './src/screen/ActivityScreen';
import RewardScreen from './src/screen/RewardScreen';
import ConfirmScreen from './src/screen/ConfirmScreen';
import ProgessTracker from './src/screen/ProgessTracker';
import WinnerScreen from './src/screen/WinnerScreen';
import ReviewScreen1 from './src/screen/ReviewScreen1';
import SakhaScreen from './src/screens/SakhaScreen';
import SakhaHomeScreen from './src/screens/SakhaHomeScreen';

const App = () => {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HomeScreen"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="AnxityLevelScreen" component={AnxityLevelScreen} />
        <Stack.Screen name="ActivityScreen" component={ActivityScreen} />
        <Stack.Screen name="RewardScreen" component={RewardScreen} />
        <Stack.Screen name="ConfirmScreen" component={ConfirmScreen} />
        <Stack.Screen name="ProgessTracker" component={ProgessTracker} />
        <Stack.Screen name="WinnerScreen" component={WinnerScreen} />
        <Stack.Screen name="ReviewScreen1" component={ReviewScreen1} />
        <Stack.Screen name="SakhaHomeScreen" component={SakhaHomeScreen} />
        <Stack.Screen name="SakhaScreen" component={SakhaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
