import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Alert, TouchableOpacity, useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Themed';
import Colors from '@/constants/Colors';

const ImageUploader = ({changeImage}: { changeImage: (imgUri: string) => void}) => {
  const [image, setImage] = useState('');
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

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('No Image Selected', 'Please select an image first.');
      return;
    }

    try {
      const fileUri = image;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {

    } else {
        Alert.alert('File Not Found', 'The selected file does not exist.');
      }
    } catch (error) {
      Alert.alert('Upload Error');
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
                    <Ionicons name="add" size={25} color={Colors[colorScheme ?? 'light'].background}/>
                    <Text style={[styles.picText, { color: Colors[colorScheme ?? 'light'].background }]}>Add Picture</Text>
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
  },
});

export default ImageUploader;