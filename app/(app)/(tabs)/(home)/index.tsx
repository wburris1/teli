import { ActivityIndicator, FlatList, StyleSheet, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import { makeFeed } from '@/data/feedData';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/dataContext';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';

export default function TabOneScreen() {
  const { showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, keyExtractor} = useModalState();
  const { posts, loading, loadMorePosts, isLoadingMore } = makeFeed('Home', 1);
  const { refreshFlag } = useData();
  const colorScheme = useColorScheme();
  console.log(posts.length)

  return (
    <View style={styles.container}>
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
        redirectLink='/home'
        loadMorePosts={loadMorePosts}
        isLoadingMore={isLoadingMore}
      />
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
