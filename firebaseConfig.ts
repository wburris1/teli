import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as firebaseAuth from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBjo95k6pnButMksxYdsRhjodJYePYjyw",
  authDomain: "teli-199a2.firebaseapp.com",
  projectId: "teli-199a2",
  storageBucket: "teli-199a2.appspot.com",
  messagingSenderId: "100563971742",
  appId: "1:100563971742:web:ea4d4cb4c922faf1bc158f"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

export const auth = firebaseAuth.initializeAuth(FIREBASE_APP, {
    persistence: reactNativePersistence(AsyncStorage),
});

export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_AUTH = firebaseAuth.getAuth(FIREBASE_APP);