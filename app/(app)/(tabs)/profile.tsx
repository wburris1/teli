import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, Image, Platform, UIManager, Animated, LayoutAnimation, Pressable } from 'react-native';
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebaseConfig";
import { Timestamp, collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { useData } from '@/contexts/dataContext';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useNavigation } from 'expo-router';
import { FeedPost, Post } from '@/constants/ImportTypes';
import Values from '@/constants/Values';
import { ProfilePost } from '@/components/Post';

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
    <TouchableOpacity onPress={doLogout} style={{ marginRight: 10 }}>
      <Ionicons name="log-out-outline" size={30} color={Colors[colorScheme ?? 'light'].text} />
    </TouchableOpacity>
  );
};

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserData>(emptyUser);
  const [followers, setFollowers] = useState<{ id: string }[]>([]);
  const [following, setFollowing] = useState<{ id: string }[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
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
          const fetchUserProfile = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            return userDoc.data() as UserData;
          };

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
            userData,
            postsData,
            moviesSeenData,
            moviesBookmarkedData,
            tvSeenData,
            tvBookmarkedData,
            followersData,
            followingData,
          ] = await Promise.all([
            fetchUserProfile(),
            fetchUserPosts(),
            fetchMoviesSeen(),
            fetchMoviesBookmarked(),
            fetchTVSeen(),
            fetchTVBookmarked(),
            fetchFollowers(),
            fetchFollowing(),
          ]);

          setProfileData(userData);
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

          setPosts(combinedPosts);
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
      title: profileData.first_name + " " + profileData.last_name,
      headerRight: () => <LogoutButton />,
      headerTitleStyle: {
        fontSize: 22,
        fontWeight: 'bold',
      },
    })
  })

  return (
    <View style={styles.container}>
      {profileData && (
        <>
          <View style={{width: '100%', alignItems: 'center'}}>
            <Text style={styles.username}>@{profileData.username}</Text>
            <Image
              source={{ uri: profileData.profile_picture }}
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

      <FlatList
        data={posts}
        keyExtractor={item => (item.score && (item.score >= 0 || item.score == -2)) ? item.item_id : item.post_id}
        renderItem={({item, index}) => <ProfilePost item={item} index={index} name="You"/>}
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