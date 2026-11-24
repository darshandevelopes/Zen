import 'react-native-gesture-handler';
import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from './src/screen/HomeScreen';
import SakhaScreen from './src/screen/SakhaScreen';
import BreathScreen from './src/screen/BreathScreen';
import BreathProgressScreen from './src/screen/BreathProgressScreen';
import WorryScreen from './src/screen/WorryScreen';
import WorryVaultScreen from './src/screen/WorryVaultScreen';
import {colors} from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-variant-outline',
  Sakha: 'chat-processing-outline',
  Week: 'chart-box-outline',
};

const Tabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          // Breathing room under the labels so they don't touch the nav bar.
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 12 + insets.bottom,
        },
        tabBarLabelStyle: {fontSize: 12, fontWeight: '600'},
        tabBarIcon: ({color, size}) => (
          <Icon name={TAB_ICONS[route.name]} color={color} size={size} />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sakha" component={SakhaScreen} />
      <Tab.Screen name="Week" component={BreathProgressScreen} />
    </Tab.Navigator>
  );
};

const App = () => (
  <SafeAreaProvider>
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle="dark-content"
    />
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="BreathScreen" component={BreathScreen} />
        <Stack.Screen name="WorryScreen" component={WorryScreen} />
        <Stack.Screen name="WorryVault" component={WorryVaultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>
);

export default App;
