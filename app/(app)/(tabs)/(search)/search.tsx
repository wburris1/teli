import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import ItemScreen from '@/components/Search/SearchCard';
import SearchInput from '@/components/Search/SearchInput';
import SearchTabs from '@/components/Search/SearchTabs';
import { useItemSearch } from '@/data/itemData';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import _ from 'lodash';
import Colors from '@/constants/Colors';
import { fetchUsers } from '@/data/searchUsers';
import { UsersListScreen } from '@/components/Search/UserSearchCard';

const USERS_PAGE_SIZE = 10;

const UsersTabContent = ({ query }: { query: string }) => {
    const [userList, setUserList] = useState<UserData[]>([]);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const loadMoreUsers = async () => {
        if (loading) return;
        setLoading(true);
        const { users, lastDoc } = await fetchUsers(query, lastVisible);
        setUserList(prevUsers => [...prevUsers, ...users]);
        setLastVisible(lastDoc);
        setLoading(false);
    };

    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
            setUserList([]);
            setLastVisible(null);
            const { users, lastDoc } = await fetchUsers(query, null);
            setUserList(users);
            setLastVisible(lastDoc);
        }, 300),
        []
    );

    useEffect(() => {
        if (query != "") {
            debouncedFetchData(query);
        } else {
            setUserList([]);
        }
    }, [query, debouncedFetchData]);

    return (
        <View style={{ flex: 1 }}>
            <UsersListScreen users={userList} redirectPath='/search_user' />
            {loading && <Text>Loading...</Text>}
            {userList.length == USERS_PAGE_SIZE &&
            <TouchableOpacity onPress={loadMoreUsers} disabled={loading}>
                <Text>Load More</Text>
            </TouchableOpacity>}
        </View>
    );
}

const MoviesTabContent = ({ query }: { query: string }) => {
    const [movieList, setMovieList] = useState<Item[]>([]);
    
    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
            const items = await useItemSearch(query, true);
            setMovieList(items);
        }, 300),
        []
    );

    useEffect(() => {
        debouncedFetchData(query);
    }, [query, debouncedFetchData]);

    return <ItemScreen movieList={movieList} />;
};

const ShowsTabContent = ({ query }: { query: string }) => {
    const [tvList, setTvList] = useState<Item[]>([]);
    
    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
            const items = await useItemSearch(query, false);
            setTvList(items);
        }, 300),
        []
    );

    useEffect(() => {
        debouncedFetchData(query);
    }, [query, debouncedFetchData]);

    return <ItemScreen movieList={tvList} />;
};

export default function SearchScreen() {
    const colorScheme = useColorScheme();
    const [search, setSearch] = useState('');

    const moviesTabContent = useCallback(() => 
        <MoviesTabContent 
            query={search}
        />, [search]);
    const showsTabContent = useCallback(() => 
        <ShowsTabContent 
            query={search}
        />, [search]);
    const usersTabContent = useCallback(() => 
        <UsersTabContent 
            query={search}
        />, [search]);

    const searchTabs = [
        {
            title: 'Movies',
            content: moviesTabContent
        },
        {
            title: 'Shows',
            content: showsTabContent
        },
        {
            title: 'Users',
            content: usersTabContent
        },
    ];

    return (
        <View style={{ backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <SearchInput search={search} setSearch={setSearch} isFocused={false} />
                <SearchTabs tabs={searchTabs} onTabChange={() => {}} />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});