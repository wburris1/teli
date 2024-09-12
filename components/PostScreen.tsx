import { FeedPost } from "@/constants/ImportTypes";
import { View } from "./Themed";
import { useColorScheme } from "react-native";

export const PostScreen = ({post}: { post: FeedPost }) => {
    const colorScheme = useColorScheme();
    
    return (
        <View>

        </View>
    )
}