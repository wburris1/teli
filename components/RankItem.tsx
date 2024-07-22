import React, { useEffect, useState } from 'react';
import { View, Button, Modal, StyleSheet, Image, TextInput, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/authContext';
import Colors from '@/constants/Colors';
import { useData } from '@/contexts/dataContext';
import Values from '@/constants/Values';
import { AddToDatabase } from '@/data/addItem';
import { Text } from './Themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useTab } from '@/contexts/listContext';
import AddToListsScreen from './AddToListsModal';
import { CommentModalScreen } from './RankComment';
import { UserItem } from '@/constants/ImportTypes';
import { useLoading } from '@/contexts/loading';

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
  const listID = Values.seenListID;
  const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;

  const { requestRefresh } = useData();
  const [compItem, setCompItem] = useState<UserItem | null>(null);
  const colorScheme = useColorScheme();
  const [upperScore, setUpperScore] = useState(0);
  const [lowerScore, setLowerScore] = useState(0);
  const [selectedPref, setSelectedPref] = useState("none");
  const [listsModalVisible, setListsModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [comment, setComment] = useState("Add comment...");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const addToDB = AddToDatabase();
  const { loading } = useLoading();

  //Variable for keeping track of the selected lists
  const [selectedLists, setSelectedLists] = useState<List[]>([]);

  const handleSelectedListsChange = (items: List[]) => {
    setSelectedLists(items);
};

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
      addToDB(newScore, item, listID, isMovie, isDupe, items || [], comment, hasSpoilers).then(() => {
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
      addToDB(minScore, item, listID, isMovie, isDupe, items, comment, hasSpoilers).then(() => {
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
        addToDB(newScore, item, listID, isMovie, isDupe, items, comment, hasSpoilers).then(addItem => {
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
          {loading && (
            <View style={styles.spinnerOverlay}>
              <ActivityIndicator size="large" />
            </View>
          )}
          <TouchableOpacity onPress={() => {
              if (loading) return;
              setCompItem(null);
              setUpperScore(0);
              setLowerScore(0);
              setSelectedPref("none");
              onClose();
            }} style={styles.cancelButton}>
            <Ionicons
              name="close-circle"
              size={45}
              color={Colors[colorScheme ?? 'light'].text}
            />
          </TouchableOpacity>

          <View style={styles.container}>
            <View style={[styles.modalView, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
              <View>
                <Image
                  source={{ uri: imgUrl + item.poster_path }}
                  style={[styles.movieImage, {borderColor: Colors[colorScheme ?? 'light'].background}]}
                />
                <LinearGradient
                    colors={['transparent', 'black']}
                    style={styles.gradient}
                />
              </View>
              <Text style={[styles.movieTitle, {color: 'white'}]}>{'title' in item ? item.title : item.name}</Text>
            </View>

            {!compItem && (
              <View style={[styles.initialRankView, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
                <Text style={styles.feedbackText}>Did you like it?</Text>
                <View style={styles.feedback}>
                  <TouchableOpacity onPress={() => {
                    if (loading) return;
                    setSelectedPref("like");
                  }}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={60}
                      color={selectedPref == "like" ? "#00ff00" : Colors[colorScheme ?? 'light'].text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    if (loading) return;
                    setSelectedPref("mid");
                  }}>
                    <Ionicons
                      name="remove-circle-outline"
                      size={60}
                      color={selectedPref == "mid" ? 'gray' : Colors[colorScheme ?? 'light'].text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    if (loading) return;
                    setSelectedPref("dislike");
                  }}>
                    <Ionicons
                      name="close-circle-outline"
                      size={60}
                      color={selectedPref == "dislike" ? "#ff0000" : Colors[colorScheme ?? 'light'].text}
                    />
                  </TouchableOpacity>
                </View>
                
                {selectedPref != "none" &&
                <>
                  <View style={{width: '100%'}}>
                  <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
                  <View style={[styles.rankTab, {borderColor: Colors[colorScheme ?? 'light'].text, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}>
                    <Text style={[styles.addText, {flex: 1}]} numberOfLines={2}>{comment}</Text>
                    <Ionicons name="pencil" size={25} color={Colors[colorScheme ?? 'light'].text} />
                    </View>
                  </TouchableOpacity>
                  </View>
                  <View style={{width: '100%'}}>
                    <TouchableOpacity onPress={() => {
                      setListsModalVisible(true);
                    }}>
                      <View style={[styles.rankTab, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
                        <Text>Add to lists...</Text>
                        {selectedLists.length > 0 &&
                                <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
                                  {"Added to " + selectedLists.length}{selectedLists.length > 1 ? " lists" : " list"}</Text>
                            }
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={{width: '100%'}}>
                    <TouchableOpacity onPress={() => {
                      if (selectedPref === "like") {
                        handleFeedback(initialLikeScore, 10.1, 10);
                      } else if (selectedPref === "dislike") {
                        handleFeedback(0, initialDislikeScore, initialDislikeScore - 1);
                      } else if (selectedPref === "mid") {
                        handleFeedback(initialDislikeScore - smallAssNumber, initialLikeScore + smallAssNumber, initialMehScore);
                      }
                    }}>
                      <View style={[styles.rankTab, {borderColor: Colors[colorScheme ?? 'light'].text}, {justifyContent: 'center'}]}>
                        <Text style={{fontSize: 16, fontWeight: 'bold'}}>Rank</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={listsModalVisible}
                    onRequestClose={() => setListsModalVisible(false)}
                  >
                    <AddToListsScreen item_id={item.id.toString()} 
                    listTypeID={listTypeID} 
                    isRanking={true} 
                    onClose={() => setListsModalVisible(false)} 
                    onSelectedListsChange = {handleSelectedListsChange}/>
                  </Modal>
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={commentModalVisible}
                    onRequestClose={() => setCommentModalVisible(false)}
                  >
                    <CommentModalScreen onClose={() => setCommentModalVisible(false)}
                      onSave={comment => {
                          setComment(comment);
                          setCommentModalVisible(false);
                        }} />
                  </Modal>
                </>}
              </View>
            )}

              {compItem && (
                <View style={[styles.modalView, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
                <View>
                  <Image
                    source={{ uri: imgUrl + compItem.poster_path }}
                    style={[styles.movieImage, {borderColor: Colors[colorScheme ?? 'light'].background}]}
                  />
                  <LinearGradient
                    colors={['transparent', 'black']}
                    style={styles.gradient}
                  />
                </View>
                <Text style={[styles.movieTitle, {color: 'white'}]}>{'title' in compItem ? compItem.title : compItem.name}</Text>
                <TouchableOpacity style={{position: 'absolute', left: -75, top: 150}} onPress={() => handleComp(compItem.score, upperScore)}>
                      <Ionicons
                        name="close-circle"
                        size={60}
                        color={'#ff0000'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={{position: 'absolute', bottom: -70}} onPress={() => handleComp(compItem.score, compItem.score)}>
                      <Ionicons
                        name="remove-circle"
                        size={60}
                        color={'#d3d3d3'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={{position: 'absolute', right: -75, top: 150}} onPress={() => handleComp(lowerScore, compItem.score)}>
                      <Ionicons
                        name="heart-circle"
                        size={60}
                        color={'#00ff00'}
                      />
                    </TouchableOpacity>
                </View>
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
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalView: {
    borderRadius: 20,
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
    height: (screenHeight / 2) - 80,
    aspectRatio: 1 / 1.5,
  },
  initialRankView: {
    borderRadius: 20,
    paddingTop: 10,
    width: screenWidth * 0.75,
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
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '200',
  },
  rankTab: {
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movieImage: {
    height: (screenHeight / 2) - 80,
    aspectRatio: 1 / 1.5,
    borderRadius: 20,
  },
  movieTitle: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    textAlign: 'left',
    fontSize: 20,
    fontWeight: '500',
    marginTop: 10,
    width: "92%",
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
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});

export default Rank;