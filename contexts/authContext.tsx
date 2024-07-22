import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    userData: null,
    setUserData: () => {},
});

type AuthContextType = {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    userData: UserData | null;
    setUserData: (user: UserData | null) => void;
};

type Props = {
    children: ReactNode;
}

export const AuthProvider = ({ children } : Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        const userDoc = doc(FIREBASE_DB, 'users', userId);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as UserData;
          setUserData(userData);
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
      }
    };

    if (user) {
      fetchUserData(user.uid);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, userData, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);