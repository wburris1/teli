import { Stack } from "expo-router";

export default function SearchLayout() {
    return (
        <Stack>
            <Stack.Screen name="lists" options={{ headerShown: false }} />
            <Stack.Screen name="list_item" options={{ headerBackTitle: "Lists", headerTitle: "", headerTintColor: '#000' }} />
        </Stack>
    );
}