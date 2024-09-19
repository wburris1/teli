import { ActivityIndicator, FlatList, StyleSheet, useColorScheme, View as RNView, View, RefreshControl, Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import { FeedPost } from '@/constants/ImportTypes';
import { PostFeed } from '@/components/PostFeed';
import LikesModal from '@/components/LikesModal';
import CommentsModal from '@/components/CommentsModal';
import Dimensions from '@/constants/Dimensions';
import { LinearGradient } from 'expo-linear-gradient';

type PostListWithModalsProps = {
  posts: any[];
  loading: boolean;
  post: any;
  showComments: boolean;
  showLikes: boolean;
  handleComments: (show: boolean, post: FeedPost) => void;
  handleLikes: (show: boolean, post: FeedPost) => void;
  setShowComments: (show: boolean) => void;
  setShowLikes: (show: boolean) => void;
  redirectLink: string;
  handleRefresh: () => void;
  refreshing: boolean;
  loadMorePosts: () => void;
  isLoadingMore: boolean;
  handleIncrementComment: () => void;
  incrementComment: boolean;
  isHome?: boolean,
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
  loadMorePosts,
  isLoadingMore,
  handleIncrementComment,
  incrementComment,
  isHome = false,
}: 
PostListWithModalsProps) => {
  const colorScheme = useColorScheme();

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator style={{ margin: 20 }} />;
  };

  return (
    <GestureHandlerRootView style={{ width: Dimensions.screenWidth, flex: 1,
    backgroundColor: Colors[colorScheme ?? 'light'].background}}>
      {isHome && (
        <LinearGradient
          colors={[Colors[colorScheme ?? 'light'].background, colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent']}
          style={{position: 'absolute', top: 0, left: 0, right: 0, height: 5, zIndex: 1}}
        />
      )}
      {!loading ? (
        <>
          <FlatList
            data={posts}
            keyExtractor={(item) => item.post_id}
            renderItem={({ item, index }) => <PostFeed item={item} index={index} handleComments={handleComments}
              handleLikes={handleLikes} redirectLink={redirectLink} incrementComment={incrementComment} />}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.75}
            ListFooterComponent={renderFooter}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            style={{paddingTop: isHome ? 5 : 10}}
          />
          <LikesModal post={post} onClose={() => setShowLikes(false)} visible={showLikes} redirectLink={redirectLink} />
          <Modal
            animationType="slide"
            transparent={true}
            visible={showComments}
            onRequestClose={() => setShowComments(false)}
          >
          <CommentsModal post={post} onClose={() => setShowComments(false)} visible={showComments} redirectLink={redirectLink} handleIncrementComment={handleIncrementComment}/>
          </Modal>
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
