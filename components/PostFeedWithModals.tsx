import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, useColorScheme, View as RNView, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import { FeedPost } from '@/constants/ImportTypes';
import { PostFeed } from '@/components/PostFeed';
import LikesModal from '@/components/LikesModal';
import CommentsModal from '@/components/CommentsModal';

type PostListWithModalsProps = {
  posts: FeedPost[];
  loading: boolean;
  post: FeedPost;
  showComments: boolean;
  showLikes: boolean;
  handleComments: (show: boolean, post: FeedPost) => void;
  handleLikes: (show: boolean, post: FeedPost) => void;
  setShowComments: (show: boolean) => void;
  setShowLikes: (show: boolean) => void;
  redirectLink: string;
  loadMorePosts: () => Promise<void>;
  isLoadingMore: boolean
};

const PostFeedWithModals = ({
  posts,
  loading,
  post,
  showComments,
  showLikes,
  handleComments,
  handleLikes,
  setShowComments,
  setShowLikes,
  redirectLink, 
  loadMorePosts, 
  isLoadingMore
}: PostListWithModalsProps) => {
  const colorScheme = useColorScheme();

  const keyExtractor = (item: FeedPost) => {
    if (item.score && (item.score >= 0 || item.score == -2)) {
      if (item.item_id === '729165') {
        console.log(item.item_name)
      }
      return `${item.user_id}/${item.item_id}`;
    } else {
      if (item.post_id === '729165') {
        console.log("HELLOOOOOOOOOO post")
      }
      return `${item.user_id}/${item.post_id}`;
    }
  };
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator style={{ margin: 20 }} />;
  };

  return (
    <GestureHandlerRootView style={{ width: '100%', height: '100%', backgroundColor: Colors[colorScheme ?? 'light'].background }}>
      {!loading ? (
        <>
          <FlatList
            data={posts}
            keyExtractor={keyExtractor}
            renderItem={({ item, index }) => <PostFeed item={item} index={index} handleComments={handleComments} handleLikes={handleLikes} redirectLink={redirectLink} />}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
          <LikesModal post={post} onClose={() => setShowLikes(false)} visible={showLikes} redirectLink={redirectLink} />
          <CommentsModal post={post} onClose={() => setShowComments(false)} visible={showComments} redirectLink={redirectLink} />
        </>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PostFeedWithModals;
