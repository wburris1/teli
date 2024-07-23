import { FeedPost, Post } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig"
import { QueryDocumentSnapshot, collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore";
import { useEffect, useState } from "react";

const db = FIREBASE_DB;

// input userID should be 'Home' if used for home feed.
export const makeFeed = (userID: string, pageSize: number) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const { refreshFlag } = useData();
  const [isLoadingMore, setIsLoadingMore] = useState(false);


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

  const getRecentPosts = async (followedUsers: string[], lastDoc: QueryDocumentSnapshot | null): Promise<FeedPost[]> => {
    const fetchPostsFromCollection = async (userID: string, collectionName: string, pageSize: number): Promise<FeedPost[]> => {
      const userDocRef = doc(db, 'users', userID);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        const userPostsCollectionRef = collectionName == 'posts' ? collection(db, 'users', userID, collectionName) :
            collection(db, "users", userID, collectionName, Values.seenListID, "items");
        let userPostsQuery = query(userPostsCollectionRef, orderBy('created_at', 'desc'), limit(pageSize));
        if (lastDoc) {
          userPostsQuery = query(userPostsQuery, startAfter(lastDoc));
        }
        
        const userPostsSnapshot = await getDocs(userPostsQuery);

        if (!userPostsSnapshot.empty) {
          setLastDoc(userPostsSnapshot.docs[userPostsSnapshot.docs.length - 1]);
        }
        
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
        fetchPostsFromCollection(userID, 'posts', pageSize),
        fetchPostsFromCollection(userID, Values.tvListsID, pageSize),
        fetchPostsFromCollection(userID, Values.movieListsID, pageSize)
      ]);
      console.log("User" + userPosts.length)
      console.log("tv" + tvPosts.length)
      console.log("move" + moviePosts.length)

      return [...userPosts, ...tvPosts, ...moviePosts];
    });
  
    const results = await Promise.all(promises);
    const posts = results.flat();
    posts.sort((a, b) => (b.created_at as any).toDate() - (a.created_at as any).toDate());
  
    return posts;
  };

  const loadMorePosts = async () => {
    if (!isLoadingMore && user) {
      setIsLoadingMore(true);
      try {
        const followedUsers = userID === 'Home' ? await getFollowedUsers() : [userID];
        const newPosts = await getRecentPosts(followedUsers, lastDoc);
        newPosts.sort((a, b) => (b.created_at as any).toDate() - (a.created_at as any).toDate());

        setPosts((prevPosts) => {
          console.log('Previous Posts IDs:');
          prevPosts.forEach(post => console.log(post.post_id));
  
          // Log the IDs of posts in newPosts
          console.log('New Posts IDs:');
          newPosts.forEach(post => console.log(post.post_id));
          return [...prevPosts, ...newPosts];
        })
      } catch (error) {
        console.error('Error loading more posts: ', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      if (user) {
        try {
          const followedUsers = userID === 'Home' ? await getFollowedUsers() : [userID];
          const recentPosts = await getRecentPosts(followedUsers, lastDoc);
          recentPosts.sort((a, b) => (b.created_at as any).toDate() - (a.created_at as any).toDate());

          setPosts(recentPosts);
        } catch (error) {
          console.error('Error fetching home feed: ', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFeed();
  }, [user, refreshFlag]);

  return { posts, loading, loadMorePosts, isLoadingMore};
}