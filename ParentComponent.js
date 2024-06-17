
import React from 'react';
import {StyleSheet} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';
import DocumentScreen from './DocumentScreen';
import ProfileScreen from './ProfileScreen';
function ParentComponent(props) {

  const [tokenVal, setTokenVal] = React.useState(props.info);
  const Tab = createBottomTabNavigator();
return( 
  <Tab.Navigator  style={{position: 'fixed', alignItems: 'center' }}>
    <Tab.Screen name="document" component={DocumentScreen } options={({ route }) => {
          route.params = { token: tokenVal };
        }} />
    <Tab.Screen name="profile" component={ProfileScreen} options={({ route }) => {
          route.params = { token: tokenVal };
        }}/>
  </Tab.Navigator>
)

}

export default ParentComponent;







