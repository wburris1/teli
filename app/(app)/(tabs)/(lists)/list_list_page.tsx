import { ListPage } from "@/components/ListPage";
import { useLocalSearchParams } from "expo-router";

export default function ListPageScreen() {
    const { listTypeID, listID, description, name, userID } = useLocalSearchParams();
    
    return (
      <ListPage listTypeID={listTypeID as string} listID={listID as string} description={description as string} name={name as string} userID={userID as string} redirectLink="/list" />
    )
}