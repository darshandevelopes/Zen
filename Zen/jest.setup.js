/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Entypo', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const {View} = require('react-native');
  return props => React.createElement(View, props);
});
