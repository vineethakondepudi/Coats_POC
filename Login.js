
import * as React from "react";
import * as WebBrowser from "expo-web-browser";
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
  ImageBackground,
  Button,
} from "react-native";
import { Avatar } from "react-native-paper";


WebBrowser.maybeCompleteAuthSession();

export default function LoginComponent({ navigation }) {
  const discovery = useAutoDiscovery(
    "https://login.microsoftonline.com/5da39af2-99ce-4f1d-af28-3ecd54d27a5c/v2.0"
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
            // console.error("Error exchanging code:", error);
          });
      }
    }
  }, [response, discovery, request, clientId, redirectUri]);

  React.useEffect(() => {
    if (token) {
      // console.log(token,'73')
      navigation.navigate('parent', token);
    }
  }, [token, navigation]);

  const image = {
    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPA9a-5J46t1VyWMvkeBlQ5L4e8z4CDPgFSQ&s",
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={image}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      >
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Coats_logo.svg/1200px-Coats_logo.svg.png",
            }}
          />
        </View>
        <Text style={styles.welcomeText}>Welcome to Coats</Text>
        <Pressable
          disabled={!request}
          onPress={() => {
            promptAsync();
          }}
          style={styles.button}
        >
          <Text style={styles.text}>Login to Continue...</Text>
        </Pressable>
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
