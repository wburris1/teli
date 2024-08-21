import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import ItemScreen from '@/components/Search/SearchCard';
import SearchInput from '@/components/Search/SearchInput';
import SearchTabs from '@/components/Search/SearchTabs';
import { useItemSearch } from '@/data/itemData';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import _, { set } from 'lodash';
import Colors from '@/constants/Colors';
import { UsersListScreen } from '@/components/Search/UserSearchCard';
import { collection, getDocs } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';
import { fetchUserData } from '@/data/getComments';
import { useLocalSearchParams } from 'expo-router';
import { useTab } from '@/contexts/listContext';

//Time is too long to load


const FollowersTabContent = ({ userID, query, redirectLink, followersData, loading}: { userID: string, query: string, redirectLink: string, followersData: UserData[], loading: boolean }) => {
  const db = FIREBASE_DB;
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [allFollowers, setAllFollowers] = useState<UserData[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const FOLLOWERS_PAGE_SIZE = 10;

    const fetchFollowersData = useCallback(async () => {
      setAllFollowers(followersData);
      // if (user) {
      //   const fetchFollowerIDs = async () => {
      //     const followersRef = collection(db, 'users', userID, 'followers');
      //     const snapshot = await getDocs(followersRef);
      //     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
      //   };
      //   const followersID = await fetchFollowerIDs();
      //   const followersData = await Promise.all(followersID.map(follower => fetchUserData(follower.id)));
      //   setAllFollowers(followersData);
      //   const filteredFollowers = followersData.filter(user => {
      //     return user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
      //     user.last_name.toLowerCase().startsWith(query.toLowerCase()) || user.username.toLowerCase().startsWith(query.toLowerCase());
      //   })

      //   setFollowers(filteredFollowers);
      // };
  }, [userID, user]);

  const filterFollowers = useCallback(() => {
    setAllFollowers(followersData);
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
    if (loadingMore) return;
    setLoadingMore(true);
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
    setLoadingMore(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <UsersListScreen users={query ? followers : followersData} redirectPath={redirectLink + '_user'} />
          {followers.length === FOLLOWERS_PAGE_SIZE && (
            <TouchableOpacity onPress={loadMoreFollowers} disabled={loadingMore}>
              <Text>Load More</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
  
}


const FollowingTabContent = ({ userID, query, redirectLink, followingData, loading}: { userID: string, query: string, redirectLink: string, followingData: UserData[], loading: boolean }) => {
  const db = FIREBASE_DB;
  const { user } = useAuth();
  const [following, setFollowing] = useState<UserData[]>([]);
  const [allFollowing, setAllFollowing] = useState<UserData[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const FOLLOWERS_PAGE_SIZE = 10;
    const fetchFollowingData = useCallback(async () => {
      setAllFollowing(followingData);
      /* if (user) {
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
      } */
  }, [userID, user]);

  const filterFollowing = useCallback(() => {
    setAllFollowing(followingData);
    const filteredFollowing = allFollowing.filter(user => {
      return user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
          user.last_name.toLowerCase().startsWith(query.toLowerCase()) || user.username.toLowerCase().startsWith(query.toLowerCase());
    })
    setFollowing(filteredFollowing);
  }
  , [query, allFollowing]);

   useEffect(() => {
    fetchFollowingData();
  }, [fetchFollowingData]);

  useEffect(() => {
    filterFollowing();
  }, [filterFollowing]);


   const loadMoreFollowing = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
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
    setLoadingMore(false);
  };
  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <UsersListScreen users={query ? following : followingData} redirectPath={redirectLink + '_user'} />
          {following.length === FOLLOWERS_PAGE_SIZE && (
            <TouchableOpacity onPress={loadMoreFollowing} disabled={loadingMore}>
              <Text>Load More</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}



export default function FollowerModalScreen({ userID, redirectLink, whichTab}: { userID: string, redirectLink : string , whichTab : number}) {
  const colorScheme = useColorScheme();
  const [search , setSearch] = useState("");
  const [currentId , setCurrentId] = useState("");
  const { setActiveTab } = useTab();
  const { user } = useAuth();
  const db = FIREBASE_DB;
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);


  const getFollowers = useCallback(async () => {
  if (user) {
    setLoading(true); 
    const fetchFollowerIDs = async () => {
      const followersRef = collection(db, 'users', userID, 'followers');
      const snapshot = await getDocs(followersRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
    };
    const followersID = await fetchFollowerIDs();
    const followersData = await Promise.all(followersID.map(follower => fetchUserData(follower.id)));

    const fetchFollowingIDs = async () => {
      const followingRef = collection(db, 'users', userID, 'following');
      const snapshot = await getDocs(followingRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
    };
    const followingID = await fetchFollowingIDs();
    const followingData = await Promise.all(followingID.map(follower => fetchUserData(follower.id)));
    
    setLoading(false); 
    setFollowers(followersData);
    setFollowing(followingData);
    
  }}, [userID, user]);


 useEffect(() => {
  getFollowers();
 }, [getFollowers]);
  if (currentId != userID){
    setCurrentId(userID);
    
  }
  const followersTabContent = useCallback(() => 
  <FollowersTabContent 
  userID= {userID as string} 
  query={search}
  redirectLink= {redirectLink}
  followersData= {followers}
  loading= {loading}
  />, [search, currentId, followers]);

  const followingTabContent = useCallback(() =>
  <FollowingTabContent
  userID={userID as string}
  query={search}
  redirectLink= {redirectLink}
  followingData={following}
  loading={loading}
  />, [search, currentId, following]);


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