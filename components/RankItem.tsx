import React, { useCallback, useEffect, useState } from 'react';
import { View, Button, Modal, StyleSheet, Image, TextInput, TouchableOpacity, useColorScheme, ActivityIndicator, Pressable } from 'react-native';
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
import { List, UserItem } from '@/constants/ImportTypes';
import { useLoading } from '@/contexts/loading';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withDecay, withSpring } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

type Props = {
    item: Item,
    items: UserItem[],
    isDupe: boolean,
    setDupe: (dupe: boolean) => void,
    onClose: () => void,
    isIOS: boolean,
    dupePostID: string
};
type WrapperProps = {
  item: Item,
  items: UserItem[],
  isDupe: boolean,
  setDupe: (dupe: boolean) => void,
  onClose: () => void,
  dupePostID: string
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;

const initialLikeScore = 6;
const initialMehScore = 5;
const initialDislikeScore = 4;
const smallAssNumber = 0.0000001; // Used to make mid inclusive of 4 and 6 scores

const Rank = ({item, items, isDupe, setDupe, onClose, isIOS, dupePostID}: Props) => {
  const { user } = useAuth();
  const isMovie = 'title' in item ? true : false;
  const listID = Values.seenListID;
  const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;

  const { requestRefresh, movieLists, tvLists, movies, shows } = useData();
  const [compItem, setCompItem] = useState<UserItem | null>(null);
  const [nextComp, setNextComp] = useState<UserItem | null>(null);
  const colorScheme = useColorScheme();
  const [upperScore, setUpperScore] = useState(0);
  const [lowerScore, setLowerScore] = useState(0);
  const [selectedPref, setSelectedPref] = useState("none");
  const [listsModalVisible, setListsModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [comment, setComment] = useState("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const addToDB = AddToDatabase();
  const { loading } = useLoading();
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const nextTranslationX = useSharedValue(0);
  const nextTranslationY = useSharedValue(0);
  const [swipingAway, setSwipingAway] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [direction, setDirection] = useState(0);
  const [nextActive, setNextActive] = useState(false);
  const {setSelectedLists} = useTab();
 
  //Variable for keeping track of the selected lists
  const [localSelectedLists, setLocalSelectedLists] = useState<List[]>(isMovie ? movieLists.filter(list => {
    if (movies) {
      const userItem = movies.find(movie => movie.item_id === item.id);
      if (userItem) {
        return userItem.lists.includes(list.list_id);
      }
    }
  }) : tvLists.filter(list => {
    if (shows) {
      const userItem = shows.find(show => show.item_id === item.id);
      if (userItem) {
        return userItem.lists.includes(list.list_id);
      }
    }
  }));

  let toastText1: string;
  let toastText2: string;
  if (isMovie) {
    toastText1 = "You Ranked " + item.title
    toastText2 = "You successfully ranked " + item.title
  } else {
    toastText1 = "You Ranked " + item.name
    toastText2 = "You successfully ranked " + item.name
  }

  const handleSelectedListsChange = (items: List[]) => {
    setLocalSelectedLists(items);
  };

  const getNext = (minScore: number, maxScore: number) => {
    if (!items) return null;
    const newItems = items.filter(filterItem => filterItem.score > minScore && 
      filterItem.score < maxScore && filterItem.item_id != item.id);
    if (newItems.length === 0) return null;
    const midIndex = Math.floor(newItems.length / 2);
    
    return newItems[midIndex];
  } 

  const handleFeedback = (minScore: number, maxScore: number, initialScore: number) => {
    setLowerScore(minScore);
    setUpperScore(maxScore);

    const newItem = getNext(minScore, maxScore);
    if (newItem) {
      setCompItem(newItem);
    } else {
      const newScore = initialScore;
      addToDB(newScore, item, listID, isMovie, isDupe, items || [], comment, hasSpoilers, dupePostID).then(() => {
        setDupe(true);
        onClose();
        requestRefresh();
        console.log("Item added!");
        setSelectedLists([]);
        Toast.show({
          type: 'info',
          text1: toastText1,
          text2: toastText2,
          position: "bottom",
          visibilityTime: 3000,
          bottomOffset: 100
        });
      }).catch(error => {
        console.error("Failed to add item:", error);
      });
    }
  }

  const handleComp = (minScore: number, maxScore: number, swipeDirection: number) => {
    setLowerScore(minScore);
    setUpperScore(maxScore);

    if (minScore == maxScore) {
      addToDB(minScore, item, listID, isMovie, isDupe, items, comment, hasSpoilers, dupePostID).then(() => {
        setDupe(true);
        onClose();
        requestRefresh();
        setSwipingAway(false);
        console.log("Item added! No score adjust necessary");
        setSelectedLists([]);
        Toast.show({
          type: 'info',
          text1: toastText1,
          text2: toastText2,
          position: "bottom",
          visibilityTime: 3000,
          bottomOffset: 100
        });
      }).catch(error => {
        console.error("Failed to add item:", error);
      });
    } else {
      const newItem = getNext(minScore, maxScore);

      if (newItem) {
        if (nextActive) {
          translationX.value = -swipeDirection * screenWidth;
          translationY.value = 0;
          setCompItem(newItem);
          translationX.value = withSpring(0);
        } else {
          nextTranslationX.value = -swipeDirection * screenWidth;
          nextTranslationY.value = 0;
          setNextComp(newItem);
          nextTranslationX.value = withSpring(0);
        }
      } else {
        const newScore = maxScore - smallAssNumber;
        addToDB(newScore, item, listID, isMovie, isDupe, items, comment, hasSpoilers, dupePostID).then(addItem => {
          if (addItem) {
            setDupe(true);
            onClose();
            requestRefresh();
            setSwipingAway(false);
            console.log("Item added!");
            setSelectedLists([]);
            Toast.show({
              type: 'info',
              text1: toastText1,
              text2: toastText2,
              position: "bottom",
              visibilityTime: 3000,
              bottomOffset: 100
            });
          }
        }).catch(error => {
          console.error("Failed to add item:", error);
        });
      }
    }
  }

  const gesture = Gesture.Pan()
    .onStart(() => {
      if (!swipingAway && !loading) {
        runOnJS(setSwiping)(true);
      }
    })
    .onChange((event) => {
      if (!swipingAway && !loading) {
        if (nextActive) {
          nextTranslationX.value = event.translationX;
          nextTranslationY.value = event.translationY;
        } else {
          translationX.value = event.translationX;
          translationY.value = event.translationY;
        }
        
        if ((!nextActive && (translationY.value > 0 && Math.abs(translationY.value) > Math.abs(translationX.value)) || (
          nextActive && (nextTranslationY.value > 0 && Math.abs(nextTranslationY.value) > Math.abs(nextTranslationX.value))
        ))) {
          runOnJS(setDirection)(2); // Down
        } else if ((!nextActive && translationX.value > 0) || (nextActive && nextTranslationX.value > 0)) {
          runOnJS(setDirection)(3); // Right
        } else if ((!nextActive && translationX.value < 0) || (nextActive && nextTranslationX.value < 0)) {
          runOnJS(setDirection)(1); // Left
        }
      }
    })
    .onEnd((event) => {
      if (!swipingAway && !loading) {
        const score = (compItem && !nextActive) ? compItem.score : (nextComp && nextActive) ? nextComp.score : -1;
        runOnJS(setSwiping)(false);
        if (Math.abs(event.velocityX) > 800 && score != -1) {
          runOnJS(setSwipingAway)(true);
          if ((!nextActive && translationX.value > 0) || (nextActive && nextTranslationX.value > 0)) {
            runOnJS(handleComp)(lowerScore, score, 1);
          } else if ((!nextActive && translationX.value < 0) || (nextActive && nextTranslationX.value < 0)) {
            runOnJS(handleComp)(score, upperScore, -1);
          }
          if (nextActive) {
            nextTranslationX.value = withSpring(Math.sign(event.translationX) * screenWidth * 1.25);
            runOnJS(setNextActive)(false);
          } else {
            translationX.value = withSpring(Math.sign(event.translationX) * screenWidth * 1.25);
            runOnJS(setNextActive)(true);
          }
          runOnJS(setSwipingAway)(false);
        } else if (event.velocityY > 800 && score != -1) {
          runOnJS(setSwipingAway)(true);
          runOnJS(handleComp)(score, score, 0);
          if (nextActive) {
            nextTranslationY.value = withSpring(screenHeight);
          } else {
            translationY.value = withSpring(screenHeight);
          }
        } else {
          if (nextActive) {
            nextTranslationX.value = withSpring(0);
            nextTranslationY.value = withSpring(0);
          } else {
            translationX.value = withSpring(0);
            translationY.value = withSpring(0);
          }
        }
      }
    })

  const animatedCard = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translationX.value,
      },
      {
        translateY: translationY.value,
      },
      {
        rotateZ: interpolate(translationX.value, [-screenWidth / 2, 0, screenWidth / 2],
          [-20, 0, 20]) + 'deg',
      }
    ]
  }))

  const nextAnimatedCard = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: nextTranslationX.value,
      },
      {
        translateY: nextTranslationY.value,
      },
      {
        rotateZ: interpolate(nextTranslationX.value, [-screenWidth / 2, 0, screenWidth / 2],
          [-20, 0, 20]) + 'deg',
      }
    ]
  }));

  const swipeIndicator = useCallback(() => {
    return (
      <View style={[styles.swipeIndicator, direction == 1 ? styles.worse : (direction == 2 ? styles.same : styles.better)]}>
        <Text style={[styles.swipeText, direction == 1 ? styles.worseText : (direction == 2 ? styles.sameText : styles.betterText)]}>
          {direction == 2 ? "SAME" : (direction == 1 ? "WORSE" : "BETTER")}
        </Text>
      </View>
    )
  }, [direction]);

  return (
    <GestureHandlerRootView>
      {item &&
        <BlurView intensity={100} style={styles.blurContainer}>
          {loading && (
            <View style={[styles.spinnerOverlay, {backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].gray}]}>
              <Text style={{paddingBottom: 10, fontSize: 16, fontWeight: '500'}}>Finishing Ranking...</Text>
              <ActivityIndicator size="large" />
            </View>
          )}
          {isIOS && (
          <TouchableOpacity onPress={() => {
              if (loading) return;
              setCompItem(null);
              setUpperScore(0);
              setLowerScore(0);
              setSelectedPref("none");
              onClose();
              setSelectedLists([]);
            }} style={styles.cancelButton}>
            <Ionicons
              name="close-circle"
              size={45}
              color={Colors[colorScheme ?? 'light'].text}
            />
          </TouchableOpacity>)}

          <View style={styles.container}>
            <View style={[styles.modalView, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
              <View>
                <Image
                  source={item.poster_path ? { uri: imgUrl + item.poster_path } :
                  require('../assets/images/poster-placeholder.png')}
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
                  <View style={{width: '100%'}}>
                  <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
                  <View style={[styles.rankTab, {borderColor: Colors[colorScheme ?? 'light'].text, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}>
                    <Text style={{flex: 1}} numberOfLines={2}>{comment ? comment : "Add comment..."}</Text>
                    <Ionicons name="pencil" size={25} color={Colors[colorScheme ?? 'light'].text} />
                    </View>
                  </TouchableOpacity>
                  </View>
                  <View style={{width: '100%'}}>
                    <TouchableOpacity onPress={() => {
                      setListsModalVisible(true);
                    }}>
                      <View style={[styles.rankTab, {borderColor: Colors[colorScheme ?? 'light'].text, paddingTop: 10}]}>
                        <Text>Add to lists...</Text>
                        {localSelectedLists.length > 0 &&
                                <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
                                  {"Added to " + localSelectedLists.length}{localSelectedLists.length > 1 ? " lists" : " list"}</Text>
                            }
                      </View>
                    </TouchableOpacity>
                  </View>
                <View style={styles.feedback}>
                  <Pressable onPress={() => {
                    if (loading) return;
                    setSelectedPref("like");
                    handleFeedback(initialLikeScore, 10.1, 10);
                  }}>
                    {({ pressed }) => (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={60}
                      color={pressed ? "#00ff00" : Colors[colorScheme ?? 'light'].text}
                    />
                    )}
                  </Pressable>
                  <Pressable onPress={() => {
                    if (loading) return;
                    setSelectedPref("mid");
                    handleFeedback(initialDislikeScore - smallAssNumber, initialLikeScore + smallAssNumber, initialMehScore);
                  }}>
                    {({ pressed }) => (
                    <Ionicons
                      name="remove-circle-outline"
                      size={60}
                      color={pressed ? 'gray' : Colors[colorScheme ?? 'light'].text}
                    />
                    )}
                  </Pressable>
                  <Pressable onPress={() => {
                    if (loading) return;
                    setSelectedPref("dislike");
                    handleFeedback(0, initialDislikeScore, initialDislikeScore - 1);
                  }}>
                    {({ pressed }) => (
                    <Ionicons
                      name="close-circle-outline"
                      size={60}
                      color={pressed ? "#ff0000" : Colors[colorScheme ?? 'light'].text}
                    />
                    )}
                  </Pressable>
                </View>
                <Text style={styles.feedbackText}>Did you like it?</Text>
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={listsModalVisible}
                    onRequestClose={() => setListsModalVisible(false)}
                  >
                    <AddToListsScreen item_id={item.id.toString()} 
                    item_name={isMovie ? item.title : item.name}
                    newItem={null}
                    listTypeID={listTypeID} 
                    isRanking={true} 
                    onClose={() => setListsModalVisible(false)} 
                    onSelectedListsChange = {handleSelectedListsChange}
                    isWatched={true}/>
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
              </View>
            )}

              {compItem && (
              <>
                <GestureDetector gesture={gesture}>
                <View style={[styles.modalView, {backgroundColor: 'transparent'}]}>
                  {nextComp && (
                    <Animated.View style={[nextAnimatedCard, {zIndex: 1, position: 'absolute'}]}>
                      <Image
                        source={{ uri: imgUrl + nextComp.poster_path }}
                        style={[styles.movieImage, {borderColor: Colors[colorScheme ?? 'light'].background}]}
                      />
                      <LinearGradient
                        colors={['transparent', 'black']}
                        style={styles.gradient}
                      />
                      <Text style={[styles.movieTitle, {color: 'white'}]}>{'title' in nextComp ? nextComp.title : nextComp.name}</Text>
                      {swiping && (
                        swipeIndicator()
                      )}
                    </Animated.View>
                  )}
                  <Animated.View style={[animatedCard, {zIndex: 1, position: 'absolute'}]}>
                    <Image
                      source={{ uri: imgUrl + compItem.poster_path }}
                      style={[styles.movieImage, {borderColor: Colors[colorScheme ?? 'light'].background}]}
                    />
                    <LinearGradient
                      colors={['transparent', 'black']}
                      style={styles.gradient}
                    />
                    <Text style={[styles.movieTitle, {color: 'white'}]}>{'title' in compItem ? compItem.title : compItem.name}</Text>
                    {swiping && (
                      swipeIndicator()
                    )}
                  </Animated.View>
                  
                </View>
                </GestureDetector>
                <View style={{ zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', width: '75%', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => {
                    const score = (nextComp && nextActive) ? nextComp.score : compItem.score;
                    setSwipingAway(true);
                    handleComp(score, upperScore, -1);
                    if (nextActive) {
                      nextTranslationX.value = withSpring(-screenWidth * 1.25);
                    } else {
                      translationX.value = withSpring(-screenWidth * 1.25);
                    }
                    setNextActive(prev => !prev);
                    setSwipingAway(false);
                  }}>
                    <Ionicons
                      name={swiping && direction == 1 ? "close-circle" : "close-circle-outline"}
                      size={60}
                      color={'#ff0000'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    const score = (nextComp && nextActive) ? nextComp.score : compItem.score;
                    setSwipingAway(true);
                    handleComp(score, score, 0);
                    if (nextActive) {
                      nextTranslationY.value = withSpring(screenHeight);
                    } else {
                      translationY.value = withSpring(screenHeight);
                    }
                    setNextActive(prev => !prev);
                    setSwipingAway(false);
                  }}>
                    <Ionicons
                      name={swiping && direction == 2 ? "remove-circle" : "remove-circle-outline"}
                      size={60}
                      color={'#d3d3d3'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    const score = (nextComp && nextActive) ? nextComp.score : compItem.score;
                    setSwipingAway(true);
                    handleComp(lowerScore, score, 1);
                    if (nextActive) {
                      nextTranslationX.value = withSpring(screenWidth * 1.25);
                    } else {
                      translationX.value = withSpring(screenWidth * 1.25);
                    }
                    setNextActive(prev => !prev);
                    setSwipingAway(false);
                  }}>
                    <Ionicons
                      name={swiping && direction == 3 ? "heart-circle" : "heart-circle-outline"}
                      size={60}
                      color={'#00ff00'}
                    />
                  </TouchableOpacity>
                </View>
              </>
              )}
          </View>
        </BlurView>}
    </GestureHandlerRootView>
  );
};

// only use this for andoiord 
const RankItemWrapper = ({item, items, isDupe, setDupe, onClose, dupePostID}: WrapperProps) => {
  return (
    <View style={styles.fullScreen}>
      <Image
        source={item.poster_path ? { uri: imgUrl + item.poster_path } : 
          require('../assets/images/poster-placeholder.png')}
        style={[styles.blurredImage, { opacity: 1}]}
        blurRadius={10} // Adjust the blur intensity here
      />
      <Rank item={item} items={items} isDupe={isDupe} setDupe={setDupe} onClose={onClose} isIOS={false} dupePostID={dupePostID}/>
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    padding: 10,
  },
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  blurredImage: {
    ...StyleSheet.absoluteFillObject, // Make the image cover the entire view
    width: '100%',
    height: '100%',
    position: 'absolute', // Ensure the image stays behind content
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
    zIndex: 1,
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
    paddingBottom: 10
  },
  rankTab: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
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
    left: screenWidth / 4,
    right: screenWidth / 4,
    bottom: screenHeight / 2,
    top: screenHeight / 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'black',
    padding: 10,
    borderWidth: 1,
    borderRadius: 20,
  },
  swipeIndicator: {
    position: 'absolute',
    top: 10,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  worse: {
    right: 10,
    borderColor: 'red',
  },
  better: {
    left: 10,
    borderColor: '#32CD32',
  },
  same: {
    alignSelf: 'center',
    borderColor: 'gray',
  },
  worseText: {
    color: 'red',
  },
  betterText: {
    color: '#32CD32'
  },
  sameText: {
    color: 'gray',
  },
  swipeText: {
    fontSize: 30,
    fontWeight: '700',
  }
});

export default Rank;
export { RankItemWrapper };