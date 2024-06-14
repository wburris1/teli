import Colors from "@/constants/Colors";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function PostLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack>
            <Stack.Screen name="postModal" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
    );
}