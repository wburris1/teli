import { StyleSheet, Text, TouchableOpacity, useColorScheme } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { View } from "./Themed"
import Values from "@/constants/Values"
import { useState } from "react"
import Colors from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { List } from "@/constants/ImportTypes"
import { useData } from "@/contexts/dataContext"

type ScreenProps = {
    listTypeID: string,
    isPost: boolean,
    onChange: (category: string) => void,
}

export const SearchCategories = ({listTypeID, isPost, onChange}: ScreenProps) => {
    // If post, get user lists and display in horizontal scrollView
    const [selectedID, setSelectedID] = useState('');
    const colorScheme = useColorScheme();
    const { movieLists, tvLists } = useData();
    var reorderedLists: List[] = [];

    const reorderData = (data: List[], firstId: string, secondId: string) => {
        const firstItem = data.find(item => item.list_id === firstId);
        const secondItem = data.find(item => item.list_id === secondId);
        const restItems = data.filter(item => item.list_id !== firstId && item.list_id !== secondId);
        if (!firstItem || !secondItem) {
          return data;
        }
        return [firstItem, secondItem, ...restItems];
    };

    if (isPost) {
        reorderedLists = reorderData(listTypeID == Values.movieListsID ? movieLists : tvLists, Values.seenListID, Values.bookmarkListID)
    }

    return (
        <ScrollView style={styles.container} horizontal showsHorizontalScrollIndicator={false}>
            {reorderedLists.map(list => 
                <View key={list.list_id}>
                    <TouchableOpacity key={list.list_id} onPress={() => {
                        const newID = selectedID == list.list_id ? "" : list.list_id;
                        setSelectedID(newID);
                        onChange(newID);
                    }}>
                        <View style={[styles.category,
                            { backgroundColor: selectedID == list.list_id ? Colors[colorScheme ?? 'light'].text : 
                                Colors[colorScheme ?? 'light'].background,
                                borderColor: Colors[colorScheme ?? 'light'].text }]}>
                            {list.list_id == selectedID && <Ionicons name="close" size={25} color={Colors[colorScheme ?? 'light'].background} />}
                            <Text style={[styles.text, {color: list.list_id == selectedID ? Colors[colorScheme ?? 'light'].background : 
                                Colors[colorScheme ?? 'light'].text}]}
                            >
                                {list.name}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 5,
        paddingTop: 10,
    },
    category: {
        borderWidth: 1,
        borderRadius: 20,
        marginRight: 5,
        flexDirection: 'row',
        alignItems: 'center',
        height: 33,
        paddingHorizontal: 5,
    },
    text: {
        fontSize: 16,
        fontWeight: '300',
        paddingHorizontal: 2,
    }
})