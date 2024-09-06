import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, Pressable, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Text } from '@/components/Themed';
import React, { ContextType, forwardRef, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withClamp, withSpring, withTiming } from 'react-native-reanimated';

type RowProps = {
    item: Item;
};
const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;
const itemWidth = (screenWidth - 12) / 3;

const RenderItem = ({ item }: RowProps) => {
  const isMovie = 'title' in item;
  const colorScheme = useColorScheme();
  let date = isMovie ? item.release_date : item.first_air_date;
  date = date.slice(0,4);
  return (
    <>
    <View>
      <Link href={{pathname: "/search_item", params: { id: item.id, groupKey: isMovie ? "movie" : "tv" }}} asChild>
        <TouchableOpacity>
          <Animated.View style={[styles.innerContainer, styles.shadow]}>
            <Image
                source={{ uri: imgUrl + item.poster_path }}
                style={[styles.image, { borderColor: Colors[colorScheme ?? 'light'].text }]}
            />
          </Animated.View>
        </TouchableOpacity>
      </Link>
    </View>
    </>
  );
};
export const MemoizedRenderItem = memo(RenderItem);

export const RenderGrid = ({ listID, items, loadMoreItems, isLoadingMore }:
  {listID: string, items: Item[], loadMoreItems: () => void, isLoadingMore: boolean }) => {
    const colorScheme = useColorScheme();
    const [popUpIndex, setPopUpIndex] = useState(-1);
    const topPadding = useSharedValue(0);

    useEffect(() => {
      if (popUpIndex >= 0 && popUpIndex < 3) {
        topPadding.value = withSpring((itemWidth * 1.5) * 0.2);
      } else {
        topPadding.value = withSpring(0);
      }
    }, [popUpIndex])

    const animatedStyle = useAnimatedStyle(() => {
      return {
        paddingTop: topPadding.value,
      }
    }, [topPadding.value]);
    const renderFooter = () => {
      if (!isLoadingMore) return null;
      return <ActivityIndicator style={{ margin: 20 }} />;
    };
    return (
      <View style={{backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1, marginTop: 3}}>
        <Animated.FlatList
          data={items}
          renderItem={({ item, index }) => <MemoizedRenderItem item={item} />}
          keyExtractor={item => item.id}
          numColumns={3}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          style={[animatedStyle, {flex: 1}]}
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        /> 
      </View>
    )
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 1 / 1.5,
    borderWidth: 1,
    borderRadius: 10,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: itemWidth,
    marginLeft: 3,
    marginBottom: 3,
  },
});