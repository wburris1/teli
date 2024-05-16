import { useLoading } from '@/contexts/loading';
import { Link } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react'
import { View, Image, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Animated, TouchableOpacity } from 'react-native';
import Dimensions from '@/constants/Dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;

type Props = {
    movieList: Item[],
};

const ItemScreen = ({movieList}: Props) => {
    const { loading, setLoading } = useLoading();
    const [numImgsLoaded, setImgsLoaded] = useState(0);
    var changed = false;
    const [animatedValues, setAnimatedValues] = useState(() =>
        movieList.map(() => new Animated.Value(1))
    );

    useEffect(() => {
        if (numImgsLoaded >= movieList.length) {
            setLoading(false);
            setImgsLoaded(0);
        }
    }, [numImgsLoaded]);

    useEffect(() => {
        setAnimatedValues({ ...animatedValues });
    }, [changed]);

    const renderItem = ({ item, index }: { item: Item, index: number }) => {
        var title = "";
        if ('title' in item) {
            title = item.title;
        } else if ('name' in item) {
            title = item.name;
        }

        if (!animatedValues[index]) {
            changed = !changed;
            animatedValues[index] = new Animated.Value(1);
        }

        const handleItemPress = () => {
            console.log(item);
            const animated = animatedValues[index];
            animated.setValue(0.4);
            Animated.timing(animated, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start()
        };

        return (
            <Link href={{pathname: "/item", params: item}} asChild>
                <TouchableOpacity onPress={handleItemPress} style={styles.container}>
                    <View style={styles.imageBorder}>
                    <Image
                        source={{ uri: imgUrl + item.poster_path }}
                        style={styles.image}
                        onLoad={() => setImgsLoaded((prevNumImgsLoaded) => prevNumImgsLoaded + 1)}
                    />
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.title}>{title}</Text>
                    <View style={{ flex: 1 }} />
                </TouchableOpacity>
            </Link>
        );
        /*
        return (
            <Link href={{pathname: "/item", params: item}} asChild>
                <Pressable onPress={handleItemPress} style={styles.container}>
                    <Animated.View style={{opacity: animatedValues[index]}}>
                        <Image
                            source={{ uri: imgUrl + item.poster_path }}
                            style={styles.image}
                            onLoad={() => setImgsLoaded((prevNumImgsLoaded) => prevNumImgsLoaded + 1)}
                        />
                        <Text style={styles.title}>{item.title}</Text>
                    </Animated.View>
                </Pressable>
            </Link>
        ); */
    };
    

    return (
        <View style={styles.list}>
            {loading && <View style={styles.loadContainer}>
                <ActivityIndicator size="large" color="#000" />
            </View>}
            <FlatList
                data={movieList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                style={{ opacity: loading ? 0 : 1 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: screenWidth,
        paddingTop: screenHeight / 4,
    },
    list: {
        //flex: 1
        paddingBottom: 15
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 10,
        marginLeft: 5,
        marginRight: 5,
        width: (screenWidth / 2) - 20,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        aspectRatio: 1 / 1.5,
    },
    imageBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    title: {
        textAlign: 'center',
        paddingVertical: 5,
        fontSize: 16,
    }
});

export default ItemScreen;