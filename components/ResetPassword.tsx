import React, { useState } from 'react';
import { TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, useColorScheme, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { FIREBASE_AUTH } from '@/firebaseConfig';
import Spinner from 'react-native-loading-spinner-overlay';

const ChangePasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
      Alert.alert('Success', 'Password reset email sent. Check your inbox.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        <TextInput
            placeholder="Email address..."
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].gray }]}
            keyboardType="email-address"
            autoCapitalize="none"
        />
        <TouchableOpacity onPress={handlePasswordReset} style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].text }]} disabled={loading}>
            {loading ? (
            <ActivityIndicator size="small" color="#fff" />
            ) : (
            <Text style={[styles.buttonText, { color: Colors[colorScheme ?? 'light'].background }]}>Request Reset</Text>
            )}
        </TouchableOpacity>    
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    fontSize: 16,
    paddingVertical: 15,
  },
  button: {
    width: '100%',
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 16,
  },
});

export default ChangePasswordScreen;