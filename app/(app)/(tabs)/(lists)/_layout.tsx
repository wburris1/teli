import Colors from "@/constants/Colors";
import { useTab } from "@/contexts/listContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, useColorScheme } from "react-native";

export default function SearchLayout() {
  const colorScheme = useColorScheme();
  const { activeTab, setAddModalVisible } = useTab();

  return (
      <Stack>
        <Stack.Screen name="lists" options={{
          headerShown: true,
          title: "",
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerShadowVisible: false,
            headerRight: () => (
              <Pressable onPress={() => setAddModalVisible(true)}>
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
            headerLeft: () => (
              <Text style={{fontSize: 25, fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].text}}>Lists</Text>
            )
        }} />
        <Stack.Screen name="list_item" options={{
          headerShown: false, headerBackTitle: "List", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          }
        }} />
        <Stack.Screen name="list_page" options={{
          headerShown: true, headerBackTitle: "", headerTitle: "", headerTintColor: Colors[colorScheme ?? 'light'].text, headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          }
        }} />
      </Stack>
  );
}