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
import Dimensions from '@/constants/Dimensions';
import { Post } from '@/constants/ImportTypes';
import { format } from "date-fns";
import { LinearGradient } from 'expo-linear-gradient';
import { getDataLocally } from '@/data/userLocalData';
import Values from '@/constants/Values';

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

          // Run all operations concurrently
          const [
            userData,
            postsData,
            moviesSeenData,
            moviesBookmarkedData,
            tvSeenData,
            tvBookmarkedData
          ] = await Promise.all([
            fetchUserProfile(),
            fetchUserPosts(),
            fetchMoviesSeen(),
            fetchMoviesBookmarked(),
            fetchTVSeen(),
            fetchTVBookmarked()
          ]);

          setProfileData(userData);
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

  const RenderItem = ({item, index}: {item: Post, index: number}) => {
    const timestamp = item.created_at;
    const date = timestamp as Timestamp ? (timestamp as Timestamp).toDate() : new Date();
    const formattedDate = format(date, 'PP');
    const [isExpanded, setIsExpanded] = useState(false);
    const [captionHeight, setCaptionHeight] = useState<number | null>(null);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const maxCaptionHeight = (item.score && (item.score == -2 || item.score >= 0)) ? 65 : 80;

    useEffect(() => {
      if (captionHeight !== null) {
        if (isExpanded) {
          Animated.timing(animatedHeight, {
            toValue: captionHeight,
            duration: 300,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(animatedHeight, {
            toValue: maxCaptionHeight,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      }
    }, [isExpanded, captionHeight]);

    const toggleExpanded = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(!isExpanded);
    };

    const onTextLayout = (e: any) => {
      if (captionHeight === null) {
        setCaptionHeight(e.nativeEvent.layout.height);
      }
    };

    const animatedStyle = {
      height: captionHeight !== null ? animatedHeight : null,
    };

    return (
      <View style={[styles.postContainer, {borderColor: Colors[colorScheme ?? 'light'].text}]} key={item.post_id}>
        <View style={{flexDirection: 'row'}}>
          <Image
            source={{ uri: imgUrl + item.poster_path }}
            style={[styles.itemImage, { borderColor: Colors[colorScheme ?? 'light'].text }]}
          />
          <View style={{justifyContent: 'space-between'}}>
            <View>
              <View style={{flexDirection: 'row',}}>
                <View>
                  {(item.score >= 0 || item.score == -2) && 
                  <Text style={{fontSize: 14, fontWeight: '300'}}>
                    {item.score == -2 ? "You bookmarked" : "You ranked"}
                  </Text>}
                  <Text numberOfLines={1} style={{fontSize: 17, fontWeight: '600', marginBottom: 3, width: Dimensions.screenWidth - 125}}>
                    {item.item_name}
                  </Text>
                </View>
                <TouchableOpacity style={{paddingLeft: 5}}>
                  <Ionicons name="ellipsis-horizontal" size={25} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row',}}>
                {item.score >= 0 && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
                  </View>
                )}
                <Pressable onPress={() => {
                    if (captionHeight && captionHeight > maxCaptionHeight) {
                      toggleExpanded();
                    }
                  }}>
                  <Animated.View style={animatedStyle}>
                    <Text style={[styles.caption, { marginRight: (!item.score || item.score < 0) ? 80 : 125 }]} onLayout={onTextLayout}>
                      {item.caption}
                    </Text>
                  </Animated.View>
                  {!isExpanded && captionHeight && captionHeight > maxCaptionHeight && (
                    <LinearGradient
                      colors={[colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent', Colors[colorScheme ?? 'light'].background]}
                      style={styles.gradient}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.postFooter}>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={{alignItems: 'center', paddingTop: 5, paddingRight: 15, flexDirection: 'row'}}>
              <Ionicons name="heart" size={30} color={Colors[colorScheme ?? 'light'].text} style={{paddingRight: 3}} />
              <View>
                <Text style={{fontSize: 14, fontWeight: '300'}}>Likes</Text>
                <Text style={{fontSize: 14, fontWeight: '500'}}>{item.likes.length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{alignItems: 'center', paddingTop: 5, paddingRight: 5, flexDirection: 'row'}}>
              <Ionicons name="chatbubble-ellipses" size={30} color={Colors[colorScheme ?? 'light'].text} style={{paddingRight: 3}}/>
              <View>
                <Text style={{fontSize: 14, fontWeight: '300'}}>Comments</Text>
                <Text style={{fontSize: 14, fontWeight: '500'}}>{item.comments.length}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={{fontSize: 14, fontWeight: '200', alignSelf: 'flex-end'}}>{formattedDate}</Text>
        </View>
      </View>
    )
  }

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
              <Text style={styles.follow}>{profileData.followers.length}</Text>
            </View>
            <View style={styles.followContainer}>
              <Text style={styles.follow}>Following</Text>
              <Text style={styles.follow}>{profileData.following.length}</Text>
            </View>
          </View>
        </>
      )}

      <FlatList
        data={posts}
        keyExtractor={item => item.score >= 0 ? item.post_id : item.item_id}
        renderItem={({item, index}) => <RenderItem item={item} index={index} />}
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
  postFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    color: 'gray',
  },
  caption: {
    fontSize: 16,
    fontWeight: '300',
  },
  followContainer: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  follow: {
    fontSize: 18,
    fontWeight: '300',
  },
  postContainer: {
    padding: 10,
    borderBottomWidth: 1,
  },
  itemImage: {
    width: 70,
    aspectRatio: 2/3,
    borderRadius: 10,
    marginRight: 7,
    borderWidth: 0.5,
  },
  profilePic: {
    width: 100,
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
    marginVertical: 10,
    backgroundColor: 'gray',
  },
  scoreContainer: {
    width: 40,
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    marginTop: 5,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '500',
  },
});

export default ProfilePage;