import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

const PublicLayout = () => {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerBackTitle: '',
        headerShadowVisible: false,
        headerShown: true,
      }}>
      <Stack.Screen
        name="login"
        options={{
          headerTitle: '',
        }}></Stack.Screen>
      <Stack.Screen
        name="signup"
        options={{
          headerTitle: 'Signup',
        }}></Stack.Screen>
      <Stack.Screen
        name="reset"
        options={{
          headerTitle: 'Reset Password',
        }}></Stack.Screen>
    </Stack>
  );
};

export default PublicLayout;