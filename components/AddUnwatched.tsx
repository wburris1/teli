import { useCallback, useState } from "react";
import { MoviesTabContent, ShowsTabContent } from "./Search/SearchTabContent";
import { SafeAreaView, TouchableOpacity, useColorScheme } from "react-native";
import SearchInput from "./Search/SearchInput";
import Values from "@/constants/Values";
import Colors from "@/constants/Colors";
import { Text, View } from "./Themed";
import { Ionicons } from "@expo/vector-icons";
import { useLoading } from "@/contexts/loading";
import Spinner from "react-native-loading-spinner-overlay";

export const AddUnwatchedScreen = ({listID, listTypeID, onClose, onSave}:
    {listID: string, listTypeID: string, onClose: () => void, onSave: (addItems: Item[], outItems: Item[]) => void}) => {
    const colorScheme = useColorScheme();
    const [search, setSearch] = useState('');
    const [addItems, setAddItems] = useState<Item[]>([]);
    const [outItems, setOutItems] = useState<Item[]>([]);
    const { loading } = useLoading();

    const moviesTabContent = useCallback(() => 
        <MoviesTabContent
            query={search} isPosting={false} isAdding={true} addItems={addItems} outItems={outItems}
            setAddItems={setAddItems} setOutItems={setOutItems} listID={listID}
        />, [search, addItems, outItems]);
    const showsTabContent = useCallback(() => 
        <ShowsTabContent
            query={search} isPosting={false} isAdding={true} addItems={addItems} outItems={outItems}
            setAddItems={setAddItems} setOutItems={setOutItems} listID={listID}
        />, [search, addItems, outItems]);

    return (
        <SafeAreaView style={{backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1}}>
            <Spinner visible={loading} />
            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, alignItems: 'center'}}>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close-circle" size={35} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
                <Text style={{fontSize: 18, fontWeight: '600'}}>Add To List</Text>
                <TouchableOpacity onPress={() => onSave(addItems, outItems)}>
                    <Ionicons name="checkmark-circle" size={35} color={Colors['theme']} />
                </TouchableOpacity>
            </View>
            <SearchInput search={search} setSearch={setSearch} isFocused={false} />
            {listTypeID == Values.movieListsID ? moviesTabContent() : showsTabContent()}
        </SafeAreaView>
    )
}