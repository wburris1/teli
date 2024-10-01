import FollowerModalScreen from '@/app/(app)/(tabs)/(profile)/followers_page';
import { useLocalSearchParams } from 'expo-router';

export default function UserFollowerScreen() {
  const { userID } = useLocalSearchParams();
  const { whichTab } = useLocalSearchParams();

  return (
    <>
        {
            <FollowerModalScreen userID={userID as string} redirectLink='list' whichTab={parseInt(whichTab as string)}/>
        }
    </>
  );
}

