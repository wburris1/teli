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
import { useTab } from '@/contexts/listContext';

//Time is too long to load


const FollowersTabContent = ({ userID, query, redirectLink}: { userID: string, query: string, redirectLink: string }) => {
  const db = FIREBASE_DB;
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [allFollowers, setAllFollowers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const FOLLOWERS_PAGE_SIZE = 10;

    const fetchFollowersData = useCallback(async () => {
      if (user) {
        const fetchFollowerIDs = async () => {
          const followersRef = collection(db, 'users', userID, 'followers');
          const snapshot = await getDocs(followersRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
        };
        const followersID = await fetchFollowerIDs();
        const followersData = await Promise.all(followersID.map(follower => fetchUserData(follower.id)));
        setAllFollowers(followersData);
        const filteredFollowers = followersData.filter(user => {
          return user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
          user.last_name.toLowerCase().startsWith(query.toLowerCase()) || user.username.toLowerCase().startsWith(query.toLowerCase());
        })

        setFollowers(filteredFollowers);
      };
  }, [userID, user]);

  const filterFollowers = useCallback(() => {
    const filteredFollowers = allFollowers.filter(user => {
      return user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
          user.last_name.toLowerCase().startsWith(query.toLowerCase()) || user.username.toLowerCase().startsWith(query.toLowerCase());
    })
    setFollowers(filteredFollowers);
  }
  , [query, allFollowers]);

  useEffect(() => {
    fetchFollowersData();
  }, [fetchFollowersData]);

  useEffect(() => {
    filterFollowers();
  }, [filterFollowers]);


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
        <UsersListScreen users={followers} redirectPath={redirectLink + '_user'} />
        {loading && <Text>Loading...</Text>}
        {followers.length == FOLLOWERS_PAGE_SIZE &&
        <TouchableOpacity onPress={loadMoreFollowers} disabled={loading}>
            <Text>Load More</Text>
        </TouchableOpacity>}
    </View>
  );
}


const FollowingTabContent = ({ userID, query, redirectLink }: { userID: string, query: string, redirectLink: string }) => {
  const db = FIREBASE_DB;
  const { user } = useAuth();
  const [following, setFollowing] = useState<UserData[]>([]);
  const [allFollowing, setAllFollowing] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const FOLLOWERS_PAGE_SIZE = 10;
    const fetchProfileData = useCallback(async () => {
      if (user) {
        const fetchFollowingIDs = async () => {
          const followingRef = collection(db, 'users', userID, 'following');
          const snapshot = await getDocs(followingRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
        };
        const followingID = await fetchFollowingIDs();
        const followingData = await Promise.all(followingID.map(following => fetchUserData(following.id)));
        setAllFollowing(followingData);
        const filteredFollowing = followingData.filter(user => {
          return user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
          user.last_name.toLowerCase().startsWith(query.toLowerCase()) || user.username.toLowerCase().startsWith(query.toLowerCase());
        });
        setFollowing(filteredFollowing);
      }
  }, [userID, user]);

  const filterFollowing = useCallback(() => {
    const filteredFollowing = allFollowing.filter(user => {
      return user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
          user.last_name.toLowerCase().startsWith(query.toLowerCase()) || user.username.toLowerCase().startsWith(query.toLowerCase());
    })
    setFollowing(filteredFollowing);
  }
  , [query, allFollowing]);

   useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    filterFollowing();
  }, [filterFollowing]);


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
        <UsersListScreen users={following} redirectPath={redirectLink + '_user'} />
        {loading && <Text>Loading...</Text>}
        {following.length == FOLLOWERS_PAGE_SIZE &&
        <TouchableOpacity onPress={loadMoreFollowing} disabled={loading}>
            <Text>Load More</Text>
        </TouchableOpacity>}
    </View>
  );
}



export default function FollowerModalScreen({ userID, redirectLink, whichTab}: { userID: string, redirectLink : string , whichTab : number}) {
  const colorScheme = useColorScheme();
  const [search , setSearch] = useState("");
  const [currentId , setCurrentId] = useState("");
  const { setActiveTab } = useTab();
  if (currentId != userID){
    setCurrentId(userID);
    
  }
  const followersTabContent = useCallback(() => 
  <FollowersTabContent 
  userID= {userID as string} 
  query={search}
  redirectLink= {redirectLink}
  />, [search, currentId]);

  const followingTabContent = useCallback(() =>
  <FollowingTabContent
  userID={userID as string}
  query={search}
  redirectLink= {redirectLink}
  />, [search, currentId]);


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
            <SearchTabs tabs={followingTabs} onTabChange={index => setActiveTab(index)} index= {whichTab} />
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