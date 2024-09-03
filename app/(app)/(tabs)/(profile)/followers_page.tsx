import { ActivityIndicator, Image, LayoutAnimation, Platform, StyleSheet, TouchableOpacity, UIManager, useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import SearchInput from '@/components/Search/SearchInput';
import SearchTabs from '@/components/Search/SearchTabs';
import { useItemSearch } from '@/data/itemData';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const useFetchFollowerFollowing = (userID: string) => {
  const db = FIREBASE_DB;

  // Refactored function to fetch user data by collection name
  const fetchUserDataByCollection = async (collectionName: string) => {
    const ref = collection(db, 'users', userID, collectionName);
    const snapshot = await getDocs(ref);
    const userData = await Promise.all(snapshot.docs.map(doc => fetchUserData(doc.id)));
    return userData;
  };

  // Consolidated data fetching logic for followers and following
  return useCallback(async () => {
    const [followers, following] = await Promise.all([
      fetchUserDataByCollection('followers'),
      fetchUserDataByCollection('following'),
    ]);

    return { followers, following };
  }, [userID]);
};

const FollowersTabContent = ({ query, redirectLink, followersData, loading}: { userID: string, query: string, redirectLink: string, followersData: UserData[], loading: boolean }) => {
  const [loadingMore, setLoadingMore] = useState(false);
  const FOLLOWERS_PAGE_SIZE = 10;

  const filteredFollowers = useMemo(() => {
    return followersData.filter(user =>
      user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
      user.last_name.toLowerCase().startsWith(query.toLowerCase()) ||
      user.username.toLowerCase().startsWith(query.toLowerCase())
    );
  }, [query, followersData]);


  const loadMoreFollowers = useCallback(async () => {
    // Placeholder for load more logic if required in the future
    console.log("loading more followers")
  }, [followersData]);

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <UsersListScreen users={query ? filteredFollowers : followersData} redirectPath={redirectLink + '_user'} />
          {followersData.length === FOLLOWERS_PAGE_SIZE && (
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


  // Memoized filtering of following to avoid unnecessary calculations
  const filteredFollowing = useMemo(() => {
    return followingData.filter(user =>
      user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
      user.last_name.toLowerCase().startsWith(query.toLowerCase()) ||
      user.username.toLowerCase().startsWith(query.toLowerCase())
    );
  }, [query, followingData]);

  const loadMoreFollowing = useCallback(async () => {
    // Placeholder for load more logic if required in the future
  }, [followingData]);


  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <UsersListScreen users={query ? filteredFollowing : followingData} redirectPath={redirectLink + '_user'} />
          {followingData.length === FOLLOWERS_PAGE_SIZE && (
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

  const fetchData = useFetchFollowerFollowing(userID);

  const getFollowersAndFollowing = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const { followers, following } = await fetchData();
        setLoading(false);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFollowers(followers);
        setFollowing(following);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    }
  }, [fetchData, user]);

  useEffect(() => {
    getFollowersAndFollowing();
  }, [getFollowersAndFollowing]);

  if (currentId !== userID) {
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