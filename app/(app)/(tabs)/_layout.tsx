import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
//import { useAuth, useUser } from '@clerk/clerk-expo';
import { useSortedScreens } from 'expo-router/build/useScreens';
import { FIREBASE_AUTH } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';

export const LogoutButton = () => {
  //const { signOut } = useAuth();
  const colorScheme = useColorScheme();

  const doLogout = () => {
    FIREBASE_AUTH.signOut();
  };

  return (
    <Pressable onPress={doLogout} style={{ marginRight: 10 }}>
      <Ionicons name="log-out-outline" size={25} color={Colors[colorScheme ?? 'light'].text} />
    </Pressable>
  );
};
  
// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  //const { isSignedIn } = useAuth();
  const { user } = useAuth();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
        headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
        //tabBarActiveTintColor: '#000',
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
        redirect={false}
      />
      <Tabs.Screen
        name="(lists)"
        options={{
          title: 'Lists',
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
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
          tabBarLabel: 'Search',
          headerShown: false,
        }}
        redirect={false}
      />
      <Tabs.Screen
        name="two"
        options={{
          headerTitle: "user?.firstName! +  + user?.lastName!",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          tabBarLabel: 'Profile',
          headerRight: () => <LogoutButton />,
        }}
        redirect={false}
      />
    </Tabs>
  );
}
