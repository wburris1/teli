import Values from "@/constants/Values";
import { useData } from "@/contexts/dataContext";
import { useTab } from "@/contexts/listContext";
import { AdjustReorderedScores } from "@/data/userData";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";

export default function AppEntry() {
    const router = useRouter();
    const { movies, shows, requestRefresh } = useData();
    const { activeTab } = useTab();
    const reorderFunc = AdjustReorderedScores();
    const listTypeID = activeTab == 0 ? Values.movieListsID : Values.tvListsID;

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="reorder" options={{
                title: 'Reorder List',
                presentation: 'modal',
                headerRight: () => (
                    <Pressable onPress={() => {
                        reorderFunc(activeTab == 0 ? movies : shows, Values.seenListID, listTypeID).then(() => {
                            requestRefresh();
                            router.back();
                        })
                    }}>
                    {({ pressed }) => (
                        <Ionicons
                        name="checkmark-circle"
                        size={35}
                        color={"#32CD32"}
                        style={{ opacity: pressed ? 0.5 : 1 }}
                        />
                    )}
                    </Pressable>
                ),
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
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
    );
}