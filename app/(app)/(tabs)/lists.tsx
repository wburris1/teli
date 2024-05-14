import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image } from 'react-native';

import { Text, View } from '@/components/Themed';
import SearchTabs from '@/components/Search/SearchTabs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ListTab from '@/components/ListTab';
import { Link } from 'expo-router';
import { useUserItemsSeenSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { useData } from '@/contexts/dataContext';

type Props = {
    seen: React.ReactNode;
    want: React.ReactNode;
    recs: React.ReactNode;
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;

const ListTabs = ({seen, want, recs}: Props) => {
    return (
        <>
            <ListTab title="Seen" children={seen} />
            <ListTab title="Want To See" children={want} />
            <ListTab title="Recommendations" children={recs}  />
        </>
    );
}

const renderItem = ({ item, index }: { item: UserItem, index: number }) => {    
    const score = item.score.toFixed(1);

    return (
        <Link href={{pathname: "/lists"}} asChild>
            <TouchableOpacity>
                <View style={styles.itemContainer}>
                    <Image
                        source={{ uri: imgUrl + item.poster_path }}
                        style={styles.image}
                    />
                    <View style={{ flex: 1 }} />
                    <Text style={styles.itemText}>{item.title}</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.rank}><View style={styles.scoreCircle}><Text style={styles.text}>#{index + 1}</Text></View></View>
                    <View style={styles.score}><View style={styles.scoreCircle}><Text style={styles.text}>{score}</Text></View></View>
                </View>
            </TouchableOpacity>
        </Link>
    );
}

const makeList = (items: UserItem[]) => {
    return (
        <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.item_id}
            numColumns={3}
        />
    )
}

const MoviesTabContent = () => {
    const { refreshFlag } = useData();
    const items = useUserItemsSeenSearch(true, refreshFlag);
    items.sort((a: UserItem, b: UserItem) => b.score - a.score);
    const seen = makeList(items);
    const want = makeList(items);
    const recs = <Text>Empty</Text>;
    return <ListTabs seen={seen} want={want} recs={recs}/>;
};

const ShowsTabContent = () => {
  const { refreshFlag } = useData();
  const items = useUserItemsSeenSearch(false, refreshFlag);
  items.sort((a: UserItem, b: UserItem) => b.score - a.score);
  const seen = makeList(items);
  const want = makeList(items);
  const recs = <Text>Empty</Text>;
  return <ListTabs seen={seen} want={want} recs={recs}/>;
};

export default function TabOneScreen() {
    const { refreshFlag } = useData();

    var moviesTabContent = useCallback(() => 
        <MoviesTabContent />, [refreshFlag]);
    var showsTabContent = useCallback(() => 
        <ShowsTabContent />, [refreshFlag]);

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
                <SearchTabs tabs={searchTabs} />
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
  itemText: {
    fontSize: 14,
    padding: 5,
    textAlign: 'center'
  },
  itemLabel: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  text: {
    fontSize: 16
  },
  rank: {
    position: 'absolute',
    left: 10,
    top: 5,
    backgroundColor: 'transparent'
  },
  score: {
    position: 'absolute',
    right: 10,
    top: 5,
    backgroundColor: 'transparent'
  },
  scoreCircle: {
    width: 35,
    height: 35,
    backgroundColor: '#fff',
    borderRadius: 35/2,
    borderWidth: 0.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
    marginLeft: 5,
    marginRight: 5,
    width: (screenWidth / 3) - 10,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 25,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1 / 1.5,
  },
});