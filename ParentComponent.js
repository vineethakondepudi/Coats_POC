


import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "@react-navigation/native";
import ProfileScreen from './ProfileScreen'
import Document from "./DocumentScreen";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";

function ParentComponent(props) {
  const [tokenVal, setTokenVal] = React.useState(props.route.params);
  const Tab = createBottomTabNavigator();
// console.log(props.route.params,"parentcomponent")
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarLabelStyle: {
          fontWeight: "bold",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home" ? 'Document' : '' ) {
            iconName = "document-text-outline"; // Change this icon to your preference
          } else if (route.name === "Profile") {
            iconName = "person-circle-outline"; // Change this icon to your preference
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* <Tab.Screen
        name="Document"
        component={DocumentScreen}
        options={{ tabBarLabel: "Document" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ token: tokenVal }}
        options={{ tabBarLabel: "Profile" }}
      /> */}
        <Tab.Screen name="Home" component={Document } options={({ route }) => {
          route.params = { token: tokenVal };
        }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={({ route }) => {
          route.params = { token: tokenVal };
        }}/>
    </Tab.Navigator>
  );
}
export default ParentComponent;