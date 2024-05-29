import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import ItemScreen from '@/components/Search/SearchCard';
import SearchInput from '@/components/Search/SearchInput';
import SearchTabs from '@/components/Search/SearchTabs';
import { useItemSearch } from '@/data/itemData';
//import { useTVSearch } from '@/data/showData';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

type Props = {
    query: string;
};
  
const MoviesTabContent = ({query}: Props) => {
    const movieList = useItemSearch(query, true);
    return <ItemScreen movieList={movieList} />;
};
  
const ShowsTabContent = ({query}: Props) => {
    const tvList = useItemSearch(query, false);
    return <ItemScreen movieList={tvList} />;
};

export default function SearchScreen() {
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
        <View style={{ backgroundColor: '#fff', flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <SearchInput search={search} setSearch={setSearch} />
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