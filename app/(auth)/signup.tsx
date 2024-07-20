import { Button, TextInput, StyleSheet, KeyboardAvoidingView, Image, Pressable, TouchableOpacity, useColorScheme } from 'react-native';
//import { useAuth, useSignUp } from '@clerk/clerk-expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useLayoutEffect, useState } from 'react';
import { Stack, useNavigation } from 'expo-router';
import { User, createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import Values from '@/constants/Values';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const SignUpStart = () => {
  //const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  // Create the user and send the verification email
  const onSignUpPress = async () => {
    if (loading) {
      return;
    }
    setLoading(true);

    try {
      // Create the user on Clerk
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
    const userData: UserData = {
      user_id: user.uid,
      first_name: firstName,
      last_name: lastName,
      email: user.email || "",
      username: username,
      is_private: false,
      profile_picture: "/",
    };

    try {
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

  /* Verify the email address
  const onPressVerify = async () => {
    if (loading) {
      return;
    }
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
    } catch (err: any) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  }; */

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onSignUpPress}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>Done</Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !pendingVerification }} />
      <Spinner visible={loading} />
      <KeyboardAvoidingView behavior='padding'>
        {!pendingVerification && (
          <>
            <Pressable>
              <Image source={{ uri: '/' }} style={styles.profilePic} />
            </Pressable>
            <TouchableOpacity >
              <View style={[styles.picButton, { backgroundColor: Colors[colorScheme ?? 'light'].text }]}>
                <Ionicons name="add" size={25} color={Colors[colorScheme ?? 'light'].background}/>
                <Text style={[styles.picText, { color: Colors[colorScheme ?? 'light'].background }]}>Add Picture</Text>
              </View>
            </TouchableOpacity>
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
            <TouchableOpacity>
              <View style={[styles.bioButton, {borderColor: Colors[colorScheme ?? 'light'].gray}]}>
                <Ionicons name="add" size={25} color={Colors[colorScheme ?? 'light'].text} />
                <Text style={{fontSize: 16, fontWeight: '500'}}>Add Bio...</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  inputField: {
    height: 50,
    borderBottomWidth: 1,
    padding: 10,
  },
  bioField: {
    height: 200,
    padding: 10,
    marginTop: 10,
    borderBottomWidth: 1,
  },
  button: {
    margin: 8,
    alignItems: 'center',
  },
  profilePic: {
    margin: 10,
    height: 100,
    aspectRatio: 1,
    backgroundColor: 'gray',
    borderRadius: 50,
    alignSelf: 'center',
  },
  picButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderRadius: 20,
    paddingVertical: 7,
    paddingRight: 10,
    paddingLeft: 7,
  },
  picText: {
    fontSize: 14,
    fontWeight: '500',
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