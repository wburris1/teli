import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, RefreshControl, SafeAreaView } from 'react-native';
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
import { ExpandableText } from './AnimatedViews.tsx/ExpandableText';

const db = FIREBASE_DB;


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
  const { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment } = useModalState();
  const { user } = useAuth();
  const { following, setFollowing } = useData();
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileData, setProfileData] = useState<UserData>(emptyUser);
  const [followers, setFollowers] = useState<string[]>([]);
  const [followingUsers, setFollowingUsers] = useState<string[]>([])
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
        setFollowingUsers([]);
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
        setIsFollowing(following ? following.includes(userID) : false);
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
          setFollowingUsers(followingData);
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
    //setLoading(true);
    if (!user) return;
    if (isFollowing) {
        setIsFollowing(false);
        const newFollowers = followers.filter(id => id !== (user.uid || ''));
        setFollowers(newFollowers);
        unfollowFunc(userID).then(() => {
          //requestRefresh();
          setFollowing((following || []).filter(id => id !== (userID || '')));
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
        setIsFollowing(true);
        const newFollowers = [...followers, user?.uid || ''];
        setFollowers(newFollowers);
        followFunc(userID).then(() => {
            //requestRefresh();
            setFollowing([...(following || []), userID]);
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
  <>
    <PostFeedWithModals
          posts={posts}
          loading={false}
          post={post}
          showComments={showComments}
          showLikes={showLikes}
          handleComments={handleComments}
          handleLikes={handleLikes}
          setShowComments={setShowComments}
          setShowLikes={setShowLikes}
          redirectLink={redirectLink}
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          loadMorePosts={loadMorePosts}
          isLoadingMore={isLoadingMore}
          incrementComment={incrementComment}
          handleIncrementComment={handleIncrementComment}
          />
          {posts.length == 0 && (
            <View style={{justifyContent: 'flex-start', alignItems: 'center', flex: 1}}>
              <Text style={{fontSize: 20, color: 'gray'}}>{profileData.first_name} hasn't ranked anything yet</Text>
            </View>
          )}
        </>
  , [refreshFlag, posts, refreshing, loading, showLikes, showComments, post, isLoadingMore]);

  const listsTabContent = useCallback(() => 
    <>
        <View style={{flexDirection: 'row', marginBottom: 10, position: 'absolute', top: 47.5, right: 5, zIndex: 1, backgroundColor: 'transparent'}}>
            <TouchableOpacity onPress={() => setIsMovies(true)} style={[styles.listButton, { borderColor: isMovies ? Colors['theme'] : Colors[colorScheme ?? 'light'].text,
                backgroundColor: isMovies ? Colors['theme'] : Colors[colorScheme ?? 'light'].background}]}>
                <Text style={[styles.listButtonText, { 
                    color: isMovies ? Colors[colorScheme ?? 'light'].background : Colors[colorScheme ?? 'light'].text, fontWeight: isMovies ? '500' : '300',
                }]}>Movies</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsMovies(false)} style={[styles.listButton, { borderColor: !isMovies ? Colors['theme'] : Colors[colorScheme ?? 'light'].text,
                backgroundColor: !isMovies ? Colors['theme']: Colors[colorScheme ?? 'light'].background}]}>
                <Text style={[styles.listButtonText, { 
                    color: !isMovies ? Colors[colorScheme ?? 'light'].background : Colors[colorScheme ?? 'light'].text, fontWeight: !isMovies ? '500' : '300',
                }]}>Shows</Text>
            </TouchableOpacity>
        </View>
        <HorizontalListWithRows lists={isMovies ? movieLists : tvLists} listTypeID={isMovies ? Values.movieListsID : Values.tvListsID} isListTab={false} userID={userID} numRows={1} redirectLink={redirectLink} displayEmptyLists={false}/>
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
    <SafeAreaView style={styles.container}>
      {completeReRender ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors['loading']}/>
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
              <ActivityIndicator size="large" color={Colors['loading']}/>
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'flex-start',
              paddingHorizontal: 10,
              paddingBottom: 10,
              alignItems: 'flex-start',
            }}
          >
            <Image source={ profileData.profile_picture ? {uri: profileData.profile_picture,  cache: 'force-cache' } 
            : require('../assets/images/emptyprofilepic.jpg')}
              style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text }]}
            />
            <View>
            <Text style={styles.headerText}>{profileData.first_name + " " + profileData.last_name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', paddingTop: 3, justifyContent: user && user.uid ==  userID ? 'flex-start' : 'space-between'}}>
                    { user && user.uid != userID && 
                    <TouchableOpacity onPress={handleFollow}
                        style={[styles.followButton, {backgroundColor: isFollowing ? Colors['theme'] : 
                        Colors[colorScheme ?? 'light'].background, borderColor: isFollowing ? Colors[colorScheme ?? 'light'].background : 
                        Colors[colorScheme ?? 'light'].text,}]}>
                        <Ionicons name={isFollowing ? "checkmark-circle-outline" : "person-add-outline"} size={25}
                        color={isFollowing ? 'white' : Colors[colorScheme ?? 'light'].text} />
                        <Text style={{fontSize: 18, textAlign: 'center', paddingLeft: 5, fontWeight: '500',
                            color: isFollowing ? 'white' : Colors[colorScheme ?? 'light'].text}}>
                            {isFollowing ? "Followed" : "Follow"}
                        </Text>
                    </TouchableOpacity>}
                    <TouchableOpacity onPress={() => handleNavigate(0)}>
                    <View style={[styles.followContainer, {marginLeft: user && user.uid == userID ? 10 : 5}]}>
                        <Text style={styles.follow}>Followers</Text>
                        <Text style={styles.follow}>{followers.length}</Text>
                    </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleNavigate(1)}>
                    <View style={styles.followContainer}>
                        <Text style={styles.follow}>Following</Text>
                        <Text style={styles.follow}>{followingUsers.length}</Text>
                    </View>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
          {profileData.bio && <ExpandableText text={profileData.bio} maxHeight={80} startExpanded={false} textStyle={{paddingHorizontal: 10}} isDesc={true} />}
          <SearchTabs browse={false} tabs={tabs} onTabChange={() => {}} index={0} />
        </>
      )}
    </SafeAreaView>
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
    marginLeft: 10
  },
  follow: {
    fontSize: 16,
    fontWeight: '300',
  },
  profilePic: {
    width: 75,
    height: 75,
    aspectRatio: 1,
    borderRadius: 50,
    backgroundColor: 'gray',
  },
  listButton: {
    padding: 3,
    paddingHorizontal: 7,
    marginLeft: 10,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 20,
  },
  listButtonText: {
    fontSize: 16,
    fontWeight: '300',
  },
});

export default UserPage;