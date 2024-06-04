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
              headerTransparent: true,
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
                  <Text style={{fontSize: 25, fontWeight: 'bold'}}>Lists</Text>
                )
          }} />
          <Stack.Screen name="list_item" options={{
              headerShown: true, headerBackTitle: "List", headerTitle: "", headerTintColor: '#000'
          }} />
          <Stack.Screen name="list_page" options={{
              headerShown: true, headerBackTitle: "Lists", headerTitle: "", headerTintColor: '#000'
          }} />
      </Stack>
  );
}