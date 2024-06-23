import { FIREBASE_DB } from "@/firebaseConfig";
import { collection, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";

const USERS_PAGE_SIZE = 10;
const db = FIREBASE_DB;

export const fetchUsers = async (queryText: string, lastVisible: any) => {
  let usersQuery = query(
    collection(db, 'users'),
    where('username', '>=', queryText.toLowerCase()),
    //where('username', '<=', queryText.toLowerCase + '\uf8ff'),
    orderBy('username'),
    limit(USERS_PAGE_SIZE)
  );

  if (lastVisible) {
    usersQuery = query(usersQuery, startAfter(lastVisible));
  }

  const querySnapshot = await getDocs(usersQuery);
  const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserData }));
  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

  return { users, lastDoc };
};