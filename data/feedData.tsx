import { FeedPost, Post } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig"
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const db = FIREBASE_DB;

export const makeFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshFlag } = useData();

  const getFollowedUsers = async () => {
    if (!user) return [];

    const followedUsers: string[] = [];
    const followingCollectionRef = collection(db, 'users', user.uid, 'following');
    const followingSnapshot = await getDocs(followingCollectionRef);
  
    followingSnapshot.forEach((doc) => {
      followedUsers.push(doc.id);
    });
  
    return followedUsers;
  };

  const getRecentPosts = async (followedUsers: string[]): Promise<FeedPost[]> => {
    const fetchPostsFromCollection = async (userID: string, collectionName: string): Promise<FeedPost[]> => {
      const userDocRef = doc(db, 'users', userID);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        const userPostsCollectionRef = collectionName == 'posts' ? collection(db, 'users', userID, collectionName) :
            collection(db, "users", userID, collectionName, Values.seenListID, "items");
        const userPostsQuery = query(userPostsCollectionRef, orderBy('created_at', 'desc'), limit(10));
        const userPostsSnapshot = await getDocs(userPostsQuery);
  
        return userPostsSnapshot.docs.map((doc) => ({
          ...doc.data() as Post,
          user_id: userData.user_id,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_picture: userData.profile_picture,
        }));
      } else {
        return [];
      }
    };
  
    const promises = followedUsers.map(async (userID) => {
      const [userPosts, tvPosts, moviePosts] = await Promise.all([
        fetchPostsFromCollection(userID, 'posts'),
        fetchPostsFromCollection(userID, Values.tvListsID),
        fetchPostsFromCollection(userID, Values.movieListsID)
      ]);

      return [...userPosts, ...tvPosts, ...moviePosts];
    });
  
    const results = await Promise.all(promises);
    const posts = results.flat();
    posts.sort((a, b) => (b.created_at as any).toDate() - (a.created_at as any).toDate());
  
    return posts;
  };

  useEffect(() => {
    const fetchHomeFeed = async () => {
      if (user) {
        try {
          const followedUsers = await getFollowedUsers();
          const recentPosts = await getRecentPosts(followedUsers);
          recentPosts.sort((a, b) => (b.created_at as any).toDate() - (a.created_at as any).toDate());

          setPosts(recentPosts);
        } catch (error) {
          console.error('Error fetching home feed: ', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchHomeFeed();
  }, [user, refreshFlag]);

  return { posts, loading };
}