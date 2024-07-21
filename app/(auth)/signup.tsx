import { Button, TextInput, StyleSheet, KeyboardAvoidingView, Image, Pressable, TouchableOpacity, useColorScheme, Modal, SafeAreaView, Alert } from 'react-native';
//import { useAuth, useSignUp } from '@clerk/clerk-expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useLayoutEffect, useState } from 'react';
import { Stack, useNavigation } from 'expo-router';
import { User, createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/firebaseConfig';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import Values from '@/constants/Values';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import ImageUploader, { uploadImage } from '@/components/ImageUploader';

const SignUpStart = () => {
  const [profilePic, setProfilePic] = useState('');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [bioVisible, setBioVisible] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const [uploading, setUploading] = useState(false);

  // Create the user and send the verification email
  const onSignUpPress = async () => {
    if (loading) {
      return;
    }
    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, emailAddress, password);
      const user = userCred.user;
      await addUserToDB(user);
      // Send verification Email
      //await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // change the UI to verify the email address
      //setPendingVerification(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addUserToDB = async (user: User) => {
    const userRef = doc(FIREBASE_DB, "users", user.uid);
    let userData: UserData = {
      user_id: user.uid,
      first_name: firstName,
      last_name: lastName,
      email: user.email || "",
      username: username,
      is_private: false,
      profile_picture: '/',
      bio: bio,
    };

    try {
      const profileURL = await uploadImage(user.uid, profilePic);
      userData.profile_picture = profileURL;
      await setDoc(userRef, userData);
      
      createSeenLists(user.uid);
    } catch (err: any) {
      alert(err.message);
    }
  }

  const createSeenLists = async (user_id: string) => {
    const movieSeenRef = doc(FIREBASE_DB, "users", user_id, Values.movieListsID, Values.seenListID);
    const tvSeenRef = doc(FIREBASE_DB, "users", user_id, Values.tvListsID, Values.seenListID);
    const movieBookmarkRef = doc(FIREBASE_DB, "users", user_id, Values.movieListsID, Values.bookmarkListID);
    const tvBookmarkRef = doc(FIREBASE_DB, "users", user_id, Values.tvListsID, Values.bookmarkListID);
    const seenData = {
      list_id: Values.seenListID,
      name: Values.seenListID,
      description: "",
      is_custom: false,
      top_poster_path: "",
      second_poster_path: "",
      bottom_poster_path: "",
    }
    const bookmarkData = {
      list_id: Values.bookmarkListID,
      name: Values.bookmarkListID,
      description: "",
      is_custom: false,
      top_poster_path: "",
      second_poster_path: "",
      bottom_poster_path: "",
    }
    try {
      await setDoc(movieSeenRef, seenData);
    } catch (err: any) {
      console.error("Error creating movie seen list: ", err);
    }
    try {
      await setDoc(tvSeenRef, seenData);
    } catch (err: any) {
      console.error("Error creating tv seen list: ", err);
    }
    try {
      await setDoc(movieBookmarkRef, bookmarkData);
    } catch (err: any) {
      console.error("Error creating movie bookmark list: ", err);
    }
    try {
      await setDoc(tvBookmarkRef, bookmarkData);
    } catch (err: any) {
      console.error("Error creating tv bookmark list: ", err);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onSignUpPress}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>Done</Text>
        </TouchableOpacity> 
      )
    })
  }, [navigation, emailAddress, password, username, firstName, lastName, bio, profilePic])

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !pendingVerification }} />
      <Spinner visible={loading} />
      <KeyboardAvoidingView behavior='padding'>
        {!pendingVerification && (
          <>
            <ImageUploader changeImage={setProfilePic} />
            <TextInput autoCapitalize="none" placeholder="First name..." value={firstName} onChangeText={setFirstName}
              style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray}]} />
            <TextInput autoCapitalize="none" placeholder="Last name..." value={lastName} onChangeText={setLastName}
              style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray}]} />
            <TextInput autoCapitalize="none" placeholder="Username..." value={username} onChangeText={setUsername}
              style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray}]} />
            <TextInput autoCapitalize="none" placeholder="Email..." value={emailAddress} onChangeText={setEmailAddress}
              style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray}]} />
            <TextInput placeholder="Password..." value={password} onChangeText={setPassword} secureTextEntry
              style={[styles.inputField, {borderColor: Colors[colorScheme ?? 'light'].gray}]} />
            <TouchableOpacity onPress={() => setBioVisible(true)}>
              <View style={[styles.bioButton, {borderColor: Colors[colorScheme ?? 'light'].gray}]}>
                <Ionicons name={bio ? "pencil" : "add"} size={25} color={Colors[colorScheme ?? 'light'].text} />
                <Text style={{fontSize: 16, fontWeight: '500', marginLeft: 5,}}>{bio ? "Edit Bio: " : "Add Bio..."}</Text>
                <Text numberOfLines={1} style={{fontSize: 16, fontWeight: '200', paddingRight: 5, flex: 1}}>{bio}</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {pendingVerification && (
          <>
            <View>
              <Text>Check your email</Text>
            </View>
          </>
        )}
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
  );
};

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

export default SignUpStart;