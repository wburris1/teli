import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Alert, TouchableOpacity, useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Themed';
import Colors from '@/constants/Colors';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { FIREBASE_STORAGE } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';

export const uploadImage = async (userID: string, image: string) => {
  if (!image) return '';
  let downloadURL = '';

  try {
    const response = await fetch(image);
    const blob = await response.blob();

    const storageRef = ref(FIREBASE_STORAGE, `profile_pics/${userID}.jpg`);
    await uploadBytes(storageRef, blob);

    downloadURL = await getDownloadURL(storageRef);
  } catch (error: any) {
    Alert.alert('Upload Error', error.message);
  } finally {
    return downloadURL;
  }
}

const ImageUploader = ({changeImage, isSignUp = false}: { changeImage: (imgUri: string) => void, isSignUp?: boolean }) => {
  const {userData} = useAuth()
  const [image, setImage] = useState(isSignUp ? '' : userData?.profile_picture ?? '');
  
  const colorScheme = useColorScheme();

  const pickImage = async () => {
    // Ask for permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permissions to access your media library.');
      return;
    }

    // Pick an image from the media library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      changeImage(result.assets[0].uri);
    }
  };

  return (
    <> 
        <View style={{alignSelf: 'center', margin: 5}}>
            <TouchableOpacity onPress={pickImage}>
                <Image source={{ uri: image ? image : '/' }} style={styles.image} />
            </TouchableOpacity>
        </View>
        
        <View style={{alignSelf: 'center'}}>
            <TouchableOpacity onPress={pickImage}>
                <View style={[styles.picButton, { backgroundColor: Colors[colorScheme ?? 'light'].text }]}>
                    <Ionicons name={image ? "person-circle" : "add"} size={25} color={Colors[colorScheme ?? 'light'].background}/>
                    <Text style={[styles.picText, { color: Colors[colorScheme ?? 'light'].background }]}>{image ? "Edit Picture" : "Add Picture"}</Text>
                </View>
            </TouchableOpacity>
        </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: 100,
    aspectRatio: 1,
    backgroundColor: 'gray',
    borderRadius: 50,
    alignSelf: 'center',
  },
  picButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderRadius: 20,
    paddingVertical: 7,
    paddingRight: 10,
    paddingLeft: 7,
  },
  picText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 3,
  },
});

export default ImageUploader;