import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import SearchInput from '@/components/Search/SearchInput';
import SearchTabs from '@/components/Search/SearchTabs';
import { useItemSearch } from '@/data/itemData';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { fetchUsers } from '@/data/searchUsers';
import { UsersListScreen } from '@/components/Search/UserSearchCard';
import { MoviesTabContent, ShowsTabContent } from '@/components/Search/SearchTabContent';
import { collection, getDocs } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';
import { fetchUserData } from '@/data/getComments';

const USERS_PAGE_SIZE = 10;

const UsersTabContent = ({ query }: { query: string }) => {
  const db = FIREBASE_DB;
  const {user} = useAuth();
    const [userList, setUserList] = useState<UserData[]>([]);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    
    const getUserData = useCallback(async () => {
      if (user) {
        const getUsers = async () => {
          const usersDoc = collection(db, 'users');
          const snapshot = await getDocs(usersDoc);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };
        const userIDs = await getUsers();
        const usersData = await Promise.all(userIDs.map(user => fetchUserData(user.id)));
        setAllUsers(usersData);
        setUserList(usersData);
      }
    }, [user]); 
  
    useEffect(() => {
      getUserData(); 
    }, [getUserData]);

    const filterUsers = useCallback(() => {
      const filteredUsers = allUsers.filter(user => {
        return user.first_name.toLowerCase().startsWith(query.toLowerCase()) ||
          user.last_name.toLowerCase().startsWith(query.toLowerCase()) ||
          user.username.toLowerCase().startsWith(query.toLowerCase());
      });
      setUserList(filteredUsers);
    }, [query, allUsers]); 
  
    useEffect(() => {
      filterUsers(); 
    }, [filterUsers]);

    const loadMoreUsers = async () => {
        if (loading) return;
        setLoading(true);
        const { users, lastDoc } = await fetchUsers(query, lastVisible);
        setUserList(prevUsers => [...prevUsers, ...users]);
        setLastVisible(lastDoc);
        setLoading(false);
    };

    // const debouncedFetchData = useCallback(
    //     _.debounce(async (query) => {
    //         setUserList([]);
    //         setLastVisible(null);
    //         const { users, lastDoc } = await fetchUsers(query, null);
    //         setUserList(users);
    //         setLastVisible(lastDoc);
    //     }, 300),
    //     []
    // );

    // useEffect(() => {
    //     if (query != "") {
    //         debouncedFetchData(query);
    //     } else {
    //         setUserList([]);
    //     }
    // }, [query, debouncedFetchData]);

    return (
        <View style={{ flex: 1 }}>
            <UsersListScreen users={userList} redirectPath='search_user' onClose={() => {}} />
            {loading && <Text>Loading...</Text>}
            {userList.length == USERS_PAGE_SIZE &&
            <TouchableOpacity onPress={loadMoreUsers} disabled={loading}>
                <Text>Load More</Text>
            </TouchableOpacity>}
        </View>
    );
}

export default function SearchScreen() {
    const colorScheme = useColorScheme();
    const [search, setSearch] = useState('');

    const moviesTabContent = useCallback(() => 
        <MoviesTabContent
            query={search} isAdding={false} addItems={[]} outItems={[]} setAddItems={() => {}} setOutItems={() => {}} listID=''
        />, [search]);
    const showsTabContent = useCallback(() => 
        <ShowsTabContent
            query={search} isAdding={false} addItems={[]} outItems={[]} setAddItems={() => {}} setOutItems={() => {}} listID=''
        />, [search]);
    const usersTabContent = useCallback(() => 
        <UsersTabContent 
            query={search}
        />, [search]);

    const searchTabs = [
        {
            title: 'Movies',
            content: moviesTabContent
        },
        {
            title: 'Shows',
            content: showsTabContent
        },
        {
            title: 'Users',
            content: usersTabContent
        },
    ];

    return (
        <View style={{ backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <SearchInput search={search} setSearch={setSearch} isFocused={false} />
                <SearchTabs tabs={searchTabs} onTabChange={() => {}} index={0} />
            </SafeAreaView>
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