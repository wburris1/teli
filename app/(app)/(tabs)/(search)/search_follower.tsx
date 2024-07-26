import FollowerModalScreen from '@/app/(app)/(tabs)/(profile)/followers_page';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export default function UserFollowerScreen() {
  const { userID } = useLocalSearchParams();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '', // Set your custom title here
    });
  }, [navigation]);
  

  return (
    <>
        {
            <FollowerModalScreen userID={userID as string} redirectLink= '/search'/>
        }
    </>
  );
}

