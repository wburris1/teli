import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import { makeFeed } from '@/data/feedData';
import { useLayoutEffect, useState } from 'react';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import {  router, useNavigation } from 'expo-router';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { StartPostScreen } from '@/components/StartPost';

export default function TabOneScreen() {
  const { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment} = useModalState();
  const [refreshing, setRefreshing] = useState(false);
  const { posts, loading, loadMorePosts, isLoadingMore } = makeFeed('Home', refreshing, setRefreshing);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  
  const handleRefresh = () => {
    setRefreshing(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/start_post_page')} style={{borderRadius: 20, backgroundColor: Colors['theme'], paddingHorizontal: 10, paddingVertical: 5}}>
          <Text style={{fontSize: 16, fontWeight: '500', color: 'white'}}>Post</Text>
        </TouchableOpacity>
      ),
    })
  }, [colorScheme])

  return (
    <View style={styles.container}>
      {/* Show loading indicator while posts are being fetched */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors['loading']} />
      ) : posts && posts.length > 0 ? (
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
          redirectLink='home'
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          loadMorePosts={loadMorePosts}
          isLoadingMore={isLoadingMore}
          handleIncrementComment={handleIncrementComment}
          incrementComment={incrementComment}
          isHome={true}
        />
      ) : (
        <GestureHandlerRootView>
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors['loading']} colors={[Colors['loading']]}/>}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={80}
                color={Colors[colorScheme ?? 'light'].text}
              />
              <Text style={[styles.welcomeText, {color: Colors[colorScheme ?? 'light'].text},]}>Welcome to Take2</Text>
              <Text style={[styles.messageText, {color: Colors[colorScheme ?? 'light'].text},]}>Add friends to see their posts here</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  router.push({
                    pathname: '/search',
                    params: { initialIndex: 2, triggerNumber: Math.random()},
                  });
                }}
              >
                <Text style={styles.addButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </GestureHandlerRootView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: Colors['theme'], // Customize based on theme
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: Colors.light.text, // Adjust for your theme
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    color: Colors.light.text, // Adjust for your theme
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
