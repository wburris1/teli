import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import ItemScreen from '@/components/Search/SearchCard';
import SearchInput from '@/components/Search/SearchInput';
import SearchTabs from '@/components/Search/SearchTabs';
import { useItemSearch } from '@/data/itemData';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import _ from 'lodash';
import Colors from '@/constants/Colors';
import { UsersListScreen } from '@/components/Search/UserSearchCard';
import { collection, getDocs } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';
import { fetchUserData } from '@/data/getComments';
import { useLocalSearchParams } from 'expo-router';

//Time is too long to load


const FollowersTabContent = ({ userID, query }: { userID: string, query: string }) => {
  const db = FIREBASE_DB;
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const FOLLOWERS_PAGE_SIZE = 10;
  useEffect(() => {
    const fetchFollowersData = async () => {
      if (user) {
        const fetchFollowerIDs = async () => {
          const followersRef = collection(db, 'users', userID, 'followers');
          const snapshot = await getDocs(followersRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
        };
        const followersID = await fetchFollowerIDs();
        const followersData = await Promise.all(followersID.map(follower => fetchUserData(follower.id)));
        const filteredFollowers = followersData.filter(user => {
          return user.first_name.toLowerCase().includes(query.toLowerCase()) ||
          user.last_name.toLowerCase().includes(query.toLowerCase());
        })

        setFollowers(filteredFollowers);
      }
    };
    fetchFollowersData();
  }, [userID, query]);


  const loadMoreFollowers = async () => {
    if (loading) return;
    setLoading(true);
    const fetchProfileData = async () => {
      if (user) {
        const fetchFollowerIDs = async () => {
          const followersRef = collection(db, 'users', userID, 'followers');
          const snapshot = await getDocs(followersRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
        };
        const followersID = await fetchFollowerIDs();
        const followersData = await Promise.all(followersID.map(follower => fetchUserData(follower.id)));
        setFollowers(followersData);
      }
    };
    fetchProfileData();
    setLoading(false);
  };

  


  return (
    <View style={{ flex: 1 }}>
        <UsersListScreen users={followers} redirectPath='../searchFollower' />
        {loading && <Text>Loading...</Text>}
        {followers.length == FOLLOWERS_PAGE_SIZE &&
        <TouchableOpacity onPress={loadMoreFollowers} disabled={loading}>
            <Text>Load More</Text>
        </TouchableOpacity>}
    </View>
  );
}


const FollowingTabContent = ({ userID, query }: { userID: string, query: string }) => {
  const db = FIREBASE_DB;
  const { user } = useAuth();
  const [following, setFollowing] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const FOLLOWERS_PAGE_SIZE = 10;
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        const fetchFollowingIDs = async () => {
          const followingRef = collection(db, 'users', userID, 'following');
          const snapshot = await getDocs(followingRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
        };
        const followingID = await fetchFollowingIDs();
        const followingData = await Promise.all(followingID.map(following => fetchUserData(following.id)));
        const filteredFollowing = followingData.filter(user => {
          return user.first_name.toLowerCase().includes(query.toLowerCase()) ||
          user.last_name.toLowerCase().includes(query.toLowerCase())
        })
        setFollowing(filteredFollowing);
      }
    };
    fetchProfileData();
  }, [userID, query]);


   const loadMoreFollowing = async () => {
    if (loading) return;
    setLoading(true);
    const fetchProfileData = async () => {
      if (user) {
        const fetchFollowingIDs = async () => {
          const followingRef = collection(db, 'users', userID, 'following');
          const snapshot = await getDocs(followingRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
        };
        const followingID = await fetchFollowingIDs();
        const followingData = await Promise.all(followingID.map(following => fetchUserData(following.id)));
        setFollowing(followingData);
      }
    };
    fetchProfileData();
    setLoading(false);
  };
  return (
    <View style={{ flex: 1 }}>
        <UsersListScreen users={following} redirectPath='../searchFollower' />
        {loading && <Text>Loading...</Text>}
        {following.length == FOLLOWERS_PAGE_SIZE &&
        <TouchableOpacity onPress={loadMoreFollowing} disabled={loading}>
            <Text>Load More</Text>
        </TouchableOpacity>}
    </View>
  );
}



export default function FollowerModalScreen({ userID }: { userID: string }) {
  const colorScheme = useColorScheme();
  const [search , setSearch] = useState("");
 // const userID = useLocalSearchParams().userID;
  const followersTabContent = useCallback(() => 
  <FollowersTabContent 
  userID= {userID as string} 
  query={search}
  />, [search]);

  const followingTabContent = useCallback(() =>
  <FollowingTabContent
  userID={userID as string}
  query={search}
  />, [search]);


  const followingTabs = [
    {
        title: 'Followers',
        content: followersTabContent
    },
    {
        title: 'Following',
        content: followingTabContent
    },
  ];

  return (
    <View style={{ backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1 }}>
        <View style={styles.container}>
            <SearchInput search={search} setSearch={setSearch} isFocused={false} />
            <SearchTabs tabs={followingTabs} onTabChange={() => {}} />
        </View>
    </View>
);
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});