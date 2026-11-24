import 'react-native-gesture-handler';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './src/screen/HomeScreen';
import SakhaScreen from './src/screens/SakhaScreen';
import SakhaHomeScreen from './src/screens/SakhaHomeScreen';
import BreathScreen from './src/screen/BreathScreen';
import BreathProgressScreen from './src/screen/BreathProgressScreen';
import WorryScreen from './src/screen/WorryScreen';
import WorryVaultScreen from './src/screen/WorryVaultScreen';

const App = () => {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HomeScreen"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="SakhaHomeScreen" component={SakhaHomeScreen} />
        <Stack.Screen name="SakhaScreen" component={SakhaScreen} />
        <Stack.Screen name="BreathScreen" component={BreathScreen} />
        <Stack.Screen name="BreathProgress" component={BreathProgressScreen} />
        <Stack.Screen name="WorryScreen" component={WorryScreen} />
        <Stack.Screen name="WorryVault" component={WorryVaultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
