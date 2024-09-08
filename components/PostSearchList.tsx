import { useCallback, useEffect, useState } from "react";
import _ from "lodash";
import { useItemSearch } from "@/data/itemData";
import Values from "@/constants/Values";
import { FlatList, Image, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { UserItem } from "@/constants/ImportTypes";
import { getItems } from "@/data/userData";
import convertUserItemToItem from "./Helpers/ConvertUserItemToItem";

const imgUrl = 'https://image.tmdb.org/t/p/w342';

export const NewPostSearchLists = ({ query, listTypeID, listID, onSelect }: { query: string, listTypeID: string, listID: string, onSelect: (item: Item) => void }) => {
    const [list, setList] = useState<Item[]>([]);
    const [userList, setUserList] = useState<UserItem[]>([]);
    const [filteredList, setFilteredList] = useState<UserItem[]>([]);
    const { user } = useAuth();
    const getItemFunc = getItems();
    
    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
            const globalItems = await useItemSearch(query, listTypeID == Values.movieListsID);
            setList(globalItems || []);
        }, 300),
        [listTypeID]
    );

    useEffect(() => {
        getItemFunc(listID, listTypeID).then(items => setUserList(items));
    }, [user, listTypeID, listID])

    useEffect(() => {
        if (listID === "") {
            debouncedFetchData(query);
        } else if (userList) {
            const filtered = userList.filter(item => {
                const title = 'title' in item ? item.title : item.name;
                return title.toLowerCase().includes(query.toLowerCase());
            });
            setFilteredList(filtered);
        }
    }, [query, listTypeID, debouncedFetchData, userList]);

    const renderItem = ({ item, index }: { item: Item, index: number }) => {
        var title = "";
        const isMovie = 'title' in item;
        var date = isMovie ? item.release_date : item.first_air_date;
        date = date.slice(0,4);

        if (isMovie) {
            title = item.title;
        } else {
            title = item.name;
        }
        
        return <ItemCard item={item} />
    };

    const renderUserItem = ({ item, index }: { item: UserItem, index: number }) => {
        var title = "";
        const isMovie = 'title' in item;
        var date = isMovie ? item.release_date : item.first_air_date;
        date = date.slice(0,4);

        if (isMovie) {
            title = item.title;
        } else {
            title = item.name;
        } 
        return <ItemCard item={convertUserItemToItem(item)} />
    };
    type ItemCardProps = {
      item: Item;
    };
    const ItemCard = ({ item }: ItemCardProps) => {
        const colorScheme = useColorScheme();
        const isMovie = 'title' in item;
        const title = isMovie ? item.title : item.name;
        const date = isMovie ? item.release_date : item.first_air_date;

        return (
            <View style={[styles.container, { borderBottomColor: Colors[colorScheme ?? 'light'].text }]} key={item.id}>
                <View style={[styles.imageBorder, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
                <Image
                    source={{ uri: imgUrl + item.poster_path }}
                    style={styles.image}
                />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={{fontWeight: '200'}}>{date}</Text>
                </View>
                <TouchableOpacity onPress={() => onSelect(item)}>
                    <Ionicons
                        name="add-circle-outline"
                        size={45}
                        color={Colors[colorScheme ?? 'light'].text}
                        style={{padding: 5,}}
                    />
                </TouchableOpacity>
            </View>
        );
    }

    const UserItemList = ({ list }: { list: UserItem[] }) => {
        return (
            <View>
                <FlatList
                    data={list}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.item_id}
                    numColumns={1}
                />
            </View>
        )
    }

    const ItemList = ({ list }: { list: Item[] }) => {
        return (
            <View>
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    numColumns={1}
                />
            </View>
        )
    }

    return (
        <>
            {listID == "" ?
            <ItemList list={list} /> :
            <UserItemList list={filteredList} />}
        </>
    )
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        borderBottomWidth: 1,
    },
    image: {
        width: 65,
        aspectRatio: 1 / 1.5,
    },
    imageBorder: {
        borderWidth: 1,
        borderColor: '#000',
        overflow: 'hidden',
        borderRadius: 10,
        marginVertical: 10,
        marginLeft: 10,
    },
    title: {
        flex: 1,
        textAlign: 'left',
        fontSize: 16,
        fontWeight: '500',
        paddingLeft: 2,
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 5,
    },
})