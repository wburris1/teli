import Colors from "@/constants/Colors";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function SearchLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack>
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="search_item" options={{ headerShown: false, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
             }} />
             <Stack.Screen name="search_user" options={{ headerBackTitle: "Back", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
             }} />
             <Stack.Screen name="search_list_page" options={{
                headerShown: true, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
            }} />
            <Stack.Screen name="search_post" options={{ headerShown: false, headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
              headerStyle: {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
              }
            }}/>
            <Stack.Screen name="search_follower" options={{
                headerShown: true, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
            }} />
            <Stack.Screen name="search_discussion" options={{
                headerShown: true, headerBackTitle: "", headerTitle: "Discussion", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
            }} />
        </Stack>
    );
}