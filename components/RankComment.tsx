import { useState } from "react";
import { Text, View } from "./Themed";
import { Pressable, StyleSheet, TextInput, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

type ScreenProps = {
    onClose: () => void;
    onSave: (comment: string) => void;
}

export const CommentModalScreen = ({ onClose, onSave }: ScreenProps) => {
    const [comment, setComment] = useState("");
    const colorScheme = useColorScheme();

    return (
        <View style={styles.container}>
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
                <Pressable onPress={() => {
                    onSave(comment);
                }}>
                {({ pressed }) => (
                    <Ionicons
                    name="checkmark-circle"
                    size={35}
                    color={"#32CD32"}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                )}
                </Pressable>
            </View>
            <TextInput
                multiline
                autoCapitalize="sentences"
                placeholder="Add comment..."
                value={comment}
                onChangeText={setComment}
                style={[styles.inputField,
                    { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text,
                        color: Colors[colorScheme ?? 'light'].text,
                    }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 10,
        paddingTop: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        zIndex: 1,
        paddingTop: 50,
    },
    inputField: {
        width: '100%',
        padding: 10,
        margin: 10,
        height: 150,
        fontSize: 16,
        borderBottomWidth: 1,
    },
})