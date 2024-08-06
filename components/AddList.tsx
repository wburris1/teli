import Colors from "@/constants/Colors";
import Dimensions from "@/constants/Dimensions";
import Values from "@/constants/Values";
import { useTab } from "@/contexts/listContext"
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useColorScheme } from "react-native";
import { ListModalScreen } from "./ListModal";
import { useData } from "@/contexts/dataContext";
import { CreateListDB } from "@/data/addList";
import { UserItem } from "@/constants/ImportTypes";
import { useLoading } from "@/contexts/loading";
import Toast from "react-native-toast-message";

const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

export const AddList = () => {
    const [listName, setListName] = useState("");
    const [listDescription, setListDescription] = useState("");
    const { activeTab, addModalVisible, setAddModalVisible } = useTab();
    const [listTypeID, setListTypeID] = useState(activeTab == 0 ? Values.movieListsID : Values.tvListsID);
    const [entriesModalVisible, setEntriesModalVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState<UserItem[]>([]);
    const [isRanked, setRanked] = useState(true);
    const createListFunc = CreateListDB();
    const colorScheme = useColorScheme();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setListTypeID(activeTab == 0 ? Values.movieListsID : Values.tvListsID);
    }, [activeTab])

    const handleSelectedItemsChange = (items: UserItem[]) => {
        setSelectedItems(items);
        setEntriesModalVisible(false);
    };

    const handleListCreate = () => {
      if (listName == "") {
        Alert.alert("Please enter a name for the list");
      }
      else {
        setLoading(true);
        const list: List = {
            list_id: "",
            name: listName,
            description: listDescription,
            is_custom: true,
            is_ranked: isRanked,
            top_poster_path: "",
            second_poster_path: "",
            bottom_poster_path: "",
        }
        createListFunc(list, listTypeID, selectedItems).then(complete => {
            if (complete == true) {
                setLoading(false);
                handleClose();
            }
        })
      }
    }

    const handleClose = () => {
      if (listName) {
        Toast.show({
          type: 'info',
          text1: "Created New List",
          text2: "You created list '" + listName + "'",
          position: "bottom",
          visibilityTime: 3000,
          bottomOffset: 100
        });
      }
        setAddModalVisible(false);
        setSelectedItems([]);
        setListDescription("");
        setListName("");
        setListTypeID(activeTab == 0 ? Values.movieListsID : Values.tvListsID);
        setRanked(true);
    }

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={addModalVisible}
            onRequestClose={() => setAddModalVisible(false)}
        >
            <BlurView intensity={100} style={styles.blurContainer}>
                {loading && (
                    <View style={styles.spinnerOverlay}>
                        <ActivityIndicator size="large" />
                    </View>
                )}
                <KeyboardAvoidingView behavior="padding">
                    <View style={[styles.modalView, { backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
                        <View style={styles.headerContainer}>
                            <Text style={[styles.headerText, { color: Colors[colorScheme ?? 'light'].text}]}>Create List</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <Ionicons
                                    name="close"
                                    size={35}
                                    color={Colors[colorScheme ?? 'light'].text}
                                />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            autoCapitalize="sentences"
                            placeholder="List name..."
                            value={listName}
                            onChangeText={setListName}
                            style={[styles.inputNameField,
                                { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text,
                                    color: Colors[colorScheme ?? 'light'].text,
                                 }]}
                        />
                        <TextInput
                            multiline
                            autoCapitalize="sentences"
                            placeholder="List description (optional)..."
                            value={listDescription}
                            onChangeText={setListDescription}
                            style={[styles.inputDescField,
                                { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text,
                                    color: Colors[colorScheme ?? 'light'].text,
                                 }]
                            }
                        />
                        <View style={styles.switchContainer}>
                            <TouchableOpacity
                                style={[styles.button, listTypeID === Values.movieListsID ? {backgroundColor: Colors[colorScheme ?? 'light'].text} :
                                    { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text }]}
                                onPress={() => {
                                    if (listTypeID != Values.movieListsID) {
                                        setSelectedItems([]);
                                    }
                                    setListTypeID(Values.movieListsID);
                                }}
                            >
                                <Text style={listTypeID === Values.movieListsID ? { color: Colors[colorScheme ?? 'light'].background } : { color: Colors[colorScheme ?? 'light'].text }}>
                                    Movies
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, listTypeID == Values.tvListsID ? {backgroundColor: Colors[colorScheme ?? 'light'].text} :
                                    { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text }]}
                                onPress={() => {
                                    if (listTypeID != Values.tvListsID) {
                                        setSelectedItems([]);
                                    }
                                    setListTypeID(Values.tvListsID);
                                }}
                            >
                                <Text style={listTypeID === Values.tvListsID ? { color: Colors[colorScheme ?? 'light'].background } : { color: Colors[colorScheme ?? 'light'].text }}>
                                    Shows
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 10,}}>
                            <Text style={{fontSize: 16, fontWeight: 'bold'}}>{isRanked ? "Watched" : "Unwatched"}</Text>
                            <Switch
                                trackColor={{ false: Colors[colorScheme ?? 'light'].text, true: "#32CD32" }}
                                thumbColor={Colors[colorScheme ?? 'light'].background}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => setRanked(prev => !prev)}
                                value={isRanked}
                            />
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingRight: 10}}>
                            {isRanked ? (
                                <TouchableOpacity onPress={() => setEntriesModalVisible(true)} style={{paddingHorizontal: 10}}>
                                    <Text style={styles.addText}>Add entries...</Text>
                                </TouchableOpacity>) : (
                                <View>
                                </View>
                            )}
                            {selectedItems.length > 0 &&
                                <Text style={[styles.text, { color: Colors[colorScheme ?? 'light'].text }]}>{selectedItems.length}{selectedItems.length > 1 ? " entries added" : " entry added"}</Text>
                            }
                        </View>
                        <TouchableOpacity onPress={handleListCreate}>
                            <Ionicons
                                name="checkmark-circle"
                                size={50}
                                color={Colors[colorScheme ?? 'light'].text}
                            />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </BlurView>
            {entriesModalVisible && (
                <ListModalScreen
                    listTypeID={listTypeID}
                    visible={entriesModalVisible}
                    containedItems={[]}
                    onClose={() => setEntriesModalVisible(false)}
                    onSelectedItemsChange={handleSelectedItemsChange}
                />
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    blurContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        borderWidth: 0,
        borderRadius: 25,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        margin: 3,
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
    },
    text: {
        fontSize: 16,
    },
    addText: {
        fontSize: 16,
        color: 'gray',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 10,
    },
    modalView: {
        borderRadius: 20,
        padding: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 10,
        width: screenWidth * 4/5,
    },
    inputNameField: {
        marginVertical: 5,
        height: 50,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 4,
        padding: 10,
        width: '90%',
    },
    inputDescField: {
        marginVertical: 5,
        height: 100,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 4,
        padding: 10,
        width: '90%',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: 10,
    },
    spinnerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 1,
      },
});