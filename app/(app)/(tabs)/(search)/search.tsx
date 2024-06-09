import { StyleSheet, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import ItemScreen from '@/components/Search/SearchCard';
import SearchInput from '@/components/Search/SearchInput';
import SearchTabs from '@/components/Search/SearchTabs';
import { useItemSearch } from '@/data/itemData';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import _ from 'lodash';
import Colors from '@/constants/Colors';

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