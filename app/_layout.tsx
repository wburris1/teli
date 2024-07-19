import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
//import { User, onAuthStateChanged } from 'firebase/auth';

import { useColorScheme } from '@/components/TemplateFiles/useColorScheme';
import * as SecureStore from 'expo-secure-store';
//import { FIREBASE_AUTH } from '@/firebaseConfig';
import { AuthProvider, useAuth } from '@/contexts/authContext';
import { DataProvider } from '@/contexts/dataContext';
import { ListProvider } from '@/contexts/listContext';
import { LoadingProvider } from '@/contexts/loading';
import { UserProvider } from '@/contexts/userContext';
//import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
/*
const CLERK_PUBLISHABLE_KEY = 'pk_test_cHJvcGVyLWphY2thbC04My5jbGVyay5hY2NvdW50cy5kZXYk';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  }
};
*/
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const InitialLayout = () => {
  //const { isLoaded, isSignedIn } = useAuth();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  //const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/')
    } else {
      router.replace('/(auth)/login')
    }
  }, [user]);

  return <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
    </ThemeProvider>;
};

function RootLayoutNav() {
  return (
    <UserProvider>
      <LoadingProvider>
        <AuthProvider>
          <DataProvider>
            <ListProvider>
              <InitialLayout />
            </ListProvider>
          </DataProvider>
        </AuthProvider>
      </LoadingProvider>
    </UserProvider>
  );
}
