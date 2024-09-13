import { getUserData } from "@/components/Helpers/FetchFunctions";
import { PostScreen } from "@/components/PostScreen";
import { FeedPost, Post } from "@/constants/ImportTypes";
import { FIREBASE_DB } from "@/firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

const db = FIREBASE_DB;

export default function NavigationPost() {
    const { postID } = useLocalSearchParams();  
    const [post, setPost] = useState<any>();  
    
    useEffect(() => {
        fetchPost(postID as string);
    }, [])

    const fetchPost = async (postID: string) => {
        const postRef = doc(db, "globalPosts", postID);
        const docSnapshot = await getDoc(postRef);
        if (docSnapshot.exists()) {
          const userData = await getUserData(docSnapshot.data().user_id);
          setPost({
            id: docSnapshot.id,
            ...docSnapshot.data() as Post,
            ...userData
          })
        }
    }

    const display = useCallback(() => {
        return (
            <>
                {post && <PostScreen post={post as FeedPost} redirectLink="notification" />}
            </>
        )
    }, [post])

    return (display());
}