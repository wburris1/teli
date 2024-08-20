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
          headerShadowVisible: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push({ pathname: "/addPost" })} style={{paddingRight: 10,}}>
              <Ionicons name="add" size={35} color={Colors[colorScheme ?? 'light'].text}/>
            </TouchableOpacity>
          ),
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
    </Stack>
    );
}