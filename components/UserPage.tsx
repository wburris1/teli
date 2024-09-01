import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, RefreshControl } from 'react-native';
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebaseConfig";
import { Timestamp, collection, doc, getDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { useData } from '@/contexts/dataContext';
import { Text, View } from '@/components/Themed';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { FeedPost, List, Post } from '@/constants/ImportTypes';
import Values from '@/constants/Values';
import SearchTabs from './Search/SearchTabs';
import Dimensions from '@/constants/Dimensions';
import { followUser, unfollowUser } from '@/data/followUser';
import { PostFeed } from './PostFeed';
import { makeFeed } from '@/data/feedData';
import LikesModal from './LikesModal';
import CommentsModal from './CommentsModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useModalState from './ModalState';
import Toast from 'react-native-toast-message';
import { HorizontalListWithRows } from './ListList';
import { useNavigation } from '@react-navigation/native';
import {RootStackParamList} from '@/constants/ImportTypes';
import { ScreenNavigationProp } from '@/constants/ImportTypes';
import { fetchUserData } from '@/data/getComments';
import { FetchFollowers, FetchFollowing, FetchMovieLists, FetchTVLists } from './Helpers/FetchFunctions';
import PostFeedWithModals from './PostFeedWithModals';

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
  userPushToken: '',
}

const UserPage = ({ userID, redirectLink}: {userID: string, redirectLink: string}) => {
  const { showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes } = useModalState();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileData, setProfileData] = useState<UserData>(emptyUser);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false);

  const { posts, loadMorePosts, isLoadingMore } = makeFeed(userID, refreshing, setRefreshing);

  const [movieLists, setMovieLists] = useState<List[]>([]);
  const [tvLists, setTVLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMovies, setIsMovies] = useState(true);
  const { refreshFlag, refreshListFlag } = useData();
  const navigation = useNavigation<ScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const followFunc = followUser();
  const unfollowFunc = unfollowUser();
  const { requestRefresh } = useData();
  const [completeReRender, setCompleteReRender] = useState(false);

  const [currentUserID, setCurrentUserID] = useState('');
  
  if (currentUserID != userID) {
    setCurrentUserID(userID);
  }
  
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    if (!refreshing) {
      setCompleteReRender(false);
    }
  }, [refreshing]);

  useEffect(() => {
    if (!loading) setLoading(true);
    setRefreshing(true);
    setCompleteReRender(true);

        // Trigger full reload when userID changes
        setProfileData(emptyUser);
        setFollowers([]);
        setFollowing([]);
        setMovieLists([]);
        setTVLists([]);
        setLoading(true);
    
        const fetchData = async () => {
          try {
            fetchCallback();
          } catch (error) {
            console.error("Error fetching profile data: ", error);
            setLoading(false);
          }
        };
    
        fetchData();
  }, [currentUserID])

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

  const fetchCallback = useCallback(() => {
    const fetchProfileData = async () => {
      if (userID) {
        try {
          // Run all operations concurrently
          const [
            userData,
            movieListsData,
            tvListsData,
            followersData,
            followingData,
          ] = await Promise.all([
            fetchUserData(userID),
            FetchMovieLists(userID),
            FetchTVLists(userID),
            FetchFollowers(userID),
            FetchFollowing(userID),
          ]);

          const reorderedTVLists = reorderData(tvListsData, Values.seenListID, Values.bookmarkListID);
          const reorderedMovieLists = reorderData(movieListsData, Values.seenListID, Values.bookmarkListID);
          setProfileData(userData);
          setFollowers(followersData);
          setFollowing(followingData);
          setMovieLists(reorderedMovieLists);
          setTVLists(reorderedTVLists);

          setLoading(false);
        } catch (error) {
          console.error("Error fetching profile data: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfileData();
  }, [refreshFlag, refreshListFlag, currentUserID])

  useEffect(() => {
    fetchCallback();
  }, [fetchCallback]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData.username,
      headerTitleStyle: {
        fontWeight: '400',
      },
    })
  })

  const handleFollow = () => {
    setLoading(true);
    if (isFollowing) {
        unfollowFunc(userID).then(() => {
          const newFollowers = followers.filter(id => id !== (user?.uid || ''));
          setFollowers(newFollowers);
          setIsFollowing(false);
          requestRefresh();
          setLoading(false);
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
        followFunc(userID, profileData.userPushToken).then(() => {
          const newFollowers = [...followers, user?.uid || ''];
          setFollowers(newFollowers);
            setIsFollowing(true);
            requestRefresh();
            setLoading(false);
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
  const handleRefresh = () => {
    setRefreshing(true);
  };

  const activityTabContent = useCallback(() => 
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
  , [refreshFlag, posts, refreshing, loading, showLikes, showComments, post, isLoadingMore]);

  const listsTabContent = useCallback(() => 
    <>
        <View style={{flexDirection: 'row', marginBottom: 10, position: 'absolute', top: 50, left: 5, zIndex: 1, backgroundColor: 'transparent'}}>
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
        <HorizontalListWithRows lists={isMovies ? movieLists : tvLists} listTypeID={isMovies ? Values.movieListsID : Values.tvListsID} isListTab={false} userID={userID} numRows={1} redirectLink={redirectLink}/>
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

  const handleNavigate = (whichTab: number) => {
    navigation.push((redirectLink + "_follower") as keyof RootStackParamList, {
      userID: userID,
      whichTab: whichTab,
    });
  };

  return (
    <View style={styles.container}>
      {completeReRender ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          {loading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                zIndex: 2,
              }}
            >
              <ActivityIndicator size="large" />
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'flex-start',
              padding: 10,
              alignItems: 'flex-start',
            }}
          >
            <Image
              source={{
                uri: profileData.profile_picture === '' ? undefined : profileData.profile_picture,
              }}
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
                    <TouchableOpacity onPress={() => handleNavigate(0)}>
                    <View style={styles.followContainer}>
                        <Text style={styles.follow}>Followers</Text>
                        <Text style={styles.follow}>{followers.length}</Text>
                    </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleNavigate(1)}>
                    <View style={styles.followContainer}>
                        <Text style={styles.follow}>Following</Text>
                        <Text style={styles.follow}>{following.length}</Text>
                    </View>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
          <SearchTabs tabs={tabs} onTabChange={() => {}} index={0} />
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