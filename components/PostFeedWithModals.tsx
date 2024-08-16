import { ActivityIndicator, FlatList, StyleSheet, useColorScheme, View as RNView, View, RefreshControl } from 'react-native';
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
  handleRefresh: () => void;
  refreshing: boolean;
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
  handleRefresh,
  refreshing,
}: 
PostListWithModalsProps) => {
  const colorScheme = useColorScheme();


  return (
    <GestureHandlerRootView style={{ width: '100%', height: '100%', backgroundColor: Colors[colorScheme ?? 'light'].background }}>
      {!loading ? (
        <>
          <FlatList
            data={posts}
            keyExtractor={(item) => item.post_id}
            renderItem={({ item, index }) => <PostFeed item={item} index={index} handleComments={handleComments} handleLikes={handleLikes} redirectLink={redirectLink} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
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
