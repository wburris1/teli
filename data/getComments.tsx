import { DisplayComment, FeedPost } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig"
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, startAfter, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const db = FIREBASE_DB;

export const fetchUserData = async (userID: string) => {
  const userDoc = await getDoc(doc(db, "users", userID));
  if (userDoc.exists()) {
    return userDoc.data() as UserData;
  } else {
    throw new Error(`User with ID ${userID} does not exist`);
  }
}

export const getUsersData = async (post: FeedPost) => {
    if (post.item_id == "" && post.post_id == "") return [];
    
    let commentRef = post.score >= 0 ? collection(db, "users", post.user_id, post.list_type_id, Values.seenListID, "items", post.item_id, "comments") :
    (post.score == -2 ?  collection(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id, "comments") :
        collection(db, "users", post.user_id, "posts", post.post_id, "comments"));

    const commentsSnapshot = await getDocs(commentRef);
    const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as DisplayComment }));
  
    const displayCommentsPromises = comments.map(async (comment) => {
        const userData = await fetchUserData(comment.user_id);
        return {
            comment_id: comment.id,
            user_id: comment.user_id,
            username: userData.username,
            profile_picture: userData.profile_picture,
            first_name: userData.first_name,
            last_name: userData.last_name,
            comment: comment.comment,
            likes: comment.likes,
            created_at: comment.created_at,
            num_replies: comment.num_replies,
        };
    });
    return await Promise.all(displayCommentsPromises);
}

export const getComments = (post: FeedPost) => {
  const { refreshFlag } = useData();
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || (!post.post_id && !post.item_id)) return;
    setLoaded(false);

    let commentRef;

    if (post.score >= 0) {
      commentRef = collection(db, 'globalPosts', post.post_id, 'comments');
    } else if (post.score === -2) {
      commentRef = collection(db, 'users', post.user_id, post.list_type_id, Values.bookmarkListID, 'items', post.item_id, 'comments');
    } else {
      commentRef = collection(db, 'globalPosts', post.post_id, 'comments');
    }

    const unsubscribe = async () => {
      const snapshot = await getDocs(commentRef);

      const commentsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() as DisplayComment }));
      commentsData.sort((a, b) => {
        const aDate = a.created_at instanceof Timestamp ? a.created_at.toDate() : a.created_at as any;
        const bDate = b.created_at instanceof Timestamp ? b.created_at.toDate() : b.created_at as any;
        return bDate - aDate;
      });
      setComments(commentsData);
      setLoaded(true);
    };

    unsubscribe();
  }, [post, user]);

  return { comments, loaded };
};
