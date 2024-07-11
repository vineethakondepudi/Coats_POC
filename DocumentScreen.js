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
  ImageBackground,
  Platform
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
import { Buffer } from "buffer";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import {Config} from './config'

import * as XLSX from "xlsx";


WebBrowser.maybeCompleteAuthSession();

const Breadcrumb = ({ path, onPathClick }) => (
  <View style={styles.breadcrumbContainer}>
    {path.map((folder, index) => (
      <View key={index} style={styles.breadcrumbItem}>
        <TouchableOpacity onPress={() => onPathClick(index)}>
          <Text style={styles.folderName}>{folder.name}</Text>
        </TouchableOpacity>
        {index < path.length - 1 && <Text style={styles.separator}> {">"} </Text>}
      </View>
    ))}
  </View>
);

const SkeletonItem = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonText} />
  </View>
);

export default function DocumentScreen({ route }) {
  const [token, setToken] = React.useState(route.params);
  const [documents, setDocuments] = React.useState([]);
  const [webPartContent, setWebPartContent] = React.useState([]);
  const [selectedFileContent, setSelectedFileContent] = React.useState(null);
  const [navigationPath, setNavigationPath] = React.useState([
    { id: "root", name: "RECENT DOCUMENTS" },
  ]);
  const [isImageModalVisible, setIsImageModalVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const fetchSharePointDocuments = async (accessToken, folderId = "root") => {
    try {
      const siteId = Config.siteId
      const libraryId = Config.libraryId

      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${folderId}/children`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setDocuments(response.data.value);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setLoading(false);
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
      if (mimeType === "application/pdf") {
        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
          {
            headers: {
              Authorization: `Bearer ${token.token}`,
            },
            responseType: "arraybuffer",
          }
        );

        const buffer = Buffer.from(response.data, "binary");
        const base64 = buffer.toString("base64");
        const dataUri = `data:application/pdf;base64,${base64}`;

        setSelectedFileContent({
          type: "pdf",
          content: dataUri,
          base64: base64,
          name: itemResponse.data.name,
        });
        setIsImageModalVisible(true);
      }
      
      else if (
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) 
      {
        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
          {
            headers: {
              Authorization: `Bearer ${token.token}`,
            },
            responseType: "arraybuffer",
          }
        );

        const buffer = Buffer.from(response.data, "binary");
        const base64 = buffer.toString("base64");

        const binaryStr = Buffer.from(base64, "base64").toString("binary");
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const fileData = bytes.buffer;

        const workbook = XLSX.read(fileData, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_html(worksheet);
console.log(jsonData,154)
        setSelectedFileContent({
          type: "excel",
          content: jsonData,
          base64: base64,
          name: itemResponse.data.name,
        });
        setIsImageModalVisible(true);
      }
      else if (
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
      fileName: "AzureLogo.png",
      likesCount: 3,
      fileUrl: "",
    },
    {
      likesUsersList: ["Abhishek Batchu", "Kartik", "Srivani", "Vineetha"],
      fileName: "CoatsHome.PNG",
      likesCount: 4,
      fileUrl: "",
    },
    {
      likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
      fileName: "CoatsIcon.png",
      likesCount: 6,
      fileUrl: "",
    },
    {
      likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
      fileName: "FacilityPolicy.pdf",
      likesCount: 6,
      fileUrl: "",
    },
    {
      likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
      fileName: "OfficeImage.PNG",
      likesCount: 1,
      fileUrl: "",
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
  const [documentData, setDocument] = React.useState(fileData);

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

  const image = {
    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKyUA5Gu8aqtrI6eZkQhmo-KT93kIryUQhsQ&s",
  };


  const handleDownload = async () => {
    try {
      if (selectedFileContent.type === "pdf" || selectedFileContent.type === "excel") {
        if (Platform.OS === "web") {
          // For web platform, initiate download using an <a> tag
          if (selectedFileContent.type === "pdf") {
            const link = document.createElement("a");
            link.href = selectedFileContent.content;
            link.setAttribute("download", selectedFileContent.name);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (selectedFileContent.type === "excel") {
            const base64Data = selectedFileContent.base64;
            const binaryData = Buffer.from(base64Data, 'base64').toString('binary');
            const fileName = selectedFileContent.name;
    
            const link = document.createElement('a');
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
            link.download = fileName;
            link.click();
          }
        } else {
          // For mobile platform (Expo), use FileSystem to save and Sharing to share the file
          const fileUri = `${FileSystem.documentDirectory}${selectedFileContent.name}`;
    
          if (selectedFileContent.type === "pdf") {
            const base64Data = selectedFileContent.base64.split(",")[1]; // Remove the data URI prefix
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
    
            await Sharing.shareAsync(fileUri);
          } else if (selectedFileContent.type === "excel") {
            const base64Data = selectedFileContent.base64;
            const binaryData = Buffer.from(base64Data, 'base64').toString('binary');
    
            await FileSystem.writeAsStringAsync(fileUri, binaryData, {
              encoding: FileSystem.EncodingType.Base64,
            });
    
            await FileSystem.downloadAsync(
              fileUri,
              FileSystem.documentDirectory + selectedFileContent.name
            );
    
            await FileSystem.deleteAsync(fileUri);
          }
        }
      } else {
        alert("This file type is not supported for download.");
      }
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

 
  const fetchWebPartContent = async (accessToken) => {
    const siteId =
        "sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0";
    try {
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/pages/ff95381a-b2c5-4101-a8cb-1b4a27db918b/microsoft.graph.sitepage/webparts`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data.value;
    } catch (error) {
      console.error("Error fetching web part content:", error);
      return [];
    }
  };
  

  React.useEffect(() => {
    const initialize = async () => {
      if (token && token.token) {
        const webPartData = await fetchWebPartContent(token.token);
        setWebPartContent(webPartData);
        await fetchSharePointDocuments(token.token);
      }
    };

    initialize();
  }, [token]);

  const renderWebPartContent = () => {
    if (webPartContent.length > 0) {
      const textContent = webPartContent
        .filter((webPart) => webPart["@odata.type"] === "#microsoft.graph.textWebPart") // Filter for text web parts only
        .map((webPart) => webPart.innerHtml) // Extract innerHtml from text web parts
        .join("")
        .replace(/<[^>]+>/g, ""); // Remove all HTML tags
  
      return (
        <View style={styles.webPartContainer}>
          <Text style={styles.webPartContent}>{textContent}</Text>
        </View>
      );
    }
    return null;
  };



  return (
    <ImageBackground source={image} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.linksContainer}>
          {token && (
            <>
              {renderWebPartContent()} 
              <Breadcrumb path={navigationPath} onPathClick={handlePathClick} />
              {loading ? (
                <FlatList
                  data={Array(6).fill({})}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={() => <SkeletonItem />}
                />
                
              ) : (
                
                <FlatList
                  data={documents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleItemClick(item)}>
                      <View style={styles.documentContainer}>
                        <FontAwesomeIcon
                          icon={item.folder ? faFolder : faFile}
                          size={24}
                          color="#fcba03"
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
                                {documentData.find(
                                  (doc) => doc.fileName === item.name
                                )?.likesCount || 0}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
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
              {selectedFileContent && selectedFileContent.type === "pdf" && (
                <Modal visible={isImageModalVisible} transparent={true}>
                  <View style={styles.modalContainer}>
                    {Platform.OS === "web" ? (
                      <iframe
                        src={selectedFileContent.content}
                        style={styles.imageContentModal}
                        title="PDF"
                      />
                    ) : (
                      <WebView
                        source={{ uri: selectedFileContent.content }}
                        style={{ flex: 1 }}
                      />
                    )}
                     <View style={styles.buttonContainer}>
        <Button title="Download" onPress={handleDownload} />
        <Button
          title="Close"
          onPress={() => setIsImageModalVisible(false)}
        />
      </View>
                  </View>
                </Modal>
              )}
{selectedFileContent && selectedFileContent.type === "excel" && (
  <Modal visible={isImageModalVisible} transparent={true}>
  <View style={styles.modalContainer}>
    <iframe
      srcDoc={`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 14px;
                margin: 0;
                padding: 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
            </style>
          </head>
          <body>
            ${selectedFileContent.content}
          </body>
        </html>
      `}
      title="excel"
         style={styles.excelContentModal}
           
    />
    <View style={styles.buttonContainer}>
    <Button title="Download" onPress={handleDownload} />
    <Button title="Close" onPress={() => setIsImageModalVisible(false)} />
  </View>
  </View>
</Modal>
)}
            </>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  linksContainer: {
    flex: 1,
    margin: 16,
  },
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 8,
    backgroundColor: "white",
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
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  likesCount: {
    marginLeft: 5,
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
    color: "#007BFF",
  },
  separator: {
    marginHorizontal: 5,
    color: "gray",
  },
  fileContentContainer: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 5,
    marginVertical: 10,
  },
  fileContent: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageContentModal: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    marginBottom: 20,
    },
  skeletonContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#c0c0c0",
    borderRadius: 12,
  },
  skeletonText: {
    flex: 1,
    height: 20,
    backgroundColor: "#c0c0c0",
    borderRadius: 5,
    marginLeft: 10,
  },
  excelContentModal :{
    width: "80%",
    height: "80%",
    backgroundColor:"white"
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
    padding: 2,
    // backgroundColor: 'white',
  },
  webPartContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 30
  },
  webPartContent: {
    fontSize: 16,
  },
});




// import React from "react";
// import {
//   StyleSheet,
//   Text,
//   SafeAreaView,
//   View,
//   Image,
//   FlatList,
//   TouchableOpacity,
//   ScrollView,
//   Button,
//   Modal,
//   ImageBackground,
//   Platform
// } from "react-native";
// import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
// import {
//   faFolder,
//   faFile,
//   faShare,
//   faThumbsUp,
// } from "@fortawesome/free-solid-svg-icons";
// import axios from "axios";
// import * as WebBrowser from "expo-web-browser";
// import * as Sharing from "expo-sharing";
// import { Buffer } from "buffer";
// import { WebView } from "react-native-webview";
// import * as FileSystem from "expo-file-system";

// WebBrowser.maybeCompleteAuthSession();

// const Breadcrumb = ({ path, onPathClick }) => {
//   return (
//     <View style={styles.breadcrumbContainer}>
//       {path.map((folder, index) => (
//         <View key={index} style={styles.breadcrumbItem}>
//           <TouchableOpacity onPress={() => onPathClick(index)}>
//             <Text style={styles.folderName}>{folder.name}</Text>
//           </TouchableOpacity>
//           {index < path.length - 1 && (
//             <Text style={styles.separator}> {">"} </Text>
//           )}
//         </View>
//       ))}
//     </View>
//   );
// };

// export default function DocumentScreen({ route }) {
//   const [token, setToken] = React.useState(route.params);
//   const [documents, setDocuments] = React.useState([]);
//   const [selectedFileContent, setSelectedFileContent] = React.useState(null);
//   const [navigationPath, setNavigationPath] = React.useState([
//     { id: "root", name: "RECENT DOCUMENTS" },
//   ]);
//   const [isImageModalVisible, setIsImageModalVisible] = React.useState(false);

//   const fetchSharePointDocuments = async (accessToken, folderId = "root") => {
//     try {
//       const siteId =
//         "sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0";
//       const libraryId =
//         "b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0";

//       const response = await axios.get(
//         `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${folderId}/children`,
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       setDocuments(response.data.value);
//     } catch (error) {
//       console.error("Error fetching documents:", error);
//     }
//   };

//   const handleItemClick = async (item) => {
//     if (item.folder) {
//       setSelectedFileContent(null);
//       setNavigationPath([...navigationPath, { id: item.id, name: item.name }]);
//       fetchSharePointDocuments(token.token, item.id);
//     } else {
//       fetchFileContent(item.id);
//     }
//   };

//   const fetchFileContent = async (itemId) => {
//     try {
//       const siteId =
//         "sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0";
//       const libraryId =
//         "b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0";

//       const itemResponse = await axios.get(
//         `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token.token}`,
//           },
//         }
//       );

//       const mimeType = itemResponse.data.file.mimeType;
//       if (mimeType === "application/pdf") {
//         const response = await axios.get(
//           `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
//           {
//             headers: {
//               Authorization: `Bearer ${token.token}`,
//             },
//             responseType: "arraybuffer",
//           }
//         );

//         const buffer = Buffer.from(response.data, "binary");
//         const base64 = buffer.toString("base64");
//         const dataUri = `data:application/pdf;base64,${base64}`;

//         // Log base64 data to console
//         console.log("Base64 Data:", dataUri); // Log the entire base64 string


//         setSelectedFileContent({
//           type: "pdf",
//           content: dataUri,
//           base64: base64,
//           name: itemResponse.data.name,
//         });
//         setIsImageModalVisible(true); // Open modal for PDF
//         console.log(itemResponse.data.webUrl, 1895)
//         console.log(selectedFileContent, 124);
//       }
//       // if (mimeType.startsWith("text/")) {
//       //   const contentResponse = await axios.get(
//       //     `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
//       //     {
//       //       headers: {
//       //         Authorization: `Bearer ${token.token}`,
//       //       },
//       //       responseType: "text",
//       //     }
//       //   );
//       //   setSelectedFileContent({ type: "text", content: contentResponse.data });
//       // } 
//       else if (
       
//       mimeType.startsWith("image/png") ||
//         mimeType.startsWith("image/jpeg")
//       ) {
//         const contentResponse = await axios.get(
//           `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
//           {
//             headers: {
//               Authorization: `Bearer ${token.token}`,
//             },
//             responseType: "blob",
//           }
//         );
//         const imageUrl = URL.createObjectURL(contentResponse.data);
//         setSelectedFileContent({ type: "image", content: imageUrl });
//         setIsImageModalVisible(true);
//       } else {
//         setSelectedFileContent({
//           type: "binary",
//           content: `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content?access_token=${token.token}`,
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching file content:", error);
//     }
//   };

//   const handlePathClick = (index) => {
//     const newPath = navigationPath.slice(0, index + 1);
//     setSelectedFileContent(null);
//     setNavigationPath(newPath);
//     fetchSharePointDocuments(token.token, newPath[newPath.length - 1].id);
//   };

//   const handleShare = async (url) => {
//     try {
//       await Sharing.shareAsync(url);
//     } catch (error) {
//       console.error("Error sharing file:", error);
//     }
//   };

//   const currentUser = "Abhishek Batchu";
//   const fileData = [
//     {
//       likesUsersList: ["Sai", "Abhishek Batchu", "John"],
//       fileName: "AzureLogo.png",
//       likesCount: 3,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Abhishek Batchu", "Kartik", "Srivani", "Vineetha"],
//       fileName: "CoatsHome.PNG",
//       likesCount: 4,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
//       fileName: "CoatsIcon.png",
//       likesCount: 6,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
//       fileName: "FacilityPolicy.pdf",
//       likesCount: 6,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
//       fileName: "OfficeImage.PNG",
//       likesCount: 1,
//       fileUrl: "",
//     },
//   ];

//   const initializeLikes = () => {
//     const initialLikes = {};
//     fileData.forEach((file) => {
//       initialLikes[file.fileName] = file.likesUsersList.includes(currentUser);
//     });
//     return initialLikes;
//   };

//   const [likes, setLikes] = React.useState(initializeLikes());
//   const [documentData, setDocument] = React.useState(fileData);

//   const toggleLike = (fileName) => {
//     setDocument((prevDocuments) =>
//       prevDocuments.map((file) =>
//         file.fileName === fileName
//           ? {
//               ...file,
//               likesCount: likes[fileName]
//                 ? file.likesCount - 1
//                 : file.likesCount + 1,
//               likesUsersList: likes[fileName]
//                 ? file.likesUsersList.filter((user) => user !== currentUser)
//                 : [...file.likesUsersList, currentUser],
//             }
//           : file
//       )
//     );
//     setLikes((prevLikes) => ({
//       ...prevLikes,
//       [fileName]: !prevLikes[fileName],
//     }));
//   };

//   // Set the background image
//   const image = {
//     uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKyUA5Gu8aqtrI6eZkQhmo-KT93kIryUQhsQ&s",
//   };

//   const handleDownload = async () => {
//     try {
//       if (selectedFileContent.type === "pdf" || selectedFileContent.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ) {
//         if (Platform.OS === "web") {
//           // For web, open a new window to download the file
//           const link = document.createElement("a");
//           link.href = selectedFileContent.content;
//           link.setAttribute("download", selectedFileContent.name);
//           console.log(selectedFileContent.content, 1949)
//           document.body.appendChild(link);
//           link.click();
//           document.body.removeChild(link);
//         } else {
//           // For mobile (Expo), use Expo Sharing to download the file
//           const fileUri = `${FileSystem.documentDirectory}${selectedFileContent.name}`;

//           await FileSystem.writeAsStringAsync(fileUri, selectedFileContent.base64, {
//             encoding: FileSystem.EncodingType.Base64,
//           });

//           await Sharing.shareAsync(fileUri);
//         }
//       } else {
//         alert("This file type is not supported for download.");
//       }
//     } catch (error) {
//       console.error("Error downloading the file:", error);
//     }
//   };

//   React.useEffect(() => {
//     if (token.token) {
//       fetchSharePointDocuments(token.token);
//     }
//   }, [token.token]);

//   return (
//     <ImageBackground source={image} style={styles.backgroundImage}>
//       <SafeAreaView style={styles.container}>
//         <View style={styles.linksContainer}>
//           {token && (
//             <>
//               <Breadcrumb path={navigationPath} onPathClick={handlePathClick} />

//               <FlatList
//                 data={documents}
//                 keyExtractor={(item) => item.id}
//                 renderItem={({ item }) => (
//                   <TouchableOpacity onPress={() => handleItemClick(item)}>
//                     <View style={styles.documentContainer}>
//                       <FontAwesomeIcon
//                         icon={item.folder ? faFolder : faFile}
//                         size={24}
//                         color="#fcba03"
//                       />
//                       <View style={styles.textContainer}>
//                         <Text style={styles.fileName}>{item.name}</Text>
//                       </View>

//                       {item.file && (
//                         <View style={styles.actionContainer}>
//                           <TouchableOpacity
//                             onPress={() => handleShare(item.webUrl)}
//                             style={styles.icon}
//                           >
//                             <FontAwesomeIcon
//                               icon={faShare}
//                               size={20}
//                               color="gray"
//                             />
//                           </TouchableOpacity>
//                           <View style={styles.likeContainer}>
//                             <TouchableOpacity
//                               onPress={() => toggleLike(item.name)}
//                             >
//                               <FontAwesomeIcon
//                                 icon={faThumbsUp}
//                                 size={20}
//                                 color={likes[item.name] ? "#007BFF" : "gray"}
//                               />
//                             </TouchableOpacity>
//                             <Text style={styles.likesCount}>
//                               {documentData.find(
//                                 (doc) => doc.fileName === item.name
//                               )?.likesCount || 0}
//                             </Text>
//                           </View>
//                         </View>
//                       )}
//                     </View>
//                   </TouchableOpacity>
//                 )}
//               />
//               {selectedFileContent && selectedFileContent.type === "text" && (
//                 <ScrollView style={styles.fileContentContainer}>
//                   <Text style={styles.fileContent}>
//                     {selectedFileContent.content}
//                   </Text>
//                 </ScrollView>
//               )}
//               {selectedFileContent && selectedFileContent.type === "image" && (
//                 <Modal visible={isImageModalVisible} transparent={true}>
//                   <View style={styles.modalContainer}>
//                     <Image
//                       source={{ uri: selectedFileContent.content }}
//                       style={styles.imageContentModal}
//                     />
//                     <Button
//                       title="Close"
//                       onPress={() => setIsImageModalVisible(false)}
//                     />
//                   </View>
//                 </Modal>
//               )}
              
//       {selectedFileContent && selectedFileContent.type === "pdf" && (
//         <Modal visible={isImageModalVisible} transparent={true}>
//           <View style={styles.modalContainer}>
//             {Platform.OS === "web" ? (
//               <iframe
//                 src={selectedFileContent.content}
//                 style={styles.imageContentModal}

//                 title="PDF"
//               />
//             ) : (
//               <WebView
//                 source={{ uri: selectedFileContent.content }}
//                 style={{ flex: 1 }}

//               />
//             )}
//             <Button title="Download" onPress={handleDownload} />
//             <Button title="Close" onPress={() => setIsImageModalVisible(false)} />
//           </View>
//         </Modal>
//       )}            </>
//           )}
//         </View>
//       </SafeAreaView>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   backgroundImage: {
//     flex: 1,
//     resizeMode: "cover",
//   },
//   linksContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   documentContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 10,
//     padding: 10,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 5,
//   },
//   textContainer: {
//     flex: 1,
//     marginLeft: 10,
//   },
//   fileName: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   actionContainer: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//   },
//   icon: {
//     marginLeft: 10,
//   },
//   fileContentContainer: {
//     marginTop: 20,
//     padding: 10,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 5,
//   },
//   fileContent: {
//     fontSize: 16,
//   },
//   breadcrumbContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   breadcrumbItem: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   folderName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "Black",
//   },
//   separator: {
//     marginHorizontal: 5,
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.8)",
//   },
//   imageContentModal: {
//     width: "90%",
//     height: "70%",
//     resizeMode: "contain",
//     marginBottom: 20,
//   },
//   likeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginLeft: 10,
//   },
// });



// import React from "react";
// import {
//   StyleSheet,
//   Text,
//   SafeAreaView,
//   View,
//   Image,
//   FlatList,
//   TouchableOpacity,
//   ScrollView,
//   Button,
//   Modal,
//   ImageBackground,
//   ActivityIndicator,
// } from "react-native";
// import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
// import {
//   faFolder,
//   faFile,
//   faShare,
//   faThumbsUp,
// } from "@fortawesome/free-solid-svg-icons";
// import axios from "axios";
// import * as WebBrowser from "expo-web-browser";
// import * as Sharing from "expo-sharing";

// WebBrowser.maybeCompleteAuthSession();

// const Breadcrumb = ({ path, onPathClick }) => {
//   return (
//     <View style={styles.breadcrumbContainer}>
//       {path.map((folder, index) => (
//         <View key={index} style={styles.breadcrumbItem}>
//           <TouchableOpacity onPress={() => onPathClick(index)}>
//             <Text style={styles.folderName}>{folder.name}</Text>
//           </TouchableOpacity>
//           {index < path.length - 1 && (
//             <Text style={styles.separator}> {">"} </Text>
//           )}
//         </View>
//       ))}
//     </View>
//   );
// };

// const SkeletonItem = () => {
//   return (
//     <View style={styles.skeletonContainer}>
//       <View style={styles.skeletonIcon} />
//       <View style={styles.skeletonText} />
//     </View>
//   );
// };

// export default function DocumentScreen({ route }) {
//   const [token, setToken] = React.useState(route.params);
//   const [documents, setDocuments] = React.useState([]);
//   const [selectedFileContent, setSelectedFileContent] = React.useState(null);
//   const [navigationPath, setNavigationPath] = React.useState([
//     { id: "root", name: "RECENT DOCUMENTS" },
//   ]);
//   const [isImageModalVisible, setIsImageModalVisible] = React.useState(false);
//   const [loading, setLoading] = React.useState(true);

//   const fetchSharePointDocuments = async (accessToken, folderId = "root") => {
//     try {
//       const siteId =
//         "sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0";
//       const libraryId =
//         "b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0";

//       const response = await axios.get(
//         `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${folderId}/children`,
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       setDocuments(response.data.value);
//       setLoading(false); // Stop loading once documents are fetched
//     } catch (error) {
//       console.error("Error fetching documents:", error);
//       setLoading(false); // Stop loading even if there is an error
//     }
//   };

//   const handleItemClick = async (item) => {
//     if (item.folder) {
//       setSelectedFileContent(null);
//       setNavigationPath([...navigationPath, { id: item.id, name: item.name }]);
//       setLoading(true);
//       fetchSharePointDocuments(token.token, item.id);
//     } else {
//       fetchFileContent(item.id);
//     }
//   };

//   const fetchFileContent = async (itemId) => {
//     try {
//       const siteId =
//         "sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0";
//       const libraryId =
//         "b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0";

//       const itemResponse = await axios.get(
//         `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token.token}`,
//           },
//         }
//       );

//       const mimeType = itemResponse.data.file.mimeType;

//       if (mimeType.startsWith("text/")) {
//         const contentResponse = await axios.get(
//           `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
//           {
//             headers: {
//               Authorization: `Bearer ${token.token}`,
//             },
//             responseType: "text",
//           }
//         );
//         setSelectedFileContent({ type: "text", content: contentResponse.data });
//       } else if (
//         mimeType.startsWith("image/png") ||
//         mimeType.startsWith("image/jpeg")
//       ) {
//         const contentResponse = await axios.get(
//           `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`,
//           {
//             headers: {
//               Authorization: `Bearer ${token.token}`,
//             },
//             responseType: "blob",
//           }
//         );
//         const imageUrl = URL.createObjectURL(contentResponse.data);
//         setSelectedFileContent({ type: "image", content: imageUrl });
//         setIsImageModalVisible(true);
//       } else {
//         setSelectedFileContent({
//           type: "binary",
//           content: `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content?access_token=${token.token}`,
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching file content:", error);
//     }
//   };

//   const handlePathClick = (index) => {
//     const newPath = navigationPath.slice(0, index + 1);
//     setSelectedFileContent(null);
//     setNavigationPath(newPath);
//     setLoading(true);
//     fetchSharePointDocuments(token.token, newPath[newPath.length - 1].id);
//   };

//   const handleShare = async (url) => {
//     try {
//       await Sharing.shareAsync(url);
//     } catch (error) {
//       console.error("Error sharing file:", error);
//     }
//   };

//   const currentUser = "Abhishek Batchu";
//   const fileData = [
//     {
//       likesUsersList: ["Sai", "Abhishek Batchu", "John"],
//       fileName: "AzureLogo.png",
//       likesCount: 3,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Abhishek Batchu", "Kartik", "Srivani", "Vineetha"],
//       fileName: "CoatsHome.PNG",
//       likesCount: 4,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
//       fileName: "CoatsIcon.png",
//       likesCount: 6,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
//       fileName: "FacilityPolicy.pdf",
//       likesCount: 6,
//       fileUrl: "",
//     },
//     {
//       likesUsersList: ["Sai", "Kartik", "Srivani", "Abhishek Batchu"],
//       fileName: "OfficeImage.PNG",
//       likesCount: 1,
//       fileUrl: "",
//     },
//   ];

//   const initializeLikes = () => {
//     const initialLikes = {};
//     fileData.forEach((file) => {
//       initialLikes[file.fileName] = file.likesUsersList.includes(currentUser);
//     });
//     return initialLikes;
//   };

//   const [likes, setLikes] = React.useState(initializeLikes());
//   const [document, setDocument] = React.useState(fileData);

//   const toggleLike = (fileName) => {
//     setDocument((prevDocuments) =>
//       prevDocuments.map((file) =>
//         file.fileName === fileName
//           ? {
//               ...file,
//               likesCount: likes[fileName]
//                 ? file.likesCount - 1
//                 : file.likesCount + 1,
//               likesUsersList: likes[fileName]
//                 ? file.likesUsersList.filter((user) => user !== currentUser)
//                 : [...file.likesUsersList, currentUser],
//             }
//           : file
//       )
//     );
//     setLikes((prevLikes) => ({
//       ...prevLikes,
//       [fileName]: !prevLikes[fileName],
//     }));
//   };

//   // Set the background image
//   const image = {
//     uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKyUA5Gu8aqtrI6eZkQhmo-KT93kIryUQhsQ&s",
//   };

//   React.useEffect(() => {
//     if (token.token) {
//       setTimeout(() => {
//         fetchSharePointDocuments(token.token);
//       }, 5000);
//     }
//   }, [token.token]);

//   return (
//     <ImageBackground source={image} style={styles.backgroundImage}>
//       <SafeAreaView style={styles.container}>
//         <View style={styles.linksContainer}>
//           <Breadcrumb path={navigationPath} onPathClick={handlePathClick} />
//           {loading ? (
//             <FlatList
//               data={Array(6).fill({})}
//               keyExtractor={(_, index) => index.toString()}
//               renderItem={() => <SkeletonItem />}
//             />
//           ) : (
//             <>
//               <FlatList
//                 data={documents}
//                 keyExtractor={(item) => item.id}
//                 renderItem={({ item }) => (
//                   <TouchableOpacity onPress={() => handleItemClick(item)}>
//                     <View style={styles.documentContainer}>
//                       <FontAwesomeIcon
//                         icon={item.folder ? faFolder : faFile}
//                         size={24}
//                         color="#fcba03"
//                       />
//                       <View style={styles.textContainer}>
//                         <Text style={styles.fileName}>{item.name}</Text>
//                       </View>

//                       {item.file && (
//                         <View style={styles.actionContainer}>
//                           <TouchableOpacity
//                             onPress={() => handleShare(item.webUrl)}
//                             style={styles.icon}
//                           >
//                             <FontAwesomeIcon
//                               icon={faShare}
//                               size={20}
//                               color="gray"
//                             />
//                           </TouchableOpacity>
//                           <View style={styles.likeContainer}>
//                             <TouchableOpacity
//                               onPress={() => toggleLike(item.name)}
//                             >
//                               <FontAwesomeIcon
//                                 icon={faThumbsUp}
//                                 size={20}
//                                 color={likes[item.name] ? "#007BFF" : "gray"}
//                               />
//                             </TouchableOpacity>
//                             <Text style={styles.likesCount}>
//                               {document.find(
//                                 (doc) => doc.fileName === item.name
//                               )?.likesCount || 0}
//                             </Text>
//                           </View>
//                         </View>
//                       )}
//                     </View>
//                   </TouchableOpacity>
//                 )}
//               />
//               {selectedFileContent && selectedFileContent.type === "text" && (
//                 <ScrollView style={styles.fileContentContainer}>
//                   <Text style={styles.fileContent}>
//                     {selectedFileContent.content}
//                   </Text>
//                 </ScrollView>
//               )}
//               {selectedFileContent && selectedFileContent.type === "image" && (
//                 <Modal visible={isImageModalVisible} transparent={true}>
//                   <View style={styles.modalContainer}>
//                     <Image
//                       source={{ uri: selectedFileContent.content }}
//                       style={styles.imageContentModal}
//                     />
//                     <Button
//                       title="Close"
//                       onPress={() => setIsImageModalVisible(false)}
//                     />
//                   </View>
//                 </Modal>
//               )}
//               {selectedFileContent && selectedFileContent.type === "binary" && (
//                 <Button
//                   title="Download File"
//                   onPress={() =>
//                     WebBrowser.openBrowserAsync(selectedFileContent.content)
//                   }
//                 />
//               )}
//             </>
//           )}
//         </View>
//       </SafeAreaView>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   backgroundImage: {
//     flex: 1,
//     resizeMode: "cover",
//   },
//   linksContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   documentContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 10,
//     padding: 10,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 5,
//   },
//   textContainer: {
//     flex: 1,
//     marginLeft: 10,
//   },
//   fileName: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   actionContainer: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//   },
//   icon: {
//     marginLeft: 10,
//   },
//   fileContentContainer: {
//     marginTop: 20,
//     padding: 10,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 5,
//   },
//   fileContent: {
//     fontSize: 16,
//   },
//   breadcrumbContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   breadcrumbItem: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   folderName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "Black",
//   },
//   separator: {
//     marginHorizontal: 5,
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.8)",
//   },
//   imageContentModal: {
//     width: "90%",
//     height: "70%",
//     resizeMode: "contain",
//     marginBottom: 20,
//   },
//   likeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginLeft: 10,
//   },
//   skeletonContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 10,
//     padding: 10,
//     backgroundColor: "#e0e0e0",
//     borderRadius: 5,
//   },
//   skeletonIcon: {
//     width: 24,
//     height: 24,
//     backgroundColor: "#cccccc",
//     borderRadius: 12,
//   },
//   skeletonText: {
//     flex: 1,
//     height: 16,
//     backgroundColor: "#cccccc",
//     marginLeft: 10,
//     borderRadius: 5,
//   },
// });
