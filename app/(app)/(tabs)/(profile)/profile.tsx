import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, Animated, LayoutAnimation, Pressable } from 'react-native';
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebaseConfig";
import { Timestamp, collection, doc, getDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { useData } from '@/contexts/dataContext';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Link, useNavigation } from 'expo-router';
import { FeedPost, Post } from '@/constants/ImportTypes';
import Values from '@/constants/Values';
import { ProfilePost } from '@/components/Post';
import { PostFeed } from '@/components/PostFeed';
import LikesModal from '@/components/LikesModal';
import CommentsModal from '@/components/CommentsModal';
import { makeFeed } from '@/data/feedData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';


const db = FIREBASE_DB;

const imgUrl = 'https://image.tmdb.org/t/p/w500';

const emptyUser = {
  user_id: "",
  email: "",
  username: "",
  first_name: "",
  last_name: "",
  followers: [],
  following: [],
  is_private: false,
  profile_picture: "/",
  created_at: "",
  bio: "",
}

const LogoutButton = () => {
  const colorScheme = useColorScheme();

  const doLogout = () => {
    FIREBASE_AUTH.signOut();
  };

  return (
    <TouchableOpacity onPress={doLogout}>
      <Ionicons name="log-out-outline" size={30} color={Colors[colorScheme ?? 'light'].text} />
    </TouchableOpacity>
  );
};

const ProfilePage = () => {
  const { showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, keyExtractor } = useModalState();
  const { user, userData } = useAuth();
  const [followers, setFollowers] = useState<{ id: string }[]>([]);
  const [following, setFollowing] = useState<{ id: string }[]>([]);
  const { posts } = makeFeed(user!.uid);
  // const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshFlag, refreshListFlag } = useData();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          const fetchUserPosts = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const postsCollectionRef = collection(userDocRef, 'posts');
            const postsQuery = query(postsCollectionRef);
            const postsSnapshot = await getDocs(postsQuery);
            return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchMoviesSeen = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const seenMoviesRef = collection(userDocRef, Values.movieListsID, Values.seenListID, 'items');
            const moviesSeenQuery = query(seenMoviesRef);
            const moviesSeenSnapshot = await getDocs(moviesSeenQuery);
            return moviesSeenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchMoviesBookmarked = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const bookmarkedMoviesRef = collection(userDocRef, Values.movieListsID, Values.bookmarkListID, 'items');
            const moviesBookmarkedQuery = query(bookmarkedMoviesRef);
            const moviesBookmarkedSnapshot = await getDocs(moviesBookmarkedQuery);
            return moviesBookmarkedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchTVSeen = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const seenTVRef = collection(userDocRef, Values.tvListsID, Values.seenListID, 'items');
            const tvSeenQuery = query(seenTVRef);
            const tvSeenSnapshot = await getDocs(tvSeenQuery);
            return tvSeenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchTVBookmarked = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const bookmarkedTVRef = collection(userDocRef, Values.tvListsID, Values.bookmarkListID, 'items');
            const tvBookmarkedQuery = query(bookmarkedTVRef);
            const tvBookmarkedSnapshot = await getDocs(tvBookmarkedQuery);
            return tvBookmarkedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchFollowers = async () => {
            const followersRef = collection(db, 'users', user.uid, 'followers');
            const snapshot = await getDocs(followersRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }

          const fetchFollowing = async () => {
            const followingRef = collection(db, 'users', user.uid, 'following');
            const snapshot = await getDocs(followingRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }

          // Run all operations concurrently
          const [
            postsData,
            moviesSeenData,
            moviesBookmarkedData,
            tvSeenData,
            tvBookmarkedData,
            followersData,
            followingData,
          ] = await Promise.all([
            fetchUserPosts(),
            fetchMoviesSeen(),
            fetchMoviesBookmarked(),
            fetchTVSeen(),
            fetchTVBookmarked(),
            fetchFollowers(),
            fetchFollowing(),
          ]);

          setFollowers(followersData);
          setFollowing(followingData);
          const combinedPosts = [
            ...postsData,
            ...moviesSeenData,
            ...moviesBookmarkedData,
            ...tvSeenData,
            ...tvBookmarkedData
          ];

          combinedPosts.sort((a, b) => {
            const dateA = (a.created_at as any).toDate();
            const dateB = (b.created_at as any).toDate();
            return dateB - dateA;
          });

          // setPosts(combinedPosts);
        } catch (error) {
          console.error("Error fetching profile data: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfileData();
  }, [user, refreshFlag, refreshListFlag]);

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

  return (
    <View style={styles.container}>
      {userData && (
        <>
          <View style={{width: '100%', alignItems: 'center'}}>
            <Text style={styles.username}>@{userData.username}</Text>
            <Image
              source={{ uri: userData.profile_picture }}
              style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text }]}
            />
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', padding: 10,}}>
            <View style={styles.followContainer}>
              <Text style={styles.follow}>Followers</Text>
              <Text style={styles.follow}>{followers.length}</Text>
            </View>
            <View style={styles.followContainer}>
              <Text style={styles.follow}>Following</Text>
              <Text style={styles.follow}>{following.length}</Text>
            </View>
          </View>
        </>
      )}
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
        redirectLink='/profile'
      />
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
});

export default ProfilePage;