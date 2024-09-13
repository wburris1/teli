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
        <Stack.Screen name="initialScreen" options={{ 
          headerShown: true, 
          title: "",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background
          },
          headerLeft: () => (
            <Text style={{fontSize: 25, fontWeight: 'bold'}}>Notifications</Text>
          )
          }} />
      </Stack>
    );
}