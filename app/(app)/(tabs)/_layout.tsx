import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, TouchableOpacity } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/TemplateFiles/useColorScheme';
import { useClientOnlyValue } from '@/components/TemplateFiles/useClientOnlyValue';
//import { useAuth, useUser } from '@clerk/clerk-expo';
import { useSortedScreens } from 'expo-router/build/useScreens';
import { FIREBASE_AUTH } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';
  
// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

export default function TabLayout() {
  const colorScheme = useColorScheme();
  //const { isSignedIn } = useAuth();
  const { user } = useAuth();
  const router = useRouter();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].text,
        tabBarStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
        headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
        //tabBarActiveTintColor: '#000',
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarShowLabel: false,
          headerShadowVisible: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
        redirect={false}
      />
      <Tabs.Screen
        name="(lists)"
        options={{
          title: 'Lists',
          tabBarShowLabel: false,
          headerTitle: 'Lists',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
          tabBarLabel: 'Lists',
          headerShown: false,
        }}
        redirect={false}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          headerTitle: 'Search',
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
          tabBarLabel: 'Search',
          headerShown: false,
        }}
        redirect={false}
      />
      <Tabs.Screen
        name="(notifications)"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
          tabBarLabel: 'Add',
        }}
        redirect={false}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          tabBarLabel: 'Profile',
          headerShadowVisible: false,
        }}
        redirect={false}
      />
    </Tabs>
  );
}
