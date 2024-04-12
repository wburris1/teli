import { Stack } from "expo-router";

export default function SearchLayout() {
    return (
        <Stack>
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="item" options={{ headerBackTitle: "Search", headerTitle: "", headerTintColor: '#000' }} />
        </Stack>
    );
}