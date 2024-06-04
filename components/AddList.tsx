import Colors from "@/constants/Colors";
import Dimensions from "@/constants/Dimensions";
import Values from "@/constants/Values";
import { useTab } from "@/contexts/listContext"
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from "react-native";
import { ListModalScreen } from "./ListModal";
import { useData } from "@/contexts/dataContext";
import { CreateListDB } from "@/data/userData";

const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

export const AddList = () => {
    const [listName, setListName] = useState("");
    const [listDescription, setListDescription] = useState("");
    const { activeTab, addModalVisible, setAddModalVisible } = useTab();
    const [listTypeID, setListTypeID] = useState(activeTab == 0 ? Values.movieListsID : Values.tvListsID);
    const [entriesModalVisible, setEntriesModalVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState<UserItem[]>([]);
    const createListFunc = CreateListDB();
    const colorScheme = useColorScheme();

    useEffect(() => {
        setListTypeID(activeTab == 0 ? Values.movieListsID : Values.tvListsID);
    }, [activeTab])

    const handleSelectedItemsChange = (items: UserItem[]) => {
        setSelectedItems(items);
        setEntriesModalVisible(false);
    };

    const handleListCreate = () => {
        const list: List = {
            list_id: listName,
            description: listDescription,
            is_custom: true,
            top_poster_path: "",
            second_poster_path: "",
            bottom_poster_path: "",
        }
        createListFunc(list, listTypeID, selectedItems).then(complete => {
            if (complete == true) {
                handleClose();
            }
        })
    }

    const handleClose = () => {
        setAddModalVisible(false);
        setSelectedItems([]);
        setListDescription("");
        setListName("");
        setListTypeID(activeTab == 0 ? Values.movieListsID : Values.tvListsID);
    }

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={addModalVisible}
            onRequestClose={() => setAddModalVisible(false)}
        >
            <BlurView intensity={100} style={styles.blurContainer}>
                <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                    <Ionicons
                        name="close-circle"
                        size={45}
                        color={Colors[colorScheme ?? 'light'].text}
                    />
                </TouchableOpacity>
                <KeyboardAvoidingView behavior="padding">
                    <View style={styles.modalView}>
                        <Text style={styles.headerText}>Create List</Text>
                        <TextInput
                            autoCapitalize="sentences"
                            placeholder="List name..."
                            value={listName}
                            onChangeText={setListName}
                            style={styles.inputNameField}
                        />
                        <TextInput
                            multiline
                            autoCapitalize="sentences"
                            placeholder="List description (optional)..."
                            value={listDescription}
                            onChangeText={setListDescription}
                            style={styles.inputDescField}
                        />
                        <View style={styles.switchContainer}>
                            <TouchableOpacity
                                style={[styles.button, listTypeID === Values.movieListsID && styles.selectedButton]}
                                onPress={() => {
                                    if (listTypeID != Values.movieListsID) {
                                        setSelectedItems([]);
                                    }
                                    setListTypeID(Values.movieListsID);
                                }}
                            >
                                <Text style={[styles.buttonText, listTypeID === Values.movieListsID && styles.selectedButtonText]}>
                                    Movies
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, listTypeID == Values.tvListsID && styles.selectedButton]}
                                onPress={() => {
                                    if (listTypeID != Values.tvListsID) {
                                        setSelectedItems([]);
                                    }
                                    setListTypeID(Values.tvListsID);
                                }}
                            >
                                <Text style={[styles.buttonText, listTypeID === Values.tvListsID && styles.selectedButtonText]}>
                                    Shows
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingRight: 10}}>
                            <TouchableOpacity onPress={() => setEntriesModalVisible(true)} style={{paddingHorizontal: 10}}>
                                <Text style={styles.addText}>Add entries...</Text>
                            </TouchableOpacity>
                            {selectedItems.length > 0 &&
                                <Text style={styles.text}>{selectedItems.length}{selectedItems.length > 1 ? " entries added" : " entry added"}</Text>
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
        backgroundColor: 'white',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
    },
    selectedButton: {
        backgroundColor: 'black',
    },
    buttonText: {
        color: '#000',
    },
    selectedButtonText: {
        color: '#fff',
    },
    text: {
        fontSize: 16,
    },
    addText: {
        fontSize: 16,
        color: 'gray',
    },
    headerText: {
        fontSize: 16,
        fontWeight: 'bold',
        padding: 10,
    },
    cancelButton: {
        position: 'absolute',
        right: 10,
        top: 55,
    },
    modalView: {
        backgroundColor: 'white',
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
        backgroundColor: '#fff',
        width: '90%',
    },
    inputDescField: {
        marginVertical: 5,
        height: 100,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff',
        width: '90%',
    },
});