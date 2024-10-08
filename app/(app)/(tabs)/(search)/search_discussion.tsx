import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import { makeFeed } from '@/data/feedData';
import { useLayoutEffect, useState } from 'react';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import {  router, useLocalSearchParams, useNavigation } from 'expo-router';

export default function DiscussionScreen() {
  const { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment} = useModalState();
  const [refreshing, setRefreshing] = useState(false);
  const { itemID } = useLocalSearchParams();
  const { posts, loading, loadMorePosts, isLoadingMore } = makeFeed('Home', refreshing, setRefreshing, itemID as string);
  const colorScheme = useColorScheme();
  
  const handleRefresh = () => {
    setRefreshing(true);
  };

  return (
    <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }}>
      {/* Show loading indicator while posts are being fetched */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors['loading']} />
      ) : (
        <PostFeedWithModals
          posts={posts}
          loading={loading}
          post={post}
          showComments={showComments}
          showLikes={showLikes}
          handleComments={handleComments}
          handleLikes={handleLikes}
          setShowComments={setShowComments}
          setShowLikes={setShowLikes}
          redirectLink={'/search'}
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          loadMorePosts={loadMorePosts}
          isLoadingMore={isLoadingMore}
          handleIncrementComment={handleIncrementComment}
          incrementComment={incrementComment}
          isHome={true}
        />
      )}
    </View>
  );
}

