import React, { useEffect, useState } from 'react';
import { View, Text, Button, Modal, StyleSheet, Image, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams } from 'expo-router';
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/authContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import Colors from '@/constants/Colors';
import { useData } from '@/contexts/dataContext';
import { useUserAdjustScores, useUserItemsSeenSearch } from '@/data/userData';

type Props = {
    item: Item
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;
const db = FIREBASE_DB;

const initialLikeScore = 6;
const initialMehScore = 5;
const initialDislikeScore = 4;
const smallAssNumber = 0.0000001; // Used to make mid inclusive of 4 and 6 scores

const Rank = ({item}: Props) => {
  const isMovie = 'title' in item ? true : false;

  const [isDupe, setDupe] = useState(true);
  const { requestRefresh } = useData();
  const { user } = useAuth();
  const [compItem, setCompItem] = useState<UserItem | null>(null);
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [upperScore, setUpperScore] = useState(0);
  const [lowerScore, setLowerScore] = useState(0);
  const adjustScoreFunc = useUserAdjustScores();
  const items = useUserItemsSeenSearch(isMovie);

  async function checkDupe() {
    var exists = true;

    if (user && item) {
      console.log(item);
      const itemRef = doc(db, "users", user.uid, isMovie ? "movies" : "shows", item.id.toString());
      
      try {
        const snapshot = await getDoc(itemRef);
        exists = snapshot.exists();
      } catch (err: any) {
        console.error("Failed to check for dupe: ", err);
      }
    }
    return exists;
  }

  async function addToDB(newScore: number) {
    var newItem: UserItem;
    if (isMovie) {
      newItem = {
        item_id: item.id.toString(),
        title: item.title,
        poster_path: item.poster_path,
        score: newScore,
        release_date: item.release_date,
      };
    } else {
      newItem = {
        item_id: item.id.toString(),
        name: item.name,
        poster_path: item.poster_path,
        score: newScore,
        first_air_date: item.first_air_date,
      };
    }

    if (user) {
      const itemRef = doc(db, "users", user.uid, isMovie ? "movies" : "shows", item.id.toString());
      try {
        await setDoc(itemRef, newItem);
        setDupe(true);
      } catch (err: any) {
        console.error("Error adding new item: ", err);
      }
      return newItem;
    }
    return null;
  }

  const onRankStart = async () => {
    if (item) {
      setModalVisible(true);
    }
  }

  const getNext = (minScore: number, maxScore: number) => {
    console.log("min: " + minScore);
    console.log("max: " + maxScore);
    const newItems = items.filter(filterItem => filterItem.score > minScore && filterItem.score < maxScore);
    const count = newItems.length;

    if (count > 0) {
      const randIndex = Math.floor(Math.random() * count);
      return newItems[randIndex];
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
      addToDB(newScore).then(() => {
        setModalVisible(false);
        console.log("Item added!");
        requestRefresh();
      }).catch(error => {
        console.error("Failed to add item:", error);
      });
    }
  }

  const handleComp = async (minScore: number, maxScore: number) => {
    setLowerScore(minScore);
    setUpperScore(maxScore);
    if (minScore == maxScore) {
      addToDB(minScore).then(() => {
        setModalVisible(false);
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
        addToDB(newScore).then(addItem => {
          if (addItem) {
            setModalVisible(false);
            adjustScoreFunc([...items, addItem], newScore, isMovie);
            console.log("Item added!");
          }
        }).catch(error => {
          console.error("Failed to add item:", error);
        });
      }
    }
  }

  useEffect(() => {
    if (item) {
      checkDupe().then(exists => {
        if (exists) {
          setDupe(true);
        } else {
          setDupe(false);
        }
      }).catch(error => {
        console.error("Error in checkDupe:", error);
      });
    }
  }, [item])

  return (
    <>
      {!isDupe && 
      <TouchableOpacity onPress={onRankStart} style={styles.addButton}>
        <Ionicons
          name="add-circle"
          size={85}
          color={Colors[colorScheme ?? 'light'].text}
        />
      </TouchableOpacity>}
      {item &&
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
          
        <BlurView intensity={100} style={styles.blurContainer}>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
            <Ionicons
              name="close-circle"
              size={45}
              color={Colors[colorScheme ?? 'light'].text}
            />
          </TouchableOpacity>

          <View style={styles.container}>
            <View style={styles.modalView}>
              <Image
                source={{ uri: imgUrl + item.poster_path }}
                style={styles.movieImage}
              />
              <Text style={styles.movieTitle}>{item.title}</Text>
            </View>

            <View style={styles.modalView}>
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
                    style={styles.movieImage}
                  />
                  <Text style={styles.movieTitle}>{'title' in compItem ? compItem.title : compItem.name}</Text>                 
                </>
              )}
            </View>
            {compItem && (
              <>
                <View style={styles.modalView2}>
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
        </BlurView>
      </Modal>}
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
  addButton: {
    position: 'absolute',
    bottom: 10,
  },
  compMovieBottom: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: screenWidth * 2/3
  }
});

export default Rank;