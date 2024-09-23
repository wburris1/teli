import { Image, Keyboard, SafeAreaView, StyleSheet, Switch, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme } from "react-native"
import { Text, View } from "./Themed"
import { Ionicons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { useData } from "@/contexts/dataContext"
import { useState } from "react"
import { MakePost } from "@/data/userPosts"
import Toast from "react-native-toast-message"
import Values from "@/constants/Values"
import Spinner from "react-native-loading-spinner-overlay"
import Dimensions from "@/constants/Dimensions"

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

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background}}>
          <Spinner visible={loading} />
          <View style={[styles.switchContainer, {paddingTop: 0}]}>
            {!isHome && <TouchableOpacity onPress={onClose} style={{paddingRight: 5}}>
              <Ionicons name="close-circle" size={40} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>}
            <View style={styles.textContainer}>
              <Text style={{}}>Commenting on</Text>
              <Text style={styles.title}>{name}</Text>
            </View>
            <View style={[styles.imageBorder, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
              <Image
                  source={{ uri: imgUrl + poster }}
                  style={styles.aboutImage}
              />
            </View>
          </View>
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
        <View style={styles.switchContainer}>
          <Text style={styles.spoilerText}>Spoiler Alert?</Text>
          <Switch
            trackColor={{ false: Colors[colorScheme ?? 'light'].text, true: "#32CD32" }}
            thumbColor={Colors[colorScheme ?? 'light'].background}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => setHasSpoilers(prev => !prev)}
            value={hasSpoilers}
          />
        </View>
          
          {caption && id &&
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
                  <Text style={{fontSize: 18, color: Colors[colorScheme ?? 'light'].background, fontWeight: '600', paddingRight: 5}}>Share</Text>
                  <Ionicons name="checkmark-done" size={30} color={Colors[colorScheme ?? 'light'].background} /> 
                </View>
              </TouchableOpacity>}
        </SafeAreaView>
        </TouchableWithoutFeedback>
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
      paddingVertical: 7,
      paddingHorizontal: 10,
      width: 110,
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
      height: 150,
      fontSize: 16,
      borderBottomWidth: 1,
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