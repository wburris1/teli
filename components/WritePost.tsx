import { Image, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme } from "react-native"
import { Text, View } from "./Themed"
import { Ionicons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useNavigation, useRouter } from "expo-router"
import { useData } from "@/contexts/dataContext"
import { useLayoutEffect, useState } from "react"
import { MakePost } from "@/data/userPosts"
import Toast from "react-native-toast-message"
import Values from "@/constants/Values"
import Spinner from "react-native-loading-spinner-overlay"
import Dimensions from "@/constants/Dimensions"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { opacity } from "react-native-reanimated/lib/typescript/reanimated2/Colors"

const imgUrl = 'https://image.tmdb.org/t/p/w300';

export const WritePost = ({id, poster, backdrop, runtime, name, isHome, groupKey, onClose}:
    {id: string, poster: string, name: string, isHome: boolean, groupKey: string, onClose: () => void
    backdrop: string, runtime: number}) => {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { requestRefresh } = useData();
    const [caption, setCaption] = useState("");
    const [hasSpoilers, setHasSpoilers] = useState(false);
    const postFunc = MakePost();
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    useLayoutEffect(() => {
      if (isHome) {
        navigation.setOptions({
          headerTitle: name,
          headerRight: () => {
            return (
              caption ?
              <TouchableOpacity onPress={() => {
                setLoading(true);
                postFunc(caption, id, poster, name, hasSpoilers,
                  groupKey == "movies" ? Values.movieListsID : Values.tvListsID, groupKey == "movies", backdrop, runtime,).then(() => {
                  //requestRefresh();
                  setLoading(false);
                  setCaption('');
                  if (isHome) router.push('/');
                  else onClose();
                  Toast.show({
                    type: 'info',
                    text1: "You made a new post about " + name + "!",
                    position: "bottom",
                    visibilityTime: 3000,
                    bottomOffset: 100
                  });
                  })
              }}>
              <View style={[styles.postButton, {backgroundColor: Colors['theme'], flexDirection: 'row', alignSelf: 'center'}]}>
                <Text style={{fontSize: 16, color: 'white', fontWeight: '500'}}>Post</Text>
              </View>
            </TouchableOpacity> : 
            <View style={[styles.postButton, {backgroundColor: Colors['theme'], flexDirection: 'row', alignSelf: 'center',
            opacity: 0.5}]}>
              <Text style={{fontSize: 16, color: 'white', fontWeight: '500'}}>Post</Text>
            </View>
          )}
        })
      }
    }, [isHome, caption, hasSpoilers])

    return (
      <>
        <KeyboardAvoidingView
          keyboardVerticalOffset={isHome ? (Platform.OS === 'ios' ? 90 : 60) : 0} // Adjust for iOS and Android
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background, height: Dimensions.screenHeight,}}>
          <Spinner visible={loading} />
          {!isHome && 
            <SafeAreaView>
            <View style={[styles.switchContainer, {paddingHorizontal: 5, justifyContent: 'space-between'}]}>
            <TouchableOpacity onPress={onClose} style={{paddingRight: 5}}>
              <Ionicons name="close-circle" size={35} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
            <Text style={{fontSize: 16, fontWeight: '600'}}>{name}</Text>
            {
              caption ?
              <TouchableOpacity onPress={() => {
                setLoading(true);
                postFunc(caption, id, poster, name, hasSpoilers,
                  groupKey == "movies" ? Values.movieListsID : Values.tvListsID, groupKey == "movies", backdrop, runtime,).then(() => {
                  //requestRefresh();
                  setLoading(false);
                  setCaption('');
                  if (isHome) router.push('/');
                  else onClose();
                  Toast.show({
                    type: 'info',
                    text1: "You made a new post about " + name + "!",
                    position: "bottom",
                    visibilityTime: 3000,
                    bottomOffset: 100
                  });
                  })
              }}>
              <View style={[styles.postButton, {backgroundColor: Colors[colorScheme ?? 'light'].text, flexDirection: 'row', alignSelf: 'center'}]}>
                <Text style={{fontSize: 16, color: Colors[colorScheme ?? 'light'].background, fontWeight: '500'}}>Post</Text>
              </View>
            </TouchableOpacity> : 
            <View style={[styles.postButton, {backgroundColor: Colors[colorScheme ?? 'light'].text, flexDirection: 'row', alignSelf: 'center',
            opacity: 0.5}]}>
              <Text style={{fontSize: 16, color: Colors[colorScheme ?? 'light'].background, fontWeight: '500'}}>Post</Text>
            </View>
            }
            </View>
            </SafeAreaView>}
          <TextInput
            multiline
            autoCapitalize="sentences"
            placeholder="Speak your mind..."
            value={caption}
            onChangeText={setCaption}
            style={[styles.inputField,
                { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text,
                    color: Colors[colorScheme ?? 'light'].text,
                    textAlignVertical: 'top',
                }]}
        />        
                <SafeAreaView>
                <View style={[styles.switchContainer, {borderTopWidth: 1, borderColor: Colors[colorScheme ?? 'light'].gray}]}>
                  <Text style={styles.spoilerText}>Spoiler Alert?</Text>
                  <Switch
                    trackColor={{ false: Colors[colorScheme ?? 'light'].text, true: Colors['theme'] }}
                    thumbColor={Colors[colorScheme ?? 'light'].background}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={() => setHasSpoilers(prev => !prev)}
                    value={hasSpoilers}
                  />
                </View>
                </SafeAreaView>
              </KeyboardAvoidingView>
        </>
    )
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    switchContainer: {
      flexDirection: 'row',
      width: '100%',
      padding: 10,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    postButton: {
      borderRadius: 20,
      paddingVertical: 5,
      paddingHorizontal: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemText: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    text: {
      fontSize: 16
    },
    spoilerText: {
      fontSize: 18,
      fontWeight: '300',
    },
    aboutText: {
      fontSize: 22,
      fontWeight: '500',
    },
    rank: {
      paddingHorizontal: 10,
      backgroundColor: 'transparent'
    },
    inputField: {
      width: '100%',
      padding: 10,
      flex: 1,
      fontSize: 16,
    },
    aboutImage: {
      width: 35,
      aspectRatio: 2/3,
    },
    imageBorder: {
      borderWidth: 1,
      borderColor: '#000',
      overflow: 'hidden',
      borderRadius: 5,
    },
    title: {
      textAlign: 'left',
      fontSize: 18,
      fontWeight: '500',
      paddingTop: 3,
    },
    textContainer: {
      flex: 1,
    },
  });