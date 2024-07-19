import { FlatList, StyleSheet, useColorScheme } from 'react-native';

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

export default function TabOneScreen() {
  const { posts, loading } = makeFeed();
  const { refreshFlag } = useData();
  const [showComments, setShowComments] = useState(false);
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

  return (
    <GestureHandlerRootView style={{width: '100%', height: '100%', backgroundColor: Colors[colorScheme ?? 'light'].background}}>
      <FlatList
        data={posts}
        keyExtractor={item => (item.score && (item.score >= 0 || item.score == -2)) ? item.item_id : item.post_id}
        renderItem={({item, index}) => <PostFeed item={item} index={index} handleComments={handleComments} />}
      />
      <CommentsModal post={post} onClose={() => setShowComments(false)} visible={showComments} />
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
