import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, Animated, LayoutAnimation, Pressable, Alert, Modal, SafeAreaView } from 'react-native';

import { useAuth } from "@/contexts/authContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebaseConfig";
import { Timestamp, collection, doc, getDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { useData } from '@/contexts/dataContext';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Link, useLocalSearchParams} from 'expo-router';
import { Post, RootStackParamList, UserMovie } from '@/constants/ImportTypes';
import Values from '@/constants/Values';
import { makeFeed } from '@/data/feedData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useModalState from '@/components/ModalState';
import PostFeedWithModals from '@/components/PostFeedWithModals';
import { useNavigation } from '@react-navigation/native';
import { ScreenNavigationProp } from '@/constants/ImportTypes';
import { ExpandableText } from '@/components/AnimatedViews.tsx/ExpandableText';

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
  const { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment } = useModalState();
  const {user, userData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { posts, loadMorePosts, isLoadingMore} = makeFeed(user ? user.uid : '', refreshing, setRefreshing);
  const [loading, setLoading] = useState(true);
  const { followers, following } = useData();
  const navigation = useNavigation<ScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const [numMovies, setNumMovies] = useState(0);
  const [numShows, setNumShows] = useState(0);
  const {movies, shows} = useData();
  const [totalMovieRuntime, setTotalMovieRuntime] = useState(0);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    if (movies) {
      const watchedMovies = movies.filter(movie => movie.lists.includes(Values.seenListID));
      const totalRuntime = movies.reduce((acc, movie) => {
        const runtime = movie.runtime;
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
      headerRight: () => <LogoutButton />,
      headerLeft: () => (
        <Link href={{ pathname: '/edit_profile' }} asChild>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pencil" size={25} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        </Link>
      ),
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '500',
      },
    })
  })  
  // Set loading to false once posts are loaded
  useEffect(() => {
    if (posts) {
      setLoading(false);
    }
  }, [posts]);

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
      {userData && (
      <View style={{borderBottomWidth: 1, borderColor: Colors[colorScheme ?? 'light'].text}}>
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
          style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text,  }]}
        />
        <View>
        <Text style={styles.headerText}>{userData.first_name + " " + userData.last_name}</Text>
            <View style={{flexDirection: 'row', paddingTop: 3}}>
                  <TouchableOpacity onPress={() => handleNavigate(0)}>
                    <View style={styles.followContainer}>
                      <Text style={styles.follow}>Followers</Text>
                      <Text style={styles.follow}>{followers.length}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleNavigate(1)}>
                    <View style={styles.followContainer}>
                      <Text style={styles.follow}>Following</Text>
                      {following && <Text style={styles.follow}>{following.length}</Text>}
                    </View>
                  </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{flexDirection: 'row', paddingBottom: 10, justifyContent: 'space-between', paddingHorizontal: 10}}>
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
        </View>
        {userData.bio && <ExpandableText text={userData.bio} maxHeight={80} startExpanded={false} textStyle={{paddingHorizontal: 10, paddingBottom: 10}} isDesc={true} />}
      </View>
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
          isLoadingMore={isLoadingMore}
          incrementComment={incrementComment}
          handleIncrementComment={handleIncrementComment}
          />
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
    fontSize: 18,
    fontWeight: '300',
  },
  profilePic: {
    width: 75,
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
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
  },
  statText: {
    fontSize: 14,
    fontWeight: '400'
  },
  statNum: {
    fontSize: 14,
    fontWeight: '500'
  }
});

export default ProfilePage;