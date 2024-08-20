import UserPage from '@/components/UserPage';
import { useLocalSearchParams } from 'expo-router';

export default function UserPageScreen() {
  const { userID } = useLocalSearchParams();

  return (
    <>
        {userID as string && 
            <UserPage userID={userID as string} redirectLink={'search'}/>
        }
    </>
  );
}

