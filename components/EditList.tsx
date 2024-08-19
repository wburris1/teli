import { set } from "lodash";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Pressable, StyleSheet, TextInput, View, useColorScheme } from "react-native";
import { Text } from "./Themed";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Dimensions from "@/constants/Dimensions";
import { deleteList } from "@/data/deleteList";
import { useRouter } from "expo-router";
import { useState } from "react";
import { BlurView } from "expo-blur";
import { editList } from "@/data/addList";
import { ListModalScreen } from "./ListModal";
import { editListItems, editUnwatchedItems } from "@/data/editListItems";
import { List, UserItem } from "@/constants/ImportTypes";
import { useLoading } from "@/contexts/loading";
import Toast from "react-native-toast-message";
import { AddUnwatchedScreen } from "./AddUnwatched";
import { useData } from "@/contexts/dataContext";
import Values from "@/constants/Values";

type ListProps = {
  listID: string,
  listTypeID: string,
  name: string,
  description: string,
  items: UserItem[],
  visible: boolean,
  onClose: () => void;
  onEdit: (newName: string, newDescription: string) => void;
  isRanked: boolean,
}

export const EditListScreen = ({ listID, listTypeID, name, description, items, visible, onClose, onEdit, isRanked }: ListProps) => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const deleteFunc = deleteList(listID, listTypeID);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newListName, setNewListName] = useState(name);
  const [newDescription, setNewDescription] = useState(description);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const editListFunc = editList();
  const editItemsFunc = editListItems();
  const editItemsFuncUnseen = editUnwatchedItems();
  const { loading, setLoading } = useLoading();
  const { tvLists, movieLists } = useData();

  // Moved validation logic outside the render method
  const isDuplicateListName = (listName: string, currLists: List[]): boolean => {
    return currLists.some(item => item.name === listName);
  };
  const isValidListName = (name: string, listTypeID: string): boolean => {
    const currLists = listTypeID === Values.movieListsID ? movieLists : tvLists;
    if (isDuplicateListName(name, currLists)) {
      Alert.alert("List name already exists, please choose a different one");
      return false;
    }
    if (!name) {
      Alert.alert("Please enter a name for the list");
      return false;
    }
    return true;
  };

  const onDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this list?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => {
            deleteFunc();
            router.back();
            Toast.show({
              type: 'info',
              text1: "Deleted List",
              text2: "You deleted list '" + name + "'",
              position: "bottom",
              visibilityTime: 3000,
              bottomOffset: 100
            });
          }
        }
      ]
    );
  };

  const handleAddRemove = (addItems: UserItem[], removedItems: UserItem[]) => {
    setLoading(true);
    editItemsFunc(addItems, removedItems, listID, listTypeID).then(() => {
        setLoading(false);
        onClose();
        setAddModalVisible(false);
    })
  }

  const handleAddRemoveUnseen = (addItems: Item[], removedItems: Item[]) => {
    setLoading(true);
    editItemsFuncUnseen(addItems, removedItems, listID, listTypeID).then(() => {
        setLoading(false);
        onClose();
        setAddModalVisible(false);
    })
  }

  return (
    <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
    >
        <Pressable style={styles.overlay} onPress={onClose}>
            <Pressable style={[styles.tabContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text, borderBottomWidth: 0 }]} onPress={(e) => e.stopPropagation()}>
                <View style={{width: '100%'}}>
                    <TouchableOpacity onPress={onDelete}>
                        <View style={[styles.tab, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                            <Ionicons name="trash" size={30} color='red' style={styles.icon}/>
                            <Text style={[styles.tabTitle, {color: 'red'}]}>Delete List</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{width: '100%'}}>
                    <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                        <View style={[styles.tab, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                            <Ionicons name="pencil" size={30} color={Colors[colorScheme ?? 'light'].text} style={styles.icon}/>
                            <Text style={styles.tabTitle}>Edit Details</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{width: '100%'}}>
                    <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                        <View style={[styles.tab, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                            <Ionicons name="add" size={35} color={Colors[colorScheme ?? 'light'].text} style={styles.icon}/>
                            <Text style={styles.tabTitle}>Add To List</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{width: '100%'}}>
                    <TouchableOpacity onPress={onClose}>
                        <View style={[styles.tab, {borderBottomWidth: 0,}]}>
                            <Ionicons name="close" size={30} color={Colors[colorScheme ?? 'light'].text} style={styles.icon}/>
                            <Text style={styles.tabTitle}>Close</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Pressable>
        <Modal
                animationType="fade"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <BlurView intensity={100} style={styles.overlay}>
                    {loading && (
                        <View style={styles.spinnerOverlay}>
                            <ActivityIndicator size="large" />
                        </View>
                    )}
                    <KeyboardAvoidingView behavior="padding">
                        <View style={[styles.modalView, { backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
                            <View style={styles.headerContainer}>
                                <Text style={[styles.headerText, { color: Colors[colorScheme ?? 'light'].text}]}>Edit List</Text>
                                <TouchableOpacity onPress={() => {
                                    if (loading) return;
                                    setEditModalVisible(false);
                                }}>
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
                                value={newListName}
                                onChangeText={setNewListName}
                                style={[styles.inputNameField,
                                    { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text,
                                        color: Colors[colorScheme ?? 'light'].text,
                                    }]}
                            />
                            <TextInput
                                multiline
                                autoCapitalize="sentences"
                                placeholder="List description (optional)..."
                                value={newDescription}
                                onChangeText={setNewDescription}
                                style={[styles.inputDescField,
                                    { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text,
                                        color: Colors[colorScheme ?? 'light'].text,
                                    }]
                                }
                            />
                            
                            <TouchableOpacity onPress={() => {
                                    if (loading) return;
                                    if (isValidListName(newListName, listTypeID)) {
                                      setLoading(true);
                                      editListFunc(listID, listTypeID, newListName, newDescription).then(() => {
                                        setLoading(false);
                                        onClose();
                                        onEdit(newListName, newDescription);
                                        setEditModalVisible(false);
                                      });
                                    }
                                }}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={50}
                                    color={Colors[colorScheme ?? 'light'].text}
                                />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </BlurView>
            </Modal>
            {addModalVisible && (isRanked ?
                <ListModalScreen
                    listTypeID={listTypeID}
                    visible={addModalVisible}
                    containedItems={items}
                    onClose={() => setAddModalVisible(false)}
                    onSelectedItemsChange={handleAddRemove}
                /> :
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={addModalVisible}
                    onRequestClose={() => setAddModalVisible(false)}
                >
                    <AddUnwatchedScreen listID={listID} listTypeID={listTypeID}
                        onClose={() => setAddModalVisible(false)} onSave={(addItems, removeItems) => {
                            handleAddRemoveUnseen(addItems, removeItems);
                        }} />
                </Modal>
            )}
    </Modal>
  );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flex: 1,
        alignSelf: 'center',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        marginTop: (Dimensions.screenHeight / 1.5) - 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderWidth: 0.5,
        marginBottom: 20,
    },
    tab: {
        flexDirection: 'row',
        width: '100%',
        borderBottomWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: Dimensions.screenHeight / 12,
    },
    tabTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    icon: {
        position: 'absolute',
        left: 10,
        top: Dimensions.screenHeight / 48,
    },
    deleteContainer: {
        flex: 1,
        width: '100%',
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
        width: Dimensions.screenWidth * 4/5,
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