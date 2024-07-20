//import { useSignIn } from '@clerk/clerk-expo';
import { FIREBASE_AUTH } from '@/firebaseConfig';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Pressable, Alert, KeyboardAvoidingView, useColorScheme, Image, TouchableOpacity } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Logo } from '@/components/LogoView';

const Login = () => {
  //const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const auth = FIREBASE_AUTH;

  const onSignInPress = async () => {
    if (loading || !emailAddress) {
      return;
    }
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, emailAddress, password);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Spinner visible={loading} />
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome to</Text>
        <Text style={[styles.headerText, { fontWeight: 'bold', fontSize: 28 }]}>Take Two</Text>
        <Logo width={75} height={75} />
      </View>

      <KeyboardAvoidingView behavior='padding'>
        <TextInput autoCapitalize="none" placeholder="Email..." value={emailAddress} onChangeText={setEmailAddress} style={[styles.inputField, {
          borderBottomWidth: 1,
          borderTopWidth: 1,
          borderColor: Colors[colorScheme ?? 'light'].gray,
        }]} />
        <TextInput placeholder="Password..." value={password} onChangeText={setPassword} secureTextEntry style={styles.inputField} />

        <TouchableOpacity onPress={onSignInPress}>
            <View style={[styles.button, { backgroundColor: "#add8e6", borderColor: Colors[colorScheme ?? 'light'].gray }]}>
              <Text style={[styles.buttonText, { color: emailAddress ? 'black' : 'gray' }]}>Login</Text>
            </View>
        </TouchableOpacity>

        <Link href="/signup" asChild>
          <TouchableOpacity>
            <View style={[styles.button, { backgroundColor: '#90ee90', borderColor: Colors[colorScheme ?? 'light'].gray }]}>
              <Text style={[styles.buttonText, { color: 'gray' }]}>Sign up</Text>
            </View>
          </TouchableOpacity>
        </Link>
        <Link href="/reset" asChild>
          <TouchableOpacity>
            <View style={[styles.button, { backgroundColor: 'gray', borderColor: Colors[colorScheme ?? 'light'].gray }]}>
              <Text style={[styles.buttonText, { color: 'white' }]}>Reset password</Text>
            </View>
          </TouchableOpacity>
        </Link>
      </KeyboardAvoidingView>
      <View style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].gray }}>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '300',
    padding: 5,
  },
  image: {
    height: 75,
    width: 75,
  },
  inputField: {
    height: 50,
    padding: 10,
  },
  button: {
    padding: 15,
    borderTopWidth: 1,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  }
});

export default Login;