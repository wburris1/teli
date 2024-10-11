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
import { LinearGradient } from 'expo-linear-gradient';
import Dimensions from '@/constants/Dimensions';

const imgUrl = 'https://image.tmdb.org/t/p/w780';
const coolBackdrop = imgUrl + '/9faGSFi5jam6pDWGNd0p8JcJgXQ.jpg'; // Breaking Bad

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
      <Spinner visible={loading} color={Colors['theme']} />
      <View style={{position: 'absolute', top: 0}}>
          <Image source={{uri: coolBackdrop}} style={styles.backdropImage} />
          <LinearGradient
              colors={['transparent', Colors[colorScheme ?? 'light'].background]}
              style={styles.gradient}
          />
      </View>
      <View style={styles.header}>
        <Text style={[styles.headerText, { fontWeight: 'bold', fontFamily: 'Copperplate' }]}> Take2</Text>
        
      </View>

        <TextInput autoCapitalize="none" placeholder="Email..." value={emailAddress} onChangeText={setEmailAddress} style={[styles.inputField, {
          borderColor: Colors[colorScheme ?? 'light'].gray,
          color: Colors[colorScheme ?? 'light'].text,
          marginBottom: 10,
        }]} />
        <TextInput placeholder="Password..." value={password} onChangeText={setPassword} secureTextEntry style={[styles.inputField, {
          color: Colors[colorScheme ?? 'light'].text, borderBottomWidth: 1, borderColor: Colors[colorScheme ?? 'light'].gray,
        }]} />

        <Link href="/reset" asChild>
          <TouchableOpacity>
              <Text style={{fontSize: 16, fontWeight: '500', paddingTop: 10, paddingRight: 10, color: 'gray', alignSelf: 'flex-end'}}>Forgot password?</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity onPress={onSignInPress}>
            <View style={[styles.button, { backgroundColor: Colors['theme'], borderColor: Colors[colorScheme ?? 'light'].gray }]}>
              <Text style={[styles.buttonText, { color: emailAddress && password ? 'white' : 'gray' }]}>Login</Text>
            </View>
        </TouchableOpacity>
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10}}>
          <Text style={{fontSize: 16, fontWeight: '400', paddingRight: 5, color: 'gray'}}>Don't have an account?</Text>
          <Link href="/signup" asChild>
          <TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors['theme'] }}>Sign up</Text>
          </TouchableOpacity>
        </Link>
        </View>
      <View style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background, justifyContent: 'flex-start', alignItems: 'center', padding: 50 }}>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdropImage: {
    height: '100%',
    width: Dimensions.screenWidth,
    aspectRatio: 1.5,
  },
  gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: Dimensions.screenWidth > 400 ? 100 : 80,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: Dimensions.screenWidth / 1.5,
    backgroundColor: 'transparent',
  },
  headerText: {
    fontSize: 40,
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
    marginHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  button: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 15,
    marginTop: 10,
    width: (Dimensions.screenWidth) - 20,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  }
});

export default Login;