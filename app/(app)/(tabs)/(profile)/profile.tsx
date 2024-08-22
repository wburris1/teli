import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, Animated, LayoutAnimation, Pressable, Alert, Modal } from 'react-native';

import { useAuth } from "@/contexts/authContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebaseConfig";
import { Timestamp, collection, doc, getDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { useData } from '@/contexts/dataContext';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Link, useLocalSearchParams} from 'expo-router';
import { Post, RootStackParamList } from '@/constants/ImportTypes';
import Values from '@/constants/Values';
import { makeFeed } from '@/data/feedData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';
import { useNavigation } from '@react-navigation/native';
import { ScreenNavigationProp } from '@/constants/ImportTypes';
import { FetchFollowers, FetchFollowing } from '@/components/Helpers/FetchFunctions';

const db = FIREBASE_DB;

const LogoutButton = () => {
  const colorScheme = useColorScheme();

  const confirmLogout = () => {
    Alert.alert('Log Out?', 'Are you sure you want to Log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'Log Out', onPress: () => FIREBASE_AUTH.signOut()},
    ]);
    
  };
  

  return (
    <TouchableOpacity onPress={confirmLogout}>
      <Ionicons name="log-out-outline" size={30} color={Colors[colorScheme ?? 'light'].text} />
    </TouchableOpacity>
  );
};

const ProfilePage = () => {
  const { showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes } = useModalState();
  const {user, userData } = useAuth();
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { posts, loadMorePosts, isLoadingMore} = makeFeed(user ? user.uid : '', refreshing, setRefreshing);
  const [loading, setLoading] = useState(true);
  const { refreshFlag, refreshListFlag } = useData();
  const navigation = useNavigation<ScreenNavigationProp>();
  const colorScheme = useColorScheme();

  const handleRefresh = () => {
    setRefreshing(true);
  };

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: userData ? userData.first_name + " " + userData.last_name : '',
      headerRight: () => <LogoutButton />,
      headerLeft: () => (
        <Link href={{ pathname: '/edit_profile' }} asChild>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pencil" size={25} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        </Link>
      ),
      headerTitleStyle: {
        fontSize: 22,
        fontWeight: 'bold',
      },
    })
  })  
  // Set loading to false once posts are loaded
  useEffect(() => {
    if (posts.length > 0) {
      setLoading(false);
    }
  }, [posts]);

  useEffect(() => {
    if (user) {
      const updateFollowFollowers = async() => {
        const newFollowers = await FetchFollowers(user.uid)
        const newFollowing = await FetchFollowing(user.uid)
        setFollowers(newFollowers)
        setFollowing(newFollowing)
      }
      updateFollowFollowers();
    }
   
  }, [refreshing, user])

  const handleNavigate = (whichTab: number) => {
    navigation.push('profile_follower' as keyof RootStackParamList, {
      userID: user ? user.uid : "",
      whichTab: whichTab
    });
  };

  return (
    <View style={styles.container}>
      {userData && (
        <>
          <View style={{width: '100%', alignItems: 'center'}}>
            <Text style={styles.username}>@{userData.username}</Text>
            <Image
              source={{ uri: userData.profile_picture || undefined }}
              style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text }]}
            />
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', padding: 10,}}>
          <TouchableOpacity onPress={() => handleNavigate(0)}>
          <View style={styles.followContainer}>
            <View style={{flexDirection: 'column', alignItems: 'center'}}>
              <Text style={styles.follow}>Followers</Text>
              <Text style={styles.follow}>{followers.length}</Text>
              </View>
              </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigate(1)}>
                <View style={styles.followContainer}>
                  <View style={{flexDirection: 'column', alignItems: 'center'}}>
                <Text style={styles.follow}>Following</Text>
                <Text style={styles.follow}>{following.length}</Text>
                </View>
              </View>
              </TouchableOpacity>
          </View>
        </>
      )}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
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
          redirectLink='profile'
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          loadMorePosts={loadMorePosts}
          isLoadingMore={isLoadingMore}/>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    color: 'gray',
  },
  followContainer: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  follow: {
    fontSize: 18,
    fontWeight: '300',
  },
  profilePic: {
    width: 100,
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
    marginVertical: 10,
    backgroundColor: 'gray',
  },
  linkStyle: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
});

export default ProfilePage;