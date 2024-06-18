import { jwtDecode } from "jwt-decode";
import React from "react";
import { StyleSheet, Text, View, ImageBackground, Button } from "react-native";
import { Avatar, Card, Divider, IconButton } from "react-native-paper";

const ProfileScreen = ({ route}) => {
  const { token } = route.params;
  const decoded = jwtDecode(token)
  console.log(decoded, "decode");
  const image = {
    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKyUA5Gu8aqtrI6eZkQhmo-KT93kIryUQhsQ&s",
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={image}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      >
        <View style={styles.overlay}>
          <Avatar.Image
            size={120}
            source={{
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpC01ITIIRhKRmGdonCwoEmFHMmKWYWrs6HfjsceLWlCaZWsjB",
            }}
          />
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.header}>{decoded.name.toUpperCase()}</Text>
              {/* <Text style={styles.subHeader}>Software Engineer</Text> */}
              <Divider style={styles.divider} />
              <Text style={styles.info}>
                <Text style={styles.label}>Email: </Text>
                Abhishek-in@sykmss.onmicrosoft.com
              </Text>
              <Text style={styles.info}>
                <Text style={styles.label}>App Name: </Text>
                {decoded.app_displayname}
              </Text>
              {/* <Text style={styles.info}>
                <Text style={styles.label}>Unique Name: </Text>
                {decoded.unique_name}
              </Text> */}
            </Card.Content>
          </Card>
          <View style={styles.button}>
                <Button style={styles.button} title='Sign Out' onPress={() => navigation.navigate('login')}></Button>
              </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,

  },
  card: {
    width: "90%",
    padding: 20,
    marginTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 18,
    color: "#888",
    marginBottom: 10,
    textAlign: "center",
  },
  divider: {
    marginVertical: 15,
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
  },
  button: {
  
    alignItems: 'center',
    justifyContent: 'center',
    top:40
  },
});