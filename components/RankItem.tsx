import React, { useState } from 'react';
import { View, Text, Button, Modal, StyleSheet, Image, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams } from 'expo-router';
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/authContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import Colors from '@/constants/Colors';

type Props = {
    item: Item
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;

const initialLikeScore = 6;
const initialMehScore = 5;
const initialDislikeScore = 4;

const Rank = ({item}: Props) => {
  const { user } = useAuth();
  const [compItem, setCompItem] = useState<UserMovie | null>(null);
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [upperScore, setUpperScore] = useState(10.1);
  const [lowerScore, setLowerScore] = useState(0);

  const db = FIREBASE_DB;

  async function fetchNextMovie(minScore: number, maxScore: number) {
    if (user) {
      const userMoviesRef = collection(db, "users", user.uid, "movies");
      const moviesQuery = query(userMoviesRef,
        where("score", ">", minScore),
        where("score", "<", maxScore),
      );
      const snapshot = await getDocs(moviesQuery);
      if (!snapshot.empty) {
        const validMovies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserMovie }));
        const randIndex = Math.floor(Math.random() * validMovies.length);
        return validMovies[randIndex];
      } else {
        return null;
      }
    }
  }

  async function addMovieToDB(newScore: number) {
    const newMovie = {
      movie_id: item.id,
      title: item.title,
      poster_path: item.poster_path,
      score: newScore
    };

    if (user) {
      const movieRef = doc(collection(db, "users", user.uid, "movies"));
      try {
        await setDoc(movieRef, newMovie);
      } catch (err: any) {
        console.error("Error adding new movie: ", err);
      }
    }
  }

  async function adjustScores(minScore: number, maxScore: number, range: number) {
    const userMoviesRef = collection(db, "users", user!.uid, "movies");
      const moviesQuery = query(userMoviesRef,
        where("score", ">=", minScore),
        where("score", "<=", maxScore),
      );

      const snapshot = await getDocs(moviesQuery);
      const movies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      // Distribute scores evenly between minScore and maxScore
      const count = movies.length;
      const scoreIncrement = range / (count - 1);

      for (let i = 0; i < count; i++) {
        const newScore = minScore + scoreIncrement * i;
        const movieRef = doc(db, 'users', user!.uid, 'movies', movies[i].id);
        await updateDoc(movieRef, { score: newScore });
      }
  }

  const handleFeedback = async (minScore: number, maxScore: number, initialScore: number) => {
    setLowerScore(minScore);
    setUpperScore(maxScore);
    fetchNextMovie(minScore, maxScore).then(movie => {
      if (movie) {
        setCompItem(movie);
      } else {
        // Add curr movie to database, with score of 10?
        const newScore = initialScore;
        addMovieToDB(newScore).then(() => {
          setModalVisible(false);
          console.log("Movie added!");
        }).catch(error => {
          console.error("Failed to add movie:", error);
        });
      }
    }).catch(error => {
      console.error("Failed to fetch next movie:", error);
    });
  }

  const handleComp = async (minScore: number, maxScore: number) => {
    setLowerScore(minScore);
    setUpperScore(maxScore);
    if (minScore == maxScore) {
      addMovieToDB(minScore).then(() => {
        setModalVisible(false);
        console.log("Movie added!");
      }).catch(error => {
        console.error("Failed to add movie:", error);
      });
      return;
    }

    fetchNextMovie(minScore, maxScore).then(movie => {
      if (movie) {
        setCompItem(movie);
      } else {
        // Add curr movie to database, with score in between movie score and upper score
        const newScore = maxScore;
        addMovieToDB(newScore).then(() => {
          setModalVisible(false);
          var bottomScore = 0;
          var topScore = 11;
          var range = 4;
          if (newScore >= 6) {
            bottomScore = 6;
            topScore = 11;
            range = 4;
          } else if (newScore >= 4) {
            bottomScore = 4;
            topScore = 6;
            range = 2;
          } else {
            topScore = 4;
          }

          adjustScores(bottomScore, topScore, range).then(() => {
            console.log("Scores adjusted");
          }).catch(error => {
            console.error("Failed to adjust scores:", error);
          })
          console.log("Movie added!");
        }).catch(error => {
          console.error("Failed to add movie:", error);
        });
      }
    }).catch(error => {
      console.error("Failed to fetch next movie:", error);
    });
  }

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
        <Ionicons
          name="add-circle"
          size={85}
          color={Colors[colorScheme ?? 'light'].text}
        />
      </TouchableOpacity>

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
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleFeedback(initialDislikeScore, initialLikeScore, initialMehScore)}>
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
                  <Text style={styles.movieTitle}>{compItem.title}</Text>                 
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
      </Modal>
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