// import * as React from 'react';
// import * as WebBrowser from 'expo-web-browser';
// import ParentComponent from './ParentComponent';
// import { NavigationContainer } from '@react-navigation/native';
// import {
//   exchangeCodeAsync,
//   makeRedirectUri,
//   useAuthRequest,
//   useAutoDiscovery,
// } from 'expo-auth-session';
// import { Button, Text, SafeAreaView } from 'react-native';

// WebBrowser.maybeCompleteAuthSession();

// export default function Login() {
//   // Endpoint
//   const discovery = useAutoDiscovery(
//     // 'https://login.microsoftonline.com/7eca4acf-dcdb-4fbb-9fc8-8bbf2d0ef3fc/v2.0'
//     //  'https://login.microsoftonline.com/29e96b43-7db6-4716-87e4-33dd38318476/v2.0'
//       // 'https://login.microsoftonline.com/29e96b43-7db6-4716-87e4-33dd38318476/v2.0'
//      ' https://login.microsoftonline.com/5da39af2-99ce-4f1d-af28-3ecd54d27a5c/v2.0'
  
//   );
//   const redirectUri = makeRedirectUri({
//     scheme: 'myapp',
//     path: 'http://localhost:8081',

    
//   });
//   // const clientId = '4b016ddb-8e60-4ea3-a728-9d9e7042c61e';

//   // const clientId = '1eefea9b-0596-48cc-9371-e05654506d36';
//   // const clientId = 'ca82f52d-8d87-4ada-aa05-38d188d889f1'
//   const clientId =  '99aedfde-1004-4f0d-8bb8-000ed0093190';

//   // We store the JWT in here
//   const [token, setToken] = React.useState(null);

//   const [request, response, promptAsync] = useAuthRequest(
//     {
//       clientId,
//       scopes: ['openid', 'profile', 'email', 'offline_access'],
//       redirectUri,
//     },
//     discovery
//   );

//   React.useEffect(() => {
//     if (response?.type === 'success') {
//       const { code } = response.params;

//       if (discovery) {
//         exchangeCodeAsync(
//           {
//             clientId,
//             code,
//             redirectUri,
//             extraParams: request?.codeVerifier
//               ? { code_verifier: request.codeVerifier }
//               : undefined,
//           },
//           discovery
//         ).then((res) => {
//           setToken(res.accessToken);
//         }).catch((error) => {
//           console.error('Error exchanging code:', error);
//         });
//       }
//     }
//   }, [response]);

//   return (
//     // <SafeAreaView>
// <NavigationContainer>
//       {token=== null &&<Button
//         disabled={!request}
//         title="Login"
//         onPress={() => {
//           promptAsync();
//         }}
//       />}
//       {/* <Text>{token ? `Token: ${token}` : 'Not logged in'}</Text> */}
//      {token!= null &&  <ParentComponent
//      info ={token}
//       />}
//       </NavigationContainer>
//   );
// }



import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import ParentComponent from "./ParentComponent";
import { NavigationContainer } from "@react-navigation/native";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from "expo-auth-session";
import {
  Pressable,
  Text,
  SafeAreaView,
  View,
  StyleSheet,
  Image,
  ImageBackground
} from "react-native";

import { Avatar } from "react-native-paper";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  // Endpoint
  const discovery = useAutoDiscovery(
    " https://login.microsoftonline.com/5da39af2-99ce-4f1d-af28-3ecd54d27a5c/v2.0"
  );
  const redirectUri = makeRedirectUri({
    scheme: "myapp",
    path: "http://localhost:8081",
  });
  const clientId = "99aedfde-1004-4f0d-8bb8-000ed0093190";

  // We store the JWT in here
  const [token, setToken] = React.useState(null);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      scopes: ["openid", "profile", "email", "offline_access"],
      redirectUri,
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;

      if (discovery) {
        exchangeCodeAsync(
          {
            clientId,
            code,
            redirectUri,
            extraParams: request?.codeVerifier
              ? { code_verifier: request.codeVerifier }
              : undefined,
          },
          discovery
        )
          .then((res) => {
            setToken(res.accessToken);
          })
          .catch((error) => {
            console.error("Error exchanging code:", error);
          });
      }
    }
  }, [response]);

  const image = {
    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPA9a-5J46t1VyWMvkeBlQ5L4e8z4CDPgFSQ&s",
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={image}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      >
        <NavigationContainer>
          {token === null && (
            <>
              <View style={styles.imageContainer}>
                <Image
                  style={styles.image}
                  source={{
                    uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Coats_logo.svg/1200px-Coats_logo.svg.png",
                  }}
                />
              </View>
              <Text style={styles.welcomeText}>Welcome to the Coats</Text>
              <Pressable
                disabled={!request}
                onPress={() => {
                  promptAsync();
                }}
                style={styles.button}
              >
                <Text style={styles.text}>Login to Continue...</Text>
              </Pressable>
            </>
          )}
          {token != null && <ParentComponent info={token} />}
        </NavigationContainer>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 80,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 60,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#005dab",
    marginBottom: 90,
    width: "70%",
    alignSelf: "center",
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
});