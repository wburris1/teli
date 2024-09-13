import { WritePost } from "@/components/WritePost";
import { useLocalSearchParams } from "expo-router";

export default function PostScreen() {
    const { id, poster, name, backdrop, runtime, groupKey } = useLocalSearchParams();

    return (
        <WritePost id={id as string} name={name as string} poster={poster as string}
        groupKey={groupKey as string} isHome={true} onClose={() => {}} backdrop={backdrop as string} runtime={Number(runtime)}/>
    )
}