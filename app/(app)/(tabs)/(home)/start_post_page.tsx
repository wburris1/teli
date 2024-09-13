import SearchInput from "@/components/Search/SearchInput";
import { MoviesTabContent, ShowsTabContent } from "@/components/Search/SearchTabContent";
import SearchTabs from "@/components/Search/SearchTabs";
import { StartPostScreen } from "@/components/StartPost";
import { View } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView, TouchableOpacity } from "react-native-gesture-handler";

export default function StartPost() {
    const colorScheme = useColorScheme();
    const [search, setSearch] = useState('');

    const moviesTabContent = useCallback(() => 
        <MoviesTabContent
            query={search} isPosting={true} isAdding={false} addItems={[]} outItems={[]} setAddItems={() => {}} setOutItems={() => {}} listID=''
        />, [search]);
    const showsTabContent = useCallback(() => 
        <ShowsTabContent
            query={search} isPosting={true} isAdding={false} addItems={[]} outItems={[]} setAddItems={() => {}} setOutItems={() => {}} listID=''
        />, [search]);

    const searchTabs = [
        {
            title: 'Movies',
            content: moviesTabContent
        },
        {
            title: 'Shows',
            content: showsTabContent
        }
    ]; 

    return (
        <SafeAreaView style={{ backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1 }}>
            <View style={styles.container}>
                <SearchInput search={search} setSearch={setSearch} isFocused={false} />
                <SearchTabs browse={false} tabs={searchTabs} onTabChange={() => {}} index={0}/>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
})