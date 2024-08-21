import ImageUploader, { uploadImage } from "@/components/ImageUploader";
import { Text, View } from "@/components/Themed"
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useLayoutEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, useColorScheme } from "react-native";
import Spinner from "react-native-loading-spinner-overlay";
import Toast from "react-native-toast-message";

export default function EditProfileScreen () {
    const colorScheme = useColorScheme();
    const { user, userData, setUserData } = useAuth();
    const [profilePic, setProfilePic] = useState(userData ? userData.profile_picture : '');
    const [firstName, setFirstName] = useState(userData ? userData.first_name : '');
    const [lastName, setLastName] = useState(userData ? userData.last_name : '');
    const [username, setUsername] = useState(userData ? userData.username : '');
    const [bio, setBio] = useState(userData ? userData.bio : '');
    const [bioVisible, setBioVisible] = useState(false);
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onSave = async () => {
        if (user && userData) {
            setLoading(true);
            try {
                const downloadedURL = await uploadImage(user.uid, profilePic);
                console.log(downloadedURL);
                const userRef = doc(FIREBASE_DB, 'users', user.uid);
                const updatedUserData: UserData = {
                    user_id: user.uid,
                    email: userData.email,
                    profile_picture: downloadedURL,
                    first_name: firstName,
                    last_name: lastName,
                    username: username,
                    bio: bio,
                    is_private: userData.is_private,
                    userPushToken: userData.userPushToken
                };

                await updateDoc(userRef, updatedUserData);
                setUserData(updatedUserData);
                router.back();
            } catch (err: any) {
                console.error("Error editing profile: ", err);
            } finally {
              setLoading(false);
              Toast.show({
                type: 'info',
                text1: "Profile Saved",
                text2: "You successfully edited your profile",
                position: "bottom",
                visibilityTime: 3000,
                bottomOffset: 100
              });
            }
        }
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={onSave}>
                    <Ionicons name="checkmark-circle" size={35} color={'#32CD32'} />
                </TouchableOpacity>
            )
        })
    }, [navigation, username, profilePic, firstName, lastName, bio])

    return (
        <View style={styles.container}>
            <Spinner visible={loading} />
            <KeyboardAvoidingView behavior='padding'>
                <ImageUploader changeImage={setProfilePic} />
                <TextInput autoCapitalize="none" placeholder="First name..." value={firstName} onChangeText={setFirstName}
                style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray, color: Colors[colorScheme ?? 'light'].text,}]} />
                <TextInput autoCapitalize="none" placeholder="Last name..." value={lastName} onChangeText={setLastName}
                style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray, color: Colors[colorScheme ?? 'light'].text,}]} />
                <TextInput autoCapitalize="none" placeholder="Username..." value={username} onChangeText={setUsername}
                style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray, color: Colors[colorScheme ?? 'light'].text,}]} />
                <TouchableOpacity onPress={() => setBioVisible(true)}>
                <View style={[styles.bioButton, {borderColor: Colors[colorScheme ?? 'light'].gray}]}>
                    <Ionicons name={bio ? "pencil" : "add"} size={25} color={Colors[colorScheme ?? 'light'].text} />
                    <Text style={{fontSize: 16, fontWeight: '500', marginLeft: 5,}}>{bio ? "Edit Bio: " : "Add Bio..."}</Text>
                    <Text numberOfLines={1} style={{fontSize: 16, fontWeight: '200', paddingRight: 5, flex: 1}}>{bio}</Text>
                </View>
                </TouchableOpacity>
            </KeyboardAvoidingView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={bioVisible}
                onRequestClose={() => setBioVisible(false)}
            >
                <SafeAreaView style={[styles.bioContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <View style={styles.bioHeader}>
                    <TouchableOpacity onPress={() => setBioVisible(false)}>
                    <Ionicons name="close-circle" size={35} color={'red'} />
                    </TouchableOpacity>
                    <Text style={{fontSize: 16, fontWeight: '500'}}>Bio</Text>
                    <TouchableOpacity onPress={() => {
                        setBio(bio);
                        setBioVisible(false);
                    }}>
                    <Ionicons name="checkmark-circle" size={35} color={'#32CD32'} />
                    </TouchableOpacity>
                </View>
                <TextInput multiline autoCapitalize="sentences" placeholder="About yourself..." value={bio} onChangeText={setBio}
                    style={[styles.bioField, {borderColor: Colors[colorScheme ?? 'light'].gray}]} />
                </SafeAreaView>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    bioContainer: {
      flex: 1,
      zIndex: 1,
    },
    bioHeader: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
    },
    inputField: {
      height: 50,
      borderBottomWidth: 1,
      padding: 10,
    },
    bioField: {
      height: 200,
      padding: 10,
      borderBottomWidth: 1,
    },
    button: {
      margin: 8,
      alignItems: 'center',
    },
    bioButton: {
      height: 50,
      width: '100%',
      alignItems: 'center',
      flexDirection: 'row',
      borderBottomWidth: 1,
      paddingLeft: 5,
    },
  });