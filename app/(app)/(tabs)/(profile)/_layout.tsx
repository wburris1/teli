import Colors from "@/constants/Colors";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function ProfileLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack>
            <Stack.Screen name="profile" options={{
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background
                },
            }}/>
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
            <Stack.Screen name="profile_follower" options={{ headerShown: true, headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
              headerStyle: {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
              }
            }}/>
            <Stack.Screen name="profile_post" options={{ headerShown: false, headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
              headerStyle: {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
              }
            }}/>
            <Stack.Screen name="profile_list_page" options={{ headerShown: true, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
              headerStyle: {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
              }
            }}/>
            <Stack.Screen name="credits" options={{ headerShown: true, headerBackTitle: "Back", headerTitle: "Credits", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
             }} />
             <Stack.Screen name="profile_discussion" options={{
                headerShown: true, headerBackTitle: "", headerTitle: "Discussion", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
            }} />
        </Stack>
    );
}