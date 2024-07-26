import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, Animated, LayoutAnimation, Pressable } from 'react-native';
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebaseConfig";
import { Timestamp, collection, doc, getDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { useData } from '@/contexts/dataContext';
import { Text, View } from '@/components/Themed';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Link, useLocalSearchParams, useNavigation } from 'expo-router';
import { FeedPost, Post } from '@/constants/ImportTypes';
import Values from '@/constants/Values';
import { ProfilePost } from '@/components/Post';
import SearchTabs from './Search/SearchTabs';
import { UserList } from './UserList';
import Dimensions from '@/constants/Dimensions';
import { followUser, unfollowUser } from '@/data/followUser';
import { useLoading } from '@/contexts/loading';
import { PostFeed } from './PostFeed';
import { makeFeed } from '@/data/feedData';
import LikesModal from './LikesModal';
import CommentsModal from './CommentsModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useModalState from './ModalState';
import Toast from 'react-native-toast-message';

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

const UserPage = ({ userID, redirectLink}: {userID: string, redirectLink: string}) => {
  const { showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, keyExtractor } = useModalState();

  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileData, setProfileData] = useState<UserData>(emptyUser);
  const [followers, setFollowers] = useState<{ id: string }[]>([]);
  const [following, setFollowing] = useState<{ id: string }[]>([]);
  // const [posts, setPosts] = useState<Post[]>([]);
  const { posts } = makeFeed(userID);
  

  const [movieLists, setMovieLists] = useState<List[]>([]);
  const [tvLists, setTVLists] = useState<List[]>([]);
  const { loading, setLoading } = useLoading();
  const [isMovies, setIsMovies] = useState(true);
  const { refreshFlag, refreshListFlag } = useData();
  const [numMoviesRanked, setNumMoviesRanked] = useState(0);
  const [numTVRanked, setNumTVRanked] = useState(0);
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const followFunc = followUser();
  const unfollowFunc = unfollowUser();
  const { requestRefresh } = useData();

  const [currentUserID, setCurrentUserID] = useState('');
  
  if (currentUserID != userID) {
    setCurrentUserID(userID);
  }
  
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const reorderData = (data: List[], firstId: string, secondId: string) => {
    const firstItem = data.find(item => item.list_id === firstId);
    const secondItem = data.find(item => item.list_id === secondId);
    const restItems = data.filter(item => item.list_id !== firstId && item.list_id !== secondId);
    if (!firstItem || !secondItem) {
      return data;
    }
    return [firstItem, secondItem, ...restItems];
  };

  useEffect(() => {
    const checkIfFollowing = async () => {
      if (user && userID) {
        const followingDocRef = doc(db, 'users', user.uid, 'following', userID);
        const docSnap = await getDoc(followingDocRef);
        setIsFollowing(docSnap.exists());
      }
    };

    checkIfFollowing();
  }, [user, userID]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (userID) {
        setLoading(true);
        try {
          const fetchUserProfile = async () => {
            const userDocRef = doc(db, 'users', userID);
            const userDoc = await getDoc(userDocRef);
            return userDoc.data() as UserData;
          };

          const fetchUserPosts = async () => {
            const userDocRef = doc(db, 'users', userID);
            const postsCollectionRef = collection(userDocRef, 'posts');
            const postsQuery = query(postsCollectionRef);
            const postsSnapshot = await getDocs(postsQuery);
            return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchMoviesSeen = async () => {
            const userDocRef = doc(db, 'users', userID);
            const seenMoviesRef = collection(userDocRef, Values.movieListsID, Values.seenListID, 'items');
            const moviesSeenQuery = query(seenMoviesRef);
            const moviesSeenSnapshot = await getDocs(moviesSeenQuery);
            return moviesSeenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchMoviesBookmarked = async () => {
            const userDocRef = doc(db, 'users', userID);
            const bookmarkedMoviesRef = collection(userDocRef, Values.movieListsID, Values.bookmarkListID, 'items');
            const moviesBookmarkedQuery = query(bookmarkedMoviesRef);
            const moviesBookmarkedSnapshot = await getDocs(moviesBookmarkedQuery);
            return moviesBookmarkedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchTVSeen = async () => {
            const userDocRef = doc(db, 'users', userID);
            const seenTVRef = collection(userDocRef, Values.tvListsID, Values.seenListID, 'items');
            const tvSeenQuery = query(seenTVRef);
            const tvSeenSnapshot = await getDocs(tvSeenQuery);
            return tvSeenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchTVBookmarked = async () => {
            const userDocRef = doc(db, 'users', userID);
            const bookmarkedTVRef = collection(userDocRef, Values.tvListsID, Values.bookmarkListID, 'items');
            const tvBookmarkedQuery = query(bookmarkedTVRef);
            const tvBookmarkedSnapshot = await getDocs(tvBookmarkedQuery);
            return tvBookmarkedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));
          };

          const fetchMovieLists = async () => {
            const userDocRef = doc(db, 'users', userID);
            const movieListsRef = collection(userDocRef, Values.movieListsID);
            const movieListsQuery = query(movieListsRef);
            const snapshot = await getDocs(movieListsQuery);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
          }

          const fetchTVLists = async () => {
            const userDocRef = doc(db, 'users', userID);
            const tvListsRef = collection(userDocRef, Values.tvListsID);
            const tvListsQuery = query(tvListsRef);
            const snapshot = await getDocs(tvListsQuery);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
          }

          const fetchFollowers = async () => {
            const followersRef = collection(db, 'users', userID, 'followers');
            const snapshot = await getDocs(followersRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }

          const fetchFollowing = async () => {
            const followingRef = collection(db, 'users', userID, 'following');
            const snapshot = await getDocs(followingRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }

          // Run all operations concurrently
          const [
            userData,
            postsData,
            moviesSeenData,
            moviesBookmarkedData,
            tvSeenData,
            tvBookmarkedData,
            movieListsData,
            tvListsData,
            followersData,
            followingData,
          ] = await Promise.all([
            fetchUserProfile(),
            fetchUserPosts(),
            fetchMoviesSeen(),
            fetchMoviesBookmarked(),
            fetchTVSeen(),
            fetchTVBookmarked(),
            fetchMovieLists(),
            fetchTVLists(),
            fetchFollowers(),
            fetchFollowing(),
          ]);

          const reorderedTVLists = reorderData(tvListsData, Values.seenListID, Values.bookmarkListID);
          const reorderedMovieLists = reorderData(movieListsData, Values.seenListID, Values.bookmarkListID);
          setProfileData(userData);
          setFollowers(followersData);
          setFollowing(followingData);
          setMovieLists(reorderedMovieLists);
          setTVLists(reorderedTVLists);
          setNumMoviesRanked(movieListsData.length);
          setNumTVRanked(tvListsData.length);
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
          setLoading(false);
        } catch (error) {
          console.error("Error fetching profile data: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfileData();
  }, [refreshFlag, refreshListFlag, currentUserID]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData.username,
      headerTitleStyle: {
        fontWeight: '400',
      },
    })
  })

  const handleFollow = () => {
    if (isFollowing) {
        unfollowFunc(userID).then(() => {
            setIsFollowing(false);
            requestRefresh();
            Toast.show({
              type: 'info',
              text1: "Unfollowed " + profileData.first_name,
              text2:  "You unfollowed " + profileData.username,
              position: "bottom",
              visibilityTime: 3000,
              bottomOffset: 100
            });
        })

    } else {
        followFunc(userID).then(() => {
            setIsFollowing(true);
            requestRefresh();
            Toast.show({
              type: 'info',
              text1: "Followed " + profileData.first_name,
              text2:  "You are now following " + profileData.username,
              position: "bottom",
              visibilityTime: 3000,
              bottomOffset: 100
            });
        })
    }
  }

  const activityTabContent = useCallback(() => 
    <GestureHandlerRootView style={{width: '100%', height: '100%', backgroundColor: Colors[colorScheme ?? 'light'].background}}>
      {!loading ? (
        <>
          <FlatList
            data={posts}
            keyExtractor={keyExtractor}
            renderItem={({item, index}) => <PostFeed item={item} index={index} handleComments={handleComments} handleLikes={handleLikes} redirectLink={redirectLink} />}
          />
          <LikesModal post={post} onClose={() => setShowLikes(false)} visible={showLikes} redirectLink='/user'/>
          <CommentsModal post={post} onClose={() => setShowComments(false)} visible={showComments} redirectLink='/user'/>
        </>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </GestureHandlerRootView>
  , [refreshFlag, posts]);

  const listsTabContent = useCallback(() => 
    <>
        <View style={{flexDirection: 'row', marginBottom: 10, position: 'absolute', top: 45, left: 5, zIndex: 1, backgroundColor: 'transparent'}}>
            <TouchableOpacity onPress={() => setIsMovies(true)} style={[styles.listButton, { borderColor: Colors[colorScheme ?? 'light'].text,
                backgroundColor: isMovies ? Colors[colorScheme ?? 'light'].text : Colors[colorScheme ?? 'light'].background}]}>
                <Text style={[styles.listButtonText, { 
                    color: isMovies ? Colors[colorScheme ?? 'light'].background : Colors[colorScheme ?? 'light'].text, fontWeight: isMovies ? '500' : '300',
                }]}>Movies</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsMovies(false)} style={[styles.listButton, { borderColor: Colors[colorScheme ?? 'light'].text,
                backgroundColor: !isMovies ? Colors[colorScheme ?? 'light'].text : Colors[colorScheme ?? 'light'].background}]}>
                <Text style={[styles.listButtonText, { 
                    color: !isMovies ? Colors[colorScheme ?? 'light'].background : Colors[colorScheme ?? 'light'].text, fontWeight: !isMovies ? '500' : '300',
                }]}>Shows</Text>
            </TouchableOpacity>
        </View>
        <FlatList
            key={'_'}
            data={isMovies ? movieLists : tvLists}
            keyExtractor={item => '_' + item.list_id}
            renderItem={({item, index}) => <UserList list={item} listTypeID={isMovies ? Values.movieListsID : Values.tvListsID} isListTab={false} userID={userID} index={index} />}
            numColumns={3}
        />
    </>
  , [refreshFlag, movieLists, isMovies]);

  const tabs = [
    {
        title: 'Activity',
        content: activityTabContent
    },
    {
        title: 'Lists',
        content: listsTabContent
    },
  ];

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" />
        </View>
      ) :  (
        <>
          <View style={{flexDirection: 'row', width: '100%', justifyContent: 'flex-start', padding: 10, alignItems: 'flex-start'}}>
            <Image
              source={{ uri: profileData.profile_picture }}
              style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text }]}
            />
            <View>
                <Text style={styles.headerText}>{profileData.first_name + " " + profileData.last_name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', paddingTop: 3,}}>
                    { user && user.uid != userID && 
                    <TouchableOpacity onPress={handleFollow}
                        style={[styles.followButton, {backgroundColor: isFollowing ? Colors[colorScheme ?? 'light'].text : 
                        Colors[colorScheme ?? 'light'].background}]}>
                        <Ionicons name={isFollowing ? "checkmark-circle-outline" : "person-add-outline"} size={25}
                        color={isFollowing ? Colors[colorScheme ?? 'light'].background : Colors[colorScheme ?? 'light'].text} />
                        <Text style={{fontSize: 18, textAlign: 'center', paddingLeft: 5, fontWeight: '500',
                            color: isFollowing ? Colors[colorScheme ?? 'light'].background : Colors[colorScheme ?? 'light'].text}}>
                            {isFollowing ? "Followed" : "Follow"}
                        </Text>
                    </TouchableOpacity>}
                    <Link href={{pathname: redirectLink + "_follower", params: { userID: userID, whichTab: 0}}}>
                    <View style={styles.followContainer}>
                        <Text style={styles.follow}>Followers</Text>
                        <Text style={styles.follow}>{followers.length}</Text>
                    </View>
                    </Link>
                    <Link href={{pathname: redirectLink + "_follower", params: { userID: userID, whichTab: 1}}}>
                    <View style={styles.followContainer}>
                        <Text style={styles.follow}>Following</Text>
                        <Text style={styles.follow}>{following.length}</Text>
                    </View>
                    </Link>
                </View>
            </View>
          </View>
      <SearchTabs tabs={tabs} onTabChange={() => {}} index={0} />
      </>)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    color: 'gray',
  },
  followButton: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followContainer: {
    alignItems: 'center',
  },
  follow: {
    fontSize: 16,
    fontWeight: '300',
    marginHorizontal: 10,
  },
  profilePic: {
    width: 75,
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
    backgroundColor: 'gray',
  },
  listButton: {
    padding: 5,
    paddingHorizontal: 7,
    marginLeft: 10,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 20,
  },
  listButtonText: {
    fontSize: 17,
    fontWeight: '300',
  },
});

export default UserPage;