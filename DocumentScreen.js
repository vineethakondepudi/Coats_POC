
import React from 'react';
import { StyleSheet, Text, SafeAreaView, View, Image, FlatList, TouchableOpacity, ScrollView, Button, Modal } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFolder, faFile } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const Breadcrumb = ({ path, onPathClick }) => {
  return (
    <View style={styles.breadcrumbContainer}>
      {path.map((folder, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          <TouchableOpacity onPress={() => onPathClick(index)}>
            <Text style={styles.folderName}>{folder.name}</Text>
          </TouchableOpacity>
          {index < path.length - 1 && <Text style={styles.separator}> {'>'} </Text>}
        </View>
      ))}
    </View>
  );
};

export default function Document({ route }) {
  const [token, setToken] = React.useState(route.params);
  const [documents, setDocuments] = React.useState([]);
  const [selectedFileContent, setSelectedFileContent] = React.useState(null);
  const [navigationPath, setNavigationPath] = React.useState([{ id: 'root', name: 'Documents' }]);
  const [isImageModalVisible, setIsImageModalVisible] = React.useState(false);

  const fetchSharePointDocuments = async (accessToken, folderId = 'root') => {
    try {
      const siteId = 'sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0';
      const libraryId = 'b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0';

      const response = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${folderId}/children`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
       console.log(response.data.value,58)
      setDocuments(response.data.value);
    } catch (error) {
    //   console.error("Error fetching documents:", error);
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
      const siteId = 'sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0';
      const libraryId = 'b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0';

      const itemResponse = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      });
      console.log(itemResponse,85)
      const mimeType = itemResponse.data.file.mimeType;

      if (mimeType.startsWith('text/')) {
        const contentResponse = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`, {
          headers: {
            Authorization: `Bearer ${token.token}`,
          },
          responseType: 'text',
        });
      
        setSelectedFileContent({ type: 'text', content: contentResponse.data });
      } else if (mimeType.startsWith('image/png') || mimeType.startsWith('image/jpeg')) {
        const contentResponse = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`, {
        
          headers: {
            Authorization: `Bearer ${token.token}`,
          },
          responseType: 'blob',
        });
        console.log(contentResponse,104)
        const imageUrl = URL.createObjectURL(contentResponse.data);
        setSelectedFileContent({ type: 'image', content: imageUrl });
        setIsImageModalVisible(true);
      } else {
        setSelectedFileContent({ type: 'binary', content: `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content?access_token=${token.token}` });
      }
    } catch (error) {
    //   console.error("Error fetching file content:", error);
    }
  };

  const handlePathClick = (index) => {
    const newPath = navigationPath.slice(0, index + 1);
    setSelectedFileContent(null);
    setNavigationPath(newPath);
    fetchSharePointDocuments(token.token, newPath[newPath.length - 1].id);
  };

  React.useEffect(() => {
    if (token.token) {
      fetchSharePointDocuments(token.token);
    }
    }, [token.token]);
// console.log(navigationPath,"109");

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
                    <FontAwesomeIcon icon={item.folder ? faFolder : faFile} size={24} style={styles.icon} />
                    <View style={styles.textContainer}>
                      <Text style={styles.fileName}>{item.name}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {selectedFileContent && selectedFileContent.type === 'text' && (
          <ScrollView style={styles.fileContentContainer}>
            <Text style={styles.fileContent}>{selectedFileContent.content}</Text>
          </ScrollView>
        )}
        {selectedFileContent && selectedFileContent.type === 'image' && (
          <Modal
            visible={isImageModalVisible}
            transparent={true}
            onRequestClose={() => setIsImageModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <Image source={{ uri: selectedFileContent.content }} style={styles.imageContentModal} />
              <Button title="Close" onPress={() => setIsImageModalVisible(false)} />
            </View>
          </Modal>
        )}
        {selectedFileContent && selectedFileContent.type === 'binary' && (
          <Button
            title="Download File"
            onPress={() => WebBrowser.openBrowserAsync(selectedFileContent.content)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  linksContainer: {
    padding: 20,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  textContainer: {
    marginLeft: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileContentContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  fileContent: {
    fontSize: 14,
  },
  imageContent: {
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  imageContentModal: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  icon: {
    marginRight: 10,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 5,
    borderRadius: 5,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderName: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold'
  },
  separator: {
    fontSize: 16,
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});


