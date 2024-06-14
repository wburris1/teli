import { Post } from "@/constants/ImportTypes";
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_DB } from "@/firebaseConfig"
import { addDoc, collection, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const db = FIREBASE_DB;

export const MakePost = () => {
    const { user } = useAuth();

    async function makePost(caption: string, itemID: string, posterPath: string, itemName: string, hasSpoilers: boolean, listTypeID: string) {
        if (user) {
            var post: Post = {
                post_id: "",
                caption: caption,
                item_id: itemID,
                item_name: itemName,
                poster_path: posterPath,
                has_spoilers: hasSpoilers,
                list_type_id: listTypeID,
                comments: [],
                likes: [],
                score: -1,
                created_at: serverTimestamp(),
            }
            try {
                const userPostsRef = collection(db, 'users', user.uid, 'posts');
                const postRef = await addDoc(userPostsRef, post);
                updateDoc(postRef, { post_id: postRef.id });
                console.log("Post successfully added!");
            } catch (error) {
                console.error("Error adding post: ", error);
            }
        }
    }

    return makePost;
}