import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, Pressable, ActivityIndicator, TouchableWithoutFeedback, LayoutAnimation } from 'react-native';
import { Text } from '@/components/Themed';
import React, { ContextType, forwardRef, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withClamp, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import _ from 'lodash';

type RowProps = {
    item: Item;
};
const imgUrl = 'https://image.tmdb.org/t/p/w300';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;
const itemWidth = (screenWidth - 12) / 3;

// Prefetch images before rendering
const prefetchImages = async (items: Item[]) => {
  return Promise.all(
    items.map(item => Image.prefetch(imgUrl + item.poster_path)) // Prefetch all images
  );
};

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
                source={{ uri: imgUrl + item.poster_path, cache: 'force-cache'}}
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
    const [prefetchedItems, setPrefetchedItems] = useState<Item[]>([]);
    const hasPrefetched = useRef(false); // Add a flag to track whether images have been prefetched

    // Prefetch images and then set prefetched items
    useEffect(() => {
      const prefetchImagesForGrid = async () => {
        if (!hasPrefetched.current) {
          hasPrefetched.current = true;
          await prefetchImages(items); // Prefetch all images
        }
        setPrefetchedItems(items);   // Only update the state after all images are prefetched
        triggerAnimation();
      };
      prefetchImagesForGrid();
    }, [items]);

    
     // Shared values for the animation
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);  // Start from 50 units down

    // Trigger the fade-in and slide-up animation
    const triggerAnimation = () => {
      console.log('triggered');
      // Animate opacity and translation (slide)
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 500 });
        translateY.value = withTiming(0, { duration: 500 });
      }, 300); // Add a small delay
    }; 

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

    const gridAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }]
      };
    });
    useEffect(() => {
      // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [prefetchedItems]);

    return (
      <View style={{backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1}}>
        <View style={styles.browseTextContainer}>
          <Text style={{fontSize: screenWidth  > 400 ? 24 : 20, fontWeight: 'bold',
          top: 2, left: 5, zIndex: 2}}>Browse</Text>
        </View>
        <LinearGradient colors={[Colors[colorScheme ?? 'light'].background,
          colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent']}
          style={{height: screenWidth > 400 ? 35 : 30, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1}} />
        
        <Animated.View style={[{ flex: 1 }, gridAnimatedStyle]}>
          <Animated.FlatList
            data={prefetchedItems}
            renderItem={({ item, index }) => <MemoizedRenderItem item={item} />}
            keyExtractor={item => item.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            style={[animatedStyle, {flex: 1, paddingTop: screenWidth > 400 ? 32 : 28 }]}
            onEndReached={loadMoreItems}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        </Animated.View>
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
  browseTextContainer: {
    position: 'absolute',
    top: 2,
    left: 5,
    zIndex: 2,
    width: '100%', // Ensure full-width
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