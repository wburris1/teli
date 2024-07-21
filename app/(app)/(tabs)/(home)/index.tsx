import { ActivityIndicator, FlatList, StyleSheet, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import { makeFeed } from '@/data/feedData';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/dataContext';
import { PostFeed } from '@/components/PostFeed';
import CommentsModal from '@/components/CommentsModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import { FeedPost } from '@/constants/ImportTypes';
import { serverTimestamp } from 'firebase/firestore';
import LikesModal from '@/components/LikesModal';

export default function TabOneScreen() {
  const { posts, loading } = makeFeed('Home');
  const { refreshFlag } = useData();
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [post, setPost] = useState<FeedPost>({
    post_id: "", user_id: "", score: -1, list_type_id: "", profile_picture: "", first_name: "", last_name: "",
    num_comments: 0, likes: [], item_id: "", item_name: "", has_spoilers: false,
    created_at: serverTimestamp(), username: "", caption: "", poster_path: ""
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    
  }, [posts, refreshFlag, showComments])

  const handleComments = (show: boolean, commentPost: FeedPost) => {
    setShowComments(show);
    setPost(commentPost);
  }
  const handleLikes = (show: boolean, feedPost: FeedPost) => {
    setShowLikes(show);
    setPost(feedPost);
  }

  const keyExtractor = (item: FeedPost) => {
    // Ensure unique and correctly formatted keys
    if (item.score && (item.score >= 0 || item.score == -2)) {
      return `${item.user_id}/${item.item_id}`;
    } else {
      return `${item.user_id}/${item.post_id}`;
    }
  };

  return (
    <GestureHandlerRootView style={{width: '100%', height: '100%', backgroundColor: Colors[colorScheme ?? 'light'].background}}>
      {!loading ? (
        <>
          <FlatList
            data={posts}
            keyExtractor={keyExtractor}
            renderItem={({item, index}) => <PostFeed item={item} index={index} handleComments={handleComments} handleLikes={handleLikes} />}
          />
          <LikesModal post={post} onClose={() => setShowLikes(false)} visible={showLikes} redirectLink='/home'/>
          <CommentsModal post={post} onClose={() => setShowComments(false)} visible={showComments} redirectLink='/home'/>
        </>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </GestureHandlerRootView>
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
