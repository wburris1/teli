import { PostScreen } from "@/components/PostScreen";
import { FeedPost } from "@/constants/ImportTypes";
import { useLocalSearchParams } from "expo-router";

export default function NavigationPost() {
    const params = useLocalSearchParams();
    const post = params.post ? JSON.parse(params.post as string) : null;

    console.log(post as FeedPost);
    return (
        <>
            {post && <PostScreen post={post as FeedPost} />}
        </>
    )
}