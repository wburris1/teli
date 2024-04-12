import React, { useState } from 'react';
import { View, Text, Button, Modal, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams } from 'expo-router';
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    item: Item
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;

const Rank = ({item}: Props) => {
  return (
    <View style={styles.container}>
        <View style={styles.modalView}>
            <Image
                source={{ uri: imgUrl + item.poster_path }}
                style={styles.movieImage}
            />
            <Text style={styles.movieTitle}>{item.title}</Text>
        </View>

        <View style={styles.modalView2}>
            <Text style={styles.feedbackText}>Did you like it?</Text>
            <View style={styles.feedback}>
                <TouchableOpacity style={styles.feedbackButton}>
                    <Ionicons
                        name="checkmark-circle"
                        size={60}
                        color={'#00ff00'}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedbackButton}>
                    <Ionicons
                        name="remove-circle"
                        size={60}
                        color={'#d3d3d3'}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedbackButton}>
                    <Ionicons
                        name="close-circle"
                        size={60}
                        color={'#ff0000'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    padding: 10,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
    width: (screenWidth / 2.25) + 60,
  },
  modalView2: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackButton: {
    paddingHorizontal: 10,
  },
  feedbackText: {
    fontSize: 16,
    paddingBottom: 10
  },
  movieImage: {
    width: screenWidth / 2.25,
    aspectRatio: 1 / 1.5,
    marginTop: 15,
    borderRadius: 5,
    borderWidth: 0.5,
  },
  movieTitle: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    width: '100%',
    padding: 10,
    marginBottom: 10,
  },
});

export default Rank;