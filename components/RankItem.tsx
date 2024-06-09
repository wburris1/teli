import React, { useEffect, useState } from 'react';
import { View, Button, Modal, StyleSheet, Image, TextInput, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams } from 'expo-router';
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/authContext';
import Colors from '@/constants/Colors';
import { useData } from '@/contexts/dataContext';
import { useUserItemsSeenSearch } from '@/data/userData';
import Values from '@/constants/Values';
import { getDataLocally, storeDataLocally } from '@/data/userLocalData';
import { getAuth } from 'firebase/auth';
import { useUserAdjustScores } from '@/data/itemScores';
import { AddToDatabase } from '@/data/addItem';
import { Text } from './Themed';

type Props = {
    item: Item,
    items: UserItem[],
    isDupe: boolean,
    setDupe: (dupe: boolean) => void,
    onClose: () => void,
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;

const initialLikeScore = 6;
const initialMehScore = 5;
const initialDislikeScore = 4;
const smallAssNumber = 0.0000001; // Used to make mid inclusive of 4 and 6 scores

const Rank = ({item, items, isDupe, setDupe, onClose}: Props) => {
  const { user } = useAuth();
  const isMovie = 'title' in item ? true : false;
  //const items = isMovie ? movies : shows;
  const listID = Values.seenListID;
  const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;

  //const [isDupe, setDupe] = useState(true);
  const { requestRefresh } = useData();
  const [compItem, setCompItem] = useState<UserItem | null>(null);
  const colorScheme = useColorScheme();
  const [upperScore, setUpperScore] = useState(0);
  const [lowerScore, setLowerScore] = useState(0);
  //const adjustScoreFunc = useUserAdjustScores();
  //const [items, setItems] = useState<UserItem[]>([]);
  //const { items, loaded } = useUserItemsSeenSearch(listID, listTypeID);
  const { refreshListFlag, refreshFlag, requestListRefresh } = useData();
  const addToDB = AddToDatabase();

  const getNext = (minScore: number, maxScore: number) => {
    if (items) {
      const newItems = items.filter(filterItem => filterItem.score > minScore && 
        filterItem.score < maxScore && filterItem.item_id != item.id);
      const count = newItems.length;
  
      if (count > 0) {
        const randIndex = Math.floor(Math.random() * count);
        return newItems[randIndex];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  const handleFeedback = async (minScore: number, maxScore: number, initialScore: number) => {
    setLowerScore(minScore);
    setUpperScore(maxScore);

    const newItem = getNext(minScore, maxScore);
    if (newItem) {
      setCompItem(newItem);
    } else {
      const newScore = initialScore;
      addToDB(newScore, item, listID, isMovie, isDupe, items || []).then(() => {
        setDupe(true);
        onClose();
        requestRefresh();
        console.log("Item added!");
      }).catch(error => {
        console.error("Failed to add item:", error);
      });
    }
  }

  const handleComp = async (minScore: number, maxScore: number) => {
    setLowerScore(minScore);
    setUpperScore(maxScore);

    if (minScore == maxScore) {
      addToDB(minScore, item, listID, isMovie, isDupe, items).then(() => {
        setDupe(true);
        onClose();
        requestRefresh();
        console.log("Item added! No score adjust necessary");
      }).catch(error => {
        console.error("Failed to add item:", error);
      });
    } else {
      const newItem = getNext(minScore, maxScore);

      if (newItem) {
        setCompItem(newItem);
      } else {
        const newScore = maxScore - smallAssNumber;
        addToDB(newScore, item, listID, isMovie, isDupe, items).then(addItem => {
          if (addItem) {
            setDupe(true);
            onClose();
            requestRefresh();
            console.log("Item added!");
          }
        }).catch(error => {
          console.error("Failed to add item:", error);
        });
      }
    }
  }

  return (
    <>
      {item &&
        <BlurView intensity={100} style={styles.blurContainer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Ionicons
              name="close-circle"
              size={45}
              color={Colors[colorScheme ?? 'light'].background}
            />
          </TouchableOpacity>

          <View style={styles.container}>
            <View style={[styles.modalView, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
              <Image
                source={{ uri: imgUrl + item.poster_path }}
                style={[styles.movieImage, {borderColor: Colors[colorScheme ?? 'light'].text}]}
              />
              <Text style={styles.movieTitle}>{item.title}</Text>
            </View>

            <View style={[styles.modalView, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
              {!compItem && (
                <>
                  <Text style={styles.feedbackText}>Did you like it?</Text>
                  <View style={styles.feedback}>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleFeedback(initialLikeScore, 10.1, 10)}>
                      <Ionicons
                        name="checkmark-circle"
                        size={60}
                        color={'#00ff00'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleFeedback(initialDislikeScore - smallAssNumber, initialLikeScore + smallAssNumber, initialMehScore)}>
                      <Ionicons
                        name="remove-circle"
                        size={60}
                        color={'#d3d3d3'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleFeedback(0, initialDislikeScore, initialDislikeScore - 1)}>
                      <Ionicons
                        name="close-circle"
                        size={60}
                        color={'#ff0000'}
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {compItem && (
                <>
                  <Image
                    source={{ uri: imgUrl + compItem.poster_path }}
                    style={[styles.movieImage, {borderColor: Colors[colorScheme ?? 'light'].text}]}
                  />
                  <Text style={styles.movieTitle}>{'title' in compItem ? compItem.title : compItem.name}</Text>                 
                </>
              )}
            </View>
            {compItem && (
              <>
                <View style={[styles.modalView2, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
                <Text>How does this compare?</Text>
                  <View style={styles.compMovieBottom}>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleComp(lowerScore, compItem.score)}>
                      <Ionicons
                        name="close-circle"
                        size={60}
                        color={'#ff0000'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleComp(compItem.score, compItem.score)}>
                      <Ionicons
                        name="remove-circle"
                        size={50}
                        color={'#d3d3d3'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleComp(compItem.score, upperScore)}>
                      <Ionicons
                        name="heart-circle"
                        size={60}
                        color={'#00ff00'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </BlurView>}
    </>
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    width: screenWidth * 2/3,
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
    width: screenWidth / 2.5,
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
  cancelButton: {
    position: 'absolute',
    right: 10,
    top: 55,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50
  },
  compMovieBottom: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: screenWidth * 2/3
  },
});

export default Rank;