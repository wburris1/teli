import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import { makeFeed } from '@/data/feedData';
import { useState } from 'react';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import {  router } from 'expo-router';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

export default function TabOneScreen() {
  const { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment} = useModalState();
  const [refreshing, setRefreshing] = useState(false);
  const { posts, loading, loadMorePosts, isLoadingMore } = makeFeed('Home', refreshing, setRefreshing);
  const colorScheme = useColorScheme();
  
  const handleRefresh = () => {
    setRefreshing(true);
  };

  return (
    <View style={styles.container}>
      {/* Show loading indicator while posts are being fetched */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
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
        />
      ) : (
        <GestureHandlerRootView>
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={80}
                color={Colors[colorScheme ?? 'light'].text}
              />
              <Text style={styles.welcomeText}>Welcome to Take2</Text>
              <Text style={styles.messageText}>Add friends to see their posts here</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  router.push({
                    pathname: '/search',
                    params: { initialIndex: 2 },
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
    backgroundColor: Colors.light.tint, // Customize based on theme
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
