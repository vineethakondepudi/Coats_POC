import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';

import { Button, Text, SafeAreaView, View, StyleSheet, Image, FlatList, TouchableOpacity, ScrollView } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function DocumentScreen({route}) {
    const [token, setToken] = React.useState(route.params);
    const [scopes, setScopes] = React.useState([]);
    const [documents, setDocuments] = React.useState([]);
    const [selectedFileContent, setSelectedFileContent] = React.useState(null);
    const [currentFolderId, setCurrentFolderId] = React.useState('root');

  console.log(token.token,"16");

    // Fetching the Folders from Share Point using Graph Start
    const fetchSharePointDocuments = async (accessToken, folderId = 'root') => {
        //console.log(, 27);
        try {
            const siteId = 'sykmss.sharepoint.com,3637a2f5-7c7c-4cda-a314-cddae554f74a,fd9fef4e-547a-408d-b262-4da685ff8da0';
            const libraryId = 'b!9aI3Nnx82kyjFM3a5VT3Sk7vn_16VI1AsmJNpoX_jaBNjF7vpNDUT4c2XpMwEwb0';

            const response = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${folderId}/children`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log(response.data.value, 38);
            setDocuments(response.data.value);
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    };
    // Fetching the Folders from Share Point using Graph End

    const handleItemClick = async (item) => {
        if (item.folder) {
            // It's a folder, fetch its contents
            setCurrentFolderId(item.id);
            fetchSharePointDocuments(token.token, item.id);
        } else {
            // It's a file, fetch its content
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

            const mimeType = itemResponse.data.file.mimeType;

            if (mimeType.startsWith('text/')) {
                const contentResponse = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`, {
                    headers: {
                        Authorization: `Bearer ${token.token}`,
                    },
                    responseType: 'text',
                });
                setSelectedFileContent({ type: 'text', content: contentResponse.data });
            } else if (mimeType.startsWith('image/')) {
                const contentResponse = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content`, {
                    headers: {
                        Authorization: `Bearer ${token.token}`,
                    },
                    responseType: 'blob',
                });
                const imageUrl = URL.createObjectURL(contentResponse.data);
                setSelectedFileContent({ type: 'image', content: imageUrl });
            } else {
                setSelectedFileContent({ type: 'binary', content: `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${libraryId}/items/${itemId}/content?access_token=${token}` });
            }
        } catch (error) {
            console.error("Error fetching file content:", error);
        }
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
                    <View>
                        <FlatList
                            data={documents}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleItemClick(item)}>
                                    <View style={styles.documentContainer}>
                                        <Image source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALoAAACUCAMAAAATdsOFAAAAn1BMVEX/yij/////oAD/ySD/1VX/xxP/34X/4JX//ff/yCb/shP/nQD/tDn/y03/mwD/x3L/lwD/zYP/8ND/+OT//PH/0UT/pAD/9uf/1GX/zTT/+OD/2W//1V//7Lr/23z/5J3/58r/05T/wmT/3q//w3j/6MP/t1n/79b/uVL/rSj/zYz/oiL/16D/qg7/z2v/78T/vx7/6Kj/14D/yF7/zVnX+w7SAAACoUlEQVR4nO3di3KaYBCG4cU/q0TrCRAFRWqSxp4wmvb+r62AGrFJZyoCnzuz7w34DLOA44z7k1XInn5ePXy6sJVnYaIC/PEpGY0Gvcsa+GOQ/UT/8twb9FqX1/PHNpQ+fRoNSrhze2s8BdLXX0cl4fvrjpiZPd39VvaSH+2Amcnp6+vkoJnJ6N7DlXLMzGT071fLIdc9pa+vuEMLdr9pe0ofVkJvfmbIcn5UIm9+ZshalXmFfmxvdmbIe66M3vDznaaVwVsNzwxV83x5szc4M/RYKb3J5wz9rJaez4xdR+/pw7NXqZ8k3avbdGoofnEc+590P+lu7yvIUB0FQb8TuR/S/e62lo+sLsN8F7vv6cn2Hk37j5gW0d/0rgR4lqGdfUa/9VkpZMzcLdC7aM8lGV56b3RR8jTTsQ/0RMqcHzMcHeiCBv2QCbycLm1csvg1o7ekjUteEKb0BK0oFe9SusR5Sekzm4bybtI8dmnDaES5OKRNPV9Ra48j+iWV/kq/hdLNnPpS6X2lN5/SESkdkdIRKR2R0hEpHZHSEcmmz6TSZ9SW+mNGW+nNp3RESkekdERKR6R0REpHpHRESkekdERKR6R0REpHpHRESkekdERKR6R0REpHpHRESkekdERKR6R0REpHpHRESkekdERKR6R0REpHpHRESkekdERKR6R0RLLpO6n0HUVS6S+0lkpfkyv1n48ueQuRdp7bZMUiJ4bjbJ12gGaUKXCyJeYSn+zczvevhxLp4X5hf0ecPZ30wzEJc2F2nnsHuhVORNl5ElrW25Egkuw8OSy73a/rDRdi7DwLrSLdctss4q1quH3cTX86dMhZmFvXp8CFc1qnfVoKbkfLgJnNjZbSgmVUWMFeoGcHbDnx8u5GW8bO9Gx3/B+cF0Yb0eASJgAAAABJRU5ErkJggg==' }} style={styles.image} />
                                        <View style={styles.textContainer}>
                                            <Text style={styles.fileName}>{item.name}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                        {selectedFileContent && selectedFileContent.type === 'text' && (
                            <ScrollView style={styles.fileContentContainer}>
                                <Text style={styles.fileContent}>{selectedFileContent.content}</Text>
                            </ScrollView>
                        )}
                        {selectedFileContent && selectedFileContent.type === 'image' && (
                            <Image source={{ uri: selectedFileContent.content }} style={styles.imageContent} />
                        )}
                        {selectedFileContent && selectedFileContent.type === 'binary' && (
                            <Button
                                title="Download File"
                                onPress={() => WebBrowser.openBrowserAsync(selectedFileContent.content)}
                            />
                        )}
                    </View>
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
    image: {
        width: 50,
        height: 50,
        borderRadius: 5,
    },
});