import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginComponent from './Login';
import ParentComponent from './ParentComponent';

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      {/* <ParentComponent></ParentComponent> */}

      <Stack.Navigator initialRouteName="login">
    
      <Stack.Screen name="login" component={LoginComponent} options={{ headerShown: false }} />
      <Stack.Screen name="parent" component={ParentComponent} options={{ headerShown: false }}  />
    
    </Stack.Navigator>
      {/* <Text>Open up App.js to start working on your app!</Text> */}
      <StatusBar style="auto" />
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
