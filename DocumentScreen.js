
import React from "react";
import {
  StyleSheet,
  Text,
  SafeAreaView,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Button,
  Modal,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faFolder,
  faFile,
  faShare,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import * as WebBrowser from "expo-web-browser";
import * as Sharing from "expo-sharing";

WebBrowser.maybeCompleteAuthSession();

const Breadcrumb = ({ path, onPathClick }) => {
  return (
    <View style={styles.breadcrumbContainer}>
      {path.map((folder, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          <TouchableOpacity onPress={() => onPathClick(index)}>
            <Text style={styles.folderName}>{folder.name}</Text>
          </TouchableOpacity>
          {index < path.length - 1 && (
            <Text style={styles.separator}> {">"} </Text>
          )}
        </View>
      ))}
    </View>
  );
};

export default function DocumentScreen({ route }) {
  const [token, setToken] = React.useState(route.params);
  const [documents, setDocuments] = React.useState([]);
  const [selectedFileContent, setSelectedFileContent] = React.useState(null);
  const [navigationPath, setNavigationPath] = React.useState([
    { id: "root", name: "Document" },
  ]);
  const [isImageModalVisible, setIsImageModalVisible] = React.useState(false);

  const fetchSharePointDocuments = async (accessToken, folderId = "root") => {
    try {
      const siteId =
        "sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0";
      const libraryId =
        "b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0";

      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${folderId}/children`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setDocuments(response.data.value);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleItemClick = async (item) => {
    if (item.folder) {
      setSelectedFileContent(null);
      setNavigationPath([...navigationPath, { id: item.id, name: item.name }]);
      fetchSharePointDocuments(token.token, item.id);
    } else {
      fetchFileContent(item.id);
    }
  };

  const fetchFileContent = async (itemId) => {
    try {
      const siteId =
        "sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0";
      const libraryId =
        "b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0";

      const itemResponse = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token.token}`,
          },
        }
      );

      const mimeType = itemResponse.data.file.mimeType;

      if (mimeType.startsWith("text/")) {
        const contentResponse = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
          {
            headers: {
              Authorization: `Bearer ${token.token}`,
            },
            responseType: "text",
          }
        );
        setSelectedFileContent({ type: "text", content: contentResponse.data });
      } else if (
        mimeType.startsWith("image/png") ||
        mimeType.startsWith("image/jpeg")
      ) {
        const contentResponse = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
          {
            headers: {
              Authorization: `Bearer ${token.token}`,
            },
            responseType: "blob",
          }
        );
        const imageUrl = URL.createObjectURL(contentResponse.data);
        setSelectedFileContent({ type: "image", content: imageUrl });
        setIsImageModalVisible(true);
      } else {
        setSelectedFileContent({
          type: "binary",
          content: `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content?access_token=${token.token}`,
        });
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handlePathClick = (index) => {
    const newPath = navigationPath.slice(0, index + 1);
    setSelectedFileContent(null);
    setNavigationPath(newPath);
    fetchSharePointDocuments(token.token, newPath[newPath.length - 1].id);
  };

  const handleShare = async (url) => {
    try {
      await Sharing.shareAsync(url);
    } catch (error) {
      console.error("Error sharing file:", error);
    }
  };

  const currentUser = "Abhishek Batchu";
  const fileData = [
    {
      likesUsersList: ["Sai", "Abhishek Batchu", "John"],
      fileName: "Coats.png",
      likesCount: 3,
      fileUrl:
        "https://sykmss.sharepoint.com/sites/Abhishek/Shared%20Documents/Cooper_Standard/Test/Coats.png",
    },
    {
      likesUsersList: ["Abhishek Batchu", "Kartik", "Srivani", "Vineetha"],
      fileName: "21-12-34.mp4",
      likesCount: 4,
      fileUrl:
        "https://sykmss.sharepoint.com/sites/Abhishek/Shared%20Documents/21-12-34.mp4",
    },
    {
      likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
      fileName: "test.png",
      likesCount: 6,
      fileUrl:
        "https://sykmss.sharepoint.com/sites/Abhishek/Shared%20Documents/test1/test.png",
    },
  ];



  const initializeLikes = () => {
    const initialLikes = {};
    fileData.forEach((file) => {
      initialLikes[file.fileName] = file.likesUsersList.includes(currentUser);
    });
    return initialLikes;
  };

  const [likes, setLikes] = React.useState(initializeLikes());
  const [document, setDocument] = React.useState(fileData);

  const toggleLike = (fileName) => {
    setDocument((prevDocuments) =>
      prevDocuments.map((file) =>
        file.fileName === fileName
          ? {
              ...file,
              likesCount: likes[fileName]
                ? file.likesCount - 1
                : file.likesCount + 1,
              likesUsersList: likes[fileName]
                ? file.likesUsersList.filter((user) => user !== currentUser)
                : [...file.likesUsersList, currentUser],
            }
          : file
      )
    );
    setLikes((prevLikes) => ({
      ...prevLikes,
      [fileName]: !prevLikes[fileName],
    }));
  };
  React.useEffect(() => {
    if (token.token) {
      fetchSharePointDocuments(token.token);
    }
  }, [token.token]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.linksContainer}>
        {token && (
          <>
            <Breadcrumb path={navigationPath} onPathClick={handlePathClick} />
         
            <FlatList
              data={documents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleItemClick(item)}>
                  <View style={styles.documentContainer}>
                    <FontAwesomeIcon
                      icon={item.folder ? faFolder : faFile}
                      size={24}
                      color="gray"
                    />
                    <View style={styles.textContainer}>
                      <Text style={styles.fileName}>{item.name}</Text>
                     
                    </View>
                   
                    {item.file && (
                      <View style={styles.actionContainer}>
                        <TouchableOpacity
                          onPress={() => handleShare(item.webUrl)}
                          style={styles.icon}
                        >
                          <FontAwesomeIcon
                            icon={faShare}
                            size={20}
                            color="gray"
                          />
                        </TouchableOpacity>
                        <View style={styles.likeContainer}>
                          <TouchableOpacity
                            onPress={() => toggleLike(item.name)}
                          >
                            <FontAwesomeIcon
                              icon={faThumbsUp}
                              size={20}
                              color={likes[item.name] ? "#007BFF" : "gray"}
                            />
                          </TouchableOpacity>
                          <Text style={styles.likesCount}>
                            {document.find((doc) => doc.fileName === item.name)
                              ?.likesCount || 0}
                          </Text>
                        </View>
                        
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
            {selectedFileContent && selectedFileContent.type === "text" && (
              <ScrollView style={styles.fileContentContainer}>
                <Text style={styles.fileContent}>
                  {selectedFileContent.content}
                </Text>
              </ScrollView>
            )}
            {selectedFileContent && selectedFileContent.type === "image" && (
              <Modal visible={isImageModalVisible} transparent={true}>
                <View style={styles.modalContainer}>
                  <Image
                    source={{ uri: selectedFileContent.content }}
                    style={styles.imageContentModal}
                  />
                  <Button
                    title="Close"
                    onPress={() => setIsImageModalVisible(false)}
                  />
                </View>
              </Modal>
            )}
            {selectedFileContent && selectedFileContent.type === "binary" && (
              <Button
                title="Download File"
                onPress={() =>
                  WebBrowser.openBrowserAsync(selectedFileContent.content)
                }
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  linksContainer: {
    flex: 1,
    padding: 20,
  },
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  icon: {
    marginLeft: 10,
  },
  fileContentContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  fileContent: {
    fontSize: 16,
  },
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  folderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "Black",
  },
  separator: {
    marginHorizontal: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  imageContentModal: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    marginBottom: 20,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
});


