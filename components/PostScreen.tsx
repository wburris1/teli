import { FeedPost } from "@/constants/ImportTypes";
import { View } from "./Themed";
import { useColorScheme } from "react-native";
import { PostFeed } from "./PostFeed";
import useModalState from "./ModalState";
import CommentsModal from "./CommentsModal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState } from "react";
import LikesModal from "./LikesModal";
import Dimensions from "@/constants/Dimensions";

export const PostScreen = ({post, redirectLink}: { post: any, redirectLink: string }) => {
    const colorScheme = useColorScheme();
    const [incrementComment, setIncrementComment] = useState(false);
    const [showLikes, setShowLikes] = useState(false);

    const handleIncrementComment = () => {
        setIncrementComment((prev) => !prev);
    };

    const handleLikes = (show: boolean) => {
        setShowLikes(show);
    }

    return (
        <GestureHandlerRootView>
        <View style={{height: Dimensions.screenHeight}}>
            <PostFeed item={post} index={0} handleComments={() => {}} handleLikes={handleLikes} incrementComment={incrementComment}
                redirectLink={redirectLink} isPostPage={true} />
            <LikesModal post={post} onClose={() => handleLikes(false)} visible={showLikes} redirectLink={redirectLink} />
            <CommentsModal post={post} onClose={() => {}} visible={true} handleIncrementComment={handleIncrementComment} redirectLink={redirectLink} isPostPage={true}/>
        </View>
        </GestureHandlerRootView>
    )
}