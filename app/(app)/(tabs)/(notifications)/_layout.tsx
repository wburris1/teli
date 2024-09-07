import Colors from "@/constants/Colors";
import React from 'react'; 
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { TouchableOpacity, useColorScheme } from "react-native";

export default function SearchLayout() {
    const colorScheme = useColorScheme();

    return (
      <Stack>
        <Stack.Screen name="initialScreen" options={{ 
          headerShown: true, 
          title: "Notifications",
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background
          },
          }} />
      </Stack>
    );
}