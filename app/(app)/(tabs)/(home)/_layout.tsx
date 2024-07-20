import Colors from "@/constants/Colors";
import React from 'react'; 
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { TouchableOpacity, useColorScheme } from "react-native";

export default function SearchLayout() {
    const colorScheme = useColorScheme();

    return (
      <Stack>
        <Stack.Screen name="index" options={{ 
          headerShown: true, 
          title: "Home",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push({ pathname: "/addPost" })} style={{paddingRight: 10,}}>
              <Ionicons name="add-circle" size={30} color={Colors[colorScheme ?? 'light'].text}/>
            </TouchableOpacity>
          ),
          }} />
        <Stack.Screen name="home_item" options={{ headerShown: false, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
        }} />
        <Stack.Screen name="home_user" options={{ headerBackTitle: "Home", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
             }} />
    </Stack>
    );
}