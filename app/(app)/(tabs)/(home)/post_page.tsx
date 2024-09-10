import { WritePost } from "@/components/WritePost";
import { useLocalSearchParams } from "expo-router";

export default function PostScreen() {
    const { id, poster, name, groupKey } = useLocalSearchParams();

    return (
        <WritePost id={id as string} name={name as string} poster={poster as string}
        groupKey={groupKey as string} isHome={true} onClose={() => {}}/>
    )
}