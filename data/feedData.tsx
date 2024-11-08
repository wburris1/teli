import { FeedPost, Post } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig"
import { DocumentSnapshot, collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { fetchUserData } from "./getComments";
import { LayoutAnimation, Platform, UIManager } from "react-native";

// TO DO IMPlement caching and smooth animation when adding posts. 

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const db = FIREBASE_DB;
const userCache = new Map<string, UserData>(); // Cache to locally store many ppl's userData

// input userID should be 'Home' if used for home feed.
export const makeFeed = (userID: string, refreshing: boolean, setRefreshing: (refreshing: boolean) => void, discussionItemID?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshFlag, following } = useData();
  const lastFetchedPost = useRef<DocumentSnapshot | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePost, setHasMorePost] = useState(true);
  const limitPosts = 5

  const loadMorePosts = async () => {
    if (!isLoadingMore && hasMorePost) {
      setIsLoadingMore(true);
      await fetchFeed();
    }
  };

  const fetchPosts = async (followedUsers: string[]): Promise<any[]> => {
      if (followedUsers.length == 0 && !discussionItemID) return [];
      const userPostsCollectionRef = collection(db, 'globalPosts');
      const shouldStartAfter = lastFetchedPost.current && !refreshing; // Combined condition
      const userPostsQuery = discussionItemID ? query(
        userPostsCollectionRef,
        orderBy('created_at', 'desc'),
        where('item_id', '==', discussionItemID),
        limit(limitPosts),
        ...(shouldStartAfter ? [startAfter(lastFetchedPost.current)] : [])
      ) : query(
        userPostsCollectionRef,
        orderBy('created_at', 'desc'),
        where('user_id', 'in', followedUsers),
        limit(limitPosts),
        ...(shouldStartAfter ? [startAfter(lastFetchedPost.current)] : [])
      );

      const userPostsSnapshot = await getDocs(userPostsQuery);

      if (!userPostsSnapshot.empty) {
        lastFetchedPost.current = userPostsSnapshot.docs[userPostsSnapshot.docs.length - 1];
      }
      if (userPostsSnapshot.docs.length < limitPosts) {
        console.log("End Reached: no more posts")
        setHasMorePost(false);
      }

      const allPosts = await Promise.all(userPostsSnapshot.docs.map(async (docSnapshot) => {
        const userData = await getUserData(docSnapshot.data().user_id);
        return {
          id: docSnapshot.id,
          ...docSnapshot.data() as Post,
          ...userData, // Combined user and post data in a single object
        };
      })); 
      return allPosts
  };
  const getUserData = async (userId: string): Promise<UserData> => {
    if (userCache.has(userId)) {
      return userCache.get(userId) as UserData; // Return cached data if available
    }
    const userData = await fetchUserData(userId)
    userCache.set(userId, userData); // Cache the fetched data
    return userData
  };

  const fetchFeed = async () => {
    if (user) {
      try {
        let newPosts = [];
        const followedUsers = userID === 'Home' ? following : [userID];
        if (discussionItemID) {
          newPosts = await fetchPosts(followedUsers ? followedUsers : []);
        } else if (followedUsers) {
          newPosts = await fetchPosts(followedUsers);
        } else {
          return;
        }

        if (refreshing) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPosts(newPosts);
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        }
      } catch (error) {
        console.error('Error fetching home feed: ', error);
      } finally {
        setRefreshing(false);
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
  };
  useEffect(() => {
    if (refreshing) {
      setHasMorePost(true);
      fetchFeed();
    }
  }, [user, refreshFlag, refreshing]);

  useEffect(() => {
    if (following) {
      fetchFeed();
    }
  }, [following]);
  
  return { posts, loading, loadMorePosts, isLoadingMore };
}