import UserPage from '@/components/UserPage';
import { useLocalSearchParams } from 'expo-router';

export default function FollowerPageScreen() {
  const { userID } = useLocalSearchParams();

  return (
    <>
        {userID as string && 
            <UserPage userID={userID as string} redirectLink={'/profile'}/>
        }
    </>
  );
}

