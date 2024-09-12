import Colors from "@/constants/Colors";
import React from 'react'; 
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { TouchableOpacity, useColorScheme } from "react-native";
import { Text } from "@/components/Themed";

export default function SearchLayout() {
    const colorScheme = useColorScheme();

    return (
      <Stack>
        <Stack.Screen name="index" options={{ 
          headerShown: true, 
          title: "",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background
          },
          headerLeft: () => (
            <Text style={{fontSize: 25, fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].text}}>Home</Text>
          )
          }} />
        <Stack.Screen name="home_item" options={{ headerShown: false, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
        }} />
        <Stack.Screen name="home_user" options={{ headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
             }} />
        <Stack.Screen name="start_post_page" options={{ headerShown: true, headerBackTitle: "", headerTitle: "What's this about?", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
        }} />
        <Stack.Screen name="post_page" options={{ headerShown: true, headerBackTitle: "Back", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
        }} />
    </Stack>
    );
}