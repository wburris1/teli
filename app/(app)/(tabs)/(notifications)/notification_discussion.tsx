import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import { makeFeed } from '@/data/feedData';
import { useLayoutEffect, useState } from 'react';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import {  router, useLocalSearchParams, useNavigation } from 'expo-router';
import { WritePost } from '@/components/WritePost';

export default function DiscussionScreen() {
  const { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment} = useModalState();
  const [refreshing, setRefreshing] = useState(false);
  const { itemID, name, poster, backdrop, runtime, groupKey } = useLocalSearchParams();
  const { posts, loading, loadMorePosts, isLoadingMore } = makeFeed('Home', refreshing, setRefreshing, itemID as string);
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const [postModalVisible, setPostModalVisible] = useState(false);
  
  const handleRefresh = () => {
    setRefreshing(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setPostModalVisible(true)} style={{borderRadius: 20, backgroundColor: Colors['theme'], paddingHorizontal: 10, paddingVertical: 5}}>
          <Text style={{fontSize: 16, fontWeight: '500', color: 'white'}}>Post</Text>
        </TouchableOpacity>
      ),
    })
  }, [colorScheme])

  return (
    <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={postModalVisible}
        onRequestClose={() => setPostModalVisible(false)}
        >
        <WritePost id={itemID as string} name={name as string}
            poster={poster as string} groupKey={groupKey as string} isHome={false}
            onClose={() => setPostModalVisible(false)} backdrop={backdrop as string}
            runtime={Number(runtime as string)} />
        </Modal>
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
          redirectLink={'/notification'}
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

