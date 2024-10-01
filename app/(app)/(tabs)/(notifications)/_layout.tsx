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
        <Stack.Screen name="notification_user" options={{ headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
          }}/>
          <Stack.Screen name="notification_item" options={{ headerShown: false, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
          }}/>
          <Stack.Screen name="notification_follower" options={{ headerShown: true, headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
          }}/>
          <Stack.Screen name="notification_post" options={{ headerShown: false, headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
          }}/>
          <Stack.Screen name="notification_list_page" options={{ headerShown: true, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
            headerStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }
          }}/>
      </Stack>
    );
}