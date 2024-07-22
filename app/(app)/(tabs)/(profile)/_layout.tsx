import Colors from "@/constants/Colors";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function ProfileLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack>
            <Stack.Screen name="profile" options={{headerShadowVisible: false}}/>
            <Stack.Screen name="edit_profile" options={{ headerShown: true, headerBackTitle: "Cancel", headerTitle: "Edit Profile", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
             }} />
            <Stack.Screen name="profile_user" options={{ headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
              headerStyle: {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
              }
            }}/>
            <Stack.Screen name="profile_item" options={{ headerShown: false, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
              headerStyle: {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
              }
            }}/>
        </Stack>
    );
}