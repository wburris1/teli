import Colors from "@/constants/Colors";
import Values from "@/constants/Values";
import { useData } from "@/contexts/dataContext";
import { useTab } from "@/contexts/listContext";
import { useLoading } from "@/contexts/loading";
import { addAndRemoveItemFromLists } from "@/data/addToList";
import { AdjustReorderedScores } from "@/data/itemScores";
import Spinner from 'react-native-loading-spinner-overlay';
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View, useColorScheme, ActivityIndicator, StatusBar, StyleSheet, Text, Modal} from "react-native";

export default function AppEntry() {
    const router = useRouter();
    const { movies, shows, requestRefresh } = useData();
    const { activeTab } = useTab();
    const reorderFunc = AdjustReorderedScores();
    const listTypeID = activeTab == 0 ? Values.movieListsID : Values.tvListsID;
    const colorScheme = useColorScheme();
    const { loading } = useLoading();
    
   
  return (
      <View style={{ flex: 1 }}>
        {true && (
          <View style={styles.loading}>
            <ActivityIndicator size='large' />
          </View>
        )}
          <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="reorder" options={{
                  title: 'Reorder List',
                  presentation: 'modal',
                  headerShadowVisible: false,
                  headerStyle: {
                      backgroundColor: Colors[colorScheme ?? 'light'].background,
                  },
                  headerRight: () => (
                      <Pressable onPress={() => {
                          if (loading) return;
                        reorderFunc(activeTab === 0 ? movies : shows, Values.seenListID, listTypeID).then(() => {
                            requestRefresh();
                            router.replace('(tabs)');
                          }).finally(() => {
                              //setLoading(false); // Hide loading screen
                          });
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
              <Stack.Screen name="add_to_list" options={{
                  title: 'Add to Lists',
                  presentation: 'modal',
                  headerShadowVisible: false,
                  headerStyle: {
                      backgroundColor: Colors[colorScheme ?? 'light'].background,
                  },
              }} />
              <Stack.Screen name="addPost" options={{
                  title: 'Make Post',
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
                                  color={Colors[colorScheme ?? 'light'].text}
                                  style={{ opacity: pressed ? 0.5 : 1 }}
                              />
                          )}
                      </Pressable>
                  ),
              }} />
          </Stack>
      </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
      flex: 1,
      backgroundColor: "#F5F5F5",
      paddingTop: StatusBar.currentHeight,
      justifyContent: 'center',
      alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }
});