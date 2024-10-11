import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, Animated, LayoutAnimation, Pressable, Alert, SafeAreaView, ScrollView } from 'react-native';
import Modal from 'react-native-modal';

import { useAuth } from "@/contexts/authContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebaseConfig";
import { Timestamp, collection, doc, getDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { useData } from '@/contexts/dataContext';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Link, useLocalSearchParams, useRouter} from 'expo-router';
import { Post, RootStackParamList, UserMovie, UserShow } from '@/constants/ImportTypes';
import Values from '@/constants/Values';
import { makeFeed } from '@/data/feedData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';
import { useNavigation } from '@react-navigation/native';
import { ScreenNavigationProp } from '@/constants/ImportTypes';
import { ExpandableText } from '@/components/AnimatedViews.tsx/ExpandableText';
import Dimensions from '@/constants/Dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import Spinner from 'react-native-loading-spinner-overlay';

const db = FIREBASE_DB;

const ProfilePage = () => {
  const { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment } = useModalState();
  const {user, userData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { posts, loadMorePosts, isLoadingMore, loading} = makeFeed(user ? user.uid : '', refreshing, setRefreshing);
  const { followers, following, setFollowing, setFollowers } = useData();
  const router = useRouter();
  const navigation = useNavigation<ScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const [numMovies, setNumMovies] = useState(0);
  const [numShows, setNumShows] = useState(0);
  const {movies, shows} = useData();
  const [totalMovieRuntime, setTotalMovieRuntime] = useState(0);
  const [totalShowWatchtime, setTotalShowWatchtime] = useState(0);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [loadLogout, setLoadLogout] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const confirmLogout = () => {
    Alert.alert('Log Out?', 'Are you sure you want to Log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'Log Out', onPress: async () => {
        setLoadLogout(true); // Show loader
        try {
          await FIREBASE_AUTH.signOut();
          setFollowing(undefined);
          setFollowers([]);
        } catch (error) {
          console.error('Error signing out: ', error);
        } finally {
          setLoadLogout(false); // Hide loader after logout process is done
        }
      }, },
    ]);
  };

  useEffect(() => {
    if (movies) {
      const watchedMovies = movies.filter(movie => movie.lists.includes(Values.seenListID));
      const totalRuntime = movies.reduce((acc, movie) => {
        const movieItem = movie as UserMovie;
        const runtime = movieItem.runtime;
        return acc + (typeof runtime === 'number' ? runtime : 0);
      }, 0);
      setTotalMovieRuntime(totalRuntime);
      setNumMovies(watchedMovies.length);
    }
    if (shows) {
      const watchedShows = shows.filter(show => show.lists.includes(Values.seenListID));
      setNumShows(watchedShows.length);
    }
  }, [movies, shows])

  // following use effect gets the total movie run time should we make this a context? 
  /* useEffect(() => {
    // fetch total run time 
    const getRunTime = async () => {
      if (user) {
        const moviesRef = collection(db, 'users', user.uid, 'movies');
        const querySnapshot = await getDocs(moviesRef);

        // Return 0 if no movies are found
        if (querySnapshot.empty) return 0;

        // Use reduce to sum the runtimes of all movies
        const totalRuntime = querySnapshot.docs.reduce((acc, doc) => {
          const runtime = doc.data()?.runtime;
          return acc + (typeof runtime === 'number' ? runtime : 0);
        }, 0);
        console.log('Total Movie Watch Time is:', totalRuntime)
      }
    }
    getRunTime();
  },[user]); */

  useLayoutEffect(() => {
    navigation.setOptions({
      title: userData ? userData.username: '',
      headerRight: () =>
      <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="menu" size={30} color={Colors[colorScheme ?? 'light'].text} />
      </TouchableOpacity>,
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '500',
      },
    })
  }, [user, userData])

  const handleNavigate = (whichTab: number) => {
    navigation.push('profile_follower' as keyof RootStackParamList, {
      userID: user ? user.uid : "",
      whichTab: whichTab
    });
  };

  const convertRunTime = (runTime: number) => {
    return runTime < 60 ? 
    `${runTime}m` : 
    `${Math.floor(runTime / 60)}h ${runTime % 60}m`
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
      <Modal
        isVisible={settingsModalVisible}
        onBackdropPress={() => setSettingsModalVisible(false)} // Close on backdrop press
        animationIn="slideInRight"
        animationOut="slideOutRight"
        swipeDirection="right" // Enable swipe to close
        onSwipeComplete={() => setSettingsModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end', alignItems: 'flex-end' }}
      >
        <SafeAreaView style={{width: Dimensions.screenWidth * 0.75, height: Dimensions.screenHeight, backgroundColor: Colors[colorScheme ?? 'light'].background}}>
          <Spinner visible={loadLogout} color={Colors['loading']} />
          <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, justifyContent: 'flex-start', paddingBottom: 10}}>
            <Text style={{alignSelf: 'center', fontSize: 22, fontWeight: '600'}}>Menu</Text>
          </View>
          <Link href={{ pathname: '/edit_profile' }} style={[styles.settingsButton, { borderColor: Colors[colorScheme ?? 'light'].gray }]} asChild>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Ionicons name="pencil" size={30} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={styles.settingsButtonText}>Edit Profile</Text>
              <Text></Text>
            </TouchableOpacity>
          </Link>
          <Link href={{ pathname: '/credits' }} style={[styles.settingsButton, { borderColor: Colors[colorScheme ?? 'light'].gray }]} asChild>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Ionicons name="information-circle" size={30} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={styles.settingsButtonText}>Credits</Text>
              <Text></Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity onPress={confirmLogout} style={[styles.settingsButton, { borderColor: Colors[colorScheme ?? 'light'].gray, borderBottomWidth: 1 }]}>
            <Ionicons name="log-out-outline" size={30} color='red' />
            <Text style={[styles.settingsButtonText, {color: 'red'}]}>Logout</Text>
            <Text></Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {userData && (
      <View>
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
        <Image
          source={userData.profile_picture
            ? { uri: userData.profile_picture }  // Remote image
            : require('../../../../assets/images/emptyprofilepic.jpg') // Local image
            }  
          style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text, borderWidth: 0}]}
        />
        <View>
          <Text style={styles.headerText}>{userData.first_name + " " + userData.last_name}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', paddingTop: 3, justifyContent: 'space-between'}}> 
            <Link href={{ pathname: '/edit_profile' }} style={[styles.editButton, {backgroundColor: Colors['theme']}]} asChild>
              <TouchableOpacity>
                  <Text style={{fontSize: 18, textAlign: 'center', fontWeight: '500',
                      color: 'white'}}>
                        Edit Profile
                  </Text>
              </TouchableOpacity>
            </Link>
            {following && followers && <>
            <TouchableOpacity onPress={() => handleNavigate(0)}>
            <View style={[styles.followContainer, {marginLeft: 5}]}>
                <Text style={styles.follow}>Followers</Text>
                <Text style={styles.follow}>{followers.length}</Text>
            </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigate(1)}>
            <View style={styles.followContainer}>
                <Text style={styles.follow}>Following</Text>
                <Text style={styles.follow}>{following.length}</Text>
            </View>
            </TouchableOpacity></>}
          </View>
        </View>
        </View>
        <ScrollView horizontal style={{flexDirection: 'row', paddingBottom: 10, paddingHorizontal: 10}} showsHorizontalScrollIndicator={false}>
          <View style={[styles.statContainer, {backgroundColor: Colors[colorScheme ?? 'light'].gray, borderRadius: 10}]}>
            <Text style={styles.statText}>Movies Watched</Text>
            <Text style={styles.statNum}>{numMovies}</Text>
          </View>
          <View style={[styles.statContainer, {backgroundColor: Colors[colorScheme ?? 'light'].gray, borderRadius: 10}]}>
            <Text style={styles.statText}>Shows Watched</Text>
            <Text style={styles.statNum}>{numShows}</Text>
          </View>
          <View style={[styles.statContainer, {backgroundColor: Colors[colorScheme ?? 'light'].gray, borderRadius: 10}]}>
            <Text style={styles.statText}>Movie Watchtime</Text>
            <Text style={styles.statNum}>{convertRunTime(totalMovieRuntime)}</Text>
          </View>
        </ScrollView>
        {userData.bio && <ExpandableText text={userData.bio} maxHeight={80} startExpanded={false} textStyle={{paddingHorizontal: 10, paddingBottom: 10}} isDesc={true} />}
      </View>
      )}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors['loading']}/>
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
          isLoadingMore={isLoadingMore}
          incrementComment={incrementComment}
          handleIncrementComment={handleIncrementComment}
          isHome={true}
          />
          {posts.length == 0 && (
            <View style={{justifyContent: 'flex-start', alignItems: 'center', flex: 1}}>
              <Text style={{fontSize: 20, color: 'gray'}}>You haven't ranked anything yet</Text>
              <TouchableOpacity onPress={() => router.push('/search')} style={{padding: 10, borderRadius: 25, backgroundColor: Colors['theme'], margin: 10, flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="search" size={30} color='white' />
                <Text style={{fontSize: 20, color: 'white', paddingLeft: 5}}>Search</Text>
              </TouchableOpacity>
            </View>
          )}
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    color: 'gray',
    paddingHorizontal: 10,
    paddingBottom: 5
  },
  followContainer: {
    alignItems: 'center',
    paddingRight: 10
  },
  follow: {
    fontSize: 16,
    fontWeight: '300',
  },
  profilePic: {
    width: 75,
    aspectRatio: 1,
    borderRadius: 50,
    backgroundColor: 'gray',
    marginRight: 10
  },
  linkStyle: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
  statContainer: {
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 3,
    marginRight: 10
  },
  statText: {
    fontSize: 14,
    fontWeight: '400'
  },
  statNum: {
    fontSize: 14,
    fontWeight: '500'
  },
  settingsButton: {
    width: '100%',
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  settingsButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfilePage;