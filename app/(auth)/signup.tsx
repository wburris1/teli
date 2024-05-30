import { Button, TextInput, View, StyleSheet, KeyboardAvoidingView, Text } from 'react-native';
//import { useAuth, useSignUp } from '@clerk/clerk-expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { User, createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import Values from '@/constants/Values';

const Register = () => {
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
    const userData = {
      user_id: user.uid,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      // MORE INITIAL USER DATA HERE
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
      is_ranked: true,
      top_poster_path: "",
      second_poster_path: "",
      bottom_poster_path: "",
    }
    const bookmarkData = {
      list_id: Values.bookmarkListID,
      is_ranked: false,
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !pendingVerification }} />
      <Spinner visible={loading} />
      <KeyboardAvoidingView behavior='padding'>
        {!pendingVerification && (
          <>
            <TextInput autoCapitalize="none" placeholder="First name..." value={firstName} onChangeText={setFirstName} style={styles.inputField} />
            <TextInput autoCapitalize="none" placeholder="Last name..." value={lastName} onChangeText={setLastName} style={styles.inputField} />
            <TextInput autoCapitalize="none" placeholder="Username..." value={username} onChangeText={setUsername} style={styles.inputField} />
            <TextInput autoCapitalize="none" placeholder="Email..." value={emailAddress} onChangeText={setEmailAddress} style={styles.inputField} />
            <TextInput placeholder="Password..." value={password} onChangeText={setPassword} secureTextEntry style={styles.inputField} />

            <Button onPress={onSignUpPress} title="Sign up" color={'#6c47ff'}></Button>
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
    justifyContent: 'center',
    padding: 20,
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: '#6c47ff',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  button: {
    margin: 8,
    alignItems: 'center',
  },
});

export default Register;