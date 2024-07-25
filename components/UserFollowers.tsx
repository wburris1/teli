import FollowerModalScreen from '@/app/(app)/(tabs)/(profile)/followers_page';
import { useLocalSearchParams } from 'expo-router';

export default function UserFollowerScreen() {
  const { userID } = useLocalSearchParams();
  console.log("here");

  return (
    <>
        {
            <FollowerModalScreen userID={userID as string} />
        }
    </>
  );
}

