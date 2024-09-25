import { useState } from "react";
import { Text, View } from "./Themed";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Switch, TextInput, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Dimensions from "@/constants/Dimensions";

type ScreenProps = {
    onClose: () => void;
    onSave: (comment: string, spoilers: boolean) => void;
}

export const CommentModalScreen = ({ onClose, onSave }: ScreenProps) => {
    const [comment, setComment] = useState("");
    const [spoilers, setSpoilers] = useState(false);
    const colorScheme = useColorScheme();

    return (
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background, height: Dimensions.screenHeight,}}>
            <SafeAreaView>
            <View style={styles.headerContainer}>
                <Pressable onPress={() => {
                    onClose();
                }}>
                {({ pressed }) => (
                    <Ionicons
                    name="close-circle"
                    size={35}
                    color={"red"}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                )}
                </Pressable>
                <Text style={{fontSize: 16, fontWeight: 'bold'}}>Comment</Text>
                {comment ? 
                <Pressable onPress={() => {
                    onSave(comment, spoilers);
                }}>
                {({ pressed }) => (
                    <Ionicons
                    name="checkmark-circle"
                    size={35}
                    color={"#32CD32"}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                )}
                </Pressable> : <View>
                <Ionicons
                    name="checkmark-circle"
                    size={35}
                    color={"#32CD32"}
                    style={{ opacity: 0.5 }}
                    />
                </View>}
            </View>
            </SafeAreaView>
            <TextInput
                multiline
                autoCapitalize="sentences"
                placeholder="Speak your mind..."
                value={comment}
                onChangeText={setComment}
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
                trackColor={{ false: Colors[colorScheme ?? 'light'].text, true: "#32CD32" }}
                thumbColor={Colors[colorScheme ?? 'light'].background}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setSpoilers(prev => !prev)}
                value={spoilers}
                />
            </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        width: '100%',
        padding: 10,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        zIndex: 1,
    },
    inputField: {
        width: Dimensions.screenWidth,
        padding: 10,
        flex: 1,
        fontSize: 16,
      },
    switchContainer: {
        flexDirection: 'row',
        width: '100%',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      spoilerText: {
        fontSize: 18,
        fontWeight: '300',
      },
})