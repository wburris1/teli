import Colors from "@/constants/Colors";
import { useLoading } from "@/contexts/loading";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, useColorScheme } from "react-native";

export default function AppEntry() {
    const router = useRouter();
    const colorScheme = useColorScheme();

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="reorder" options={{
                title: 'Reorder List',
                presentation: 'modal',
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                },
                headerLeft: () => (
                    <Pressable onPress={() => router.back()}>
                    {({ pressed }) => (
                        <Ionicons
                        name="close-circle"
                        size={35}
                        color={"red"}
                        style={{ opacity: pressed ? 0.5 : 1 }}
                        />
                    )}
                    </Pressable>
                ),
            }} />
            <Stack.Screen name="add_to_list" options={{
                title: 'Add to Lists',
                presentation: 'modal',
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                },
            }} />
        </Stack>
    );
}