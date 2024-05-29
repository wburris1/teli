import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { Pressable, useColorScheme } from "react-native";

export default function SearchLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack>
            <Stack.Screen name="lists" options={{
                headerShown: true,
                title: "Lists",
                headerTransparent: true,
                headerLeft: () => (
                    <Link href="/reorder" asChild>
                      <Pressable>
                        {({ pressed }) => (
                          <Ionicons
                            name="menu"
                            size={35}
                            color={Colors[colorScheme ?? 'light'].text}
                            style={{ opacity: pressed ? 0.5 : 1 }}
                          />
                        )}
                      </Pressable>
                    </Link>
                  ),
                  headerRight: () => (
                    <Pressable>
                      {({ pressed }) => (
                        <Ionicons
                          name="add"
                          size={35}
                          color={Colors[colorScheme ?? 'light'].text}
                          style={{ opacity: pressed ? 0.5 : 1 }}
                        />
                      )}
                    </Pressable>
                  ),
            }} />
            <Stack.Screen name="list_item" options={{
                headerShown: true, headerBackTitle: "Lists", headerTitle: "", headerTintColor: '#000'
            }} />
        </Stack>
    );
}