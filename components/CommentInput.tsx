import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useEffect, useRef } from "react";

export const CommentInput = ({replyUsername, comment, setComment, handleComment, setReplyUsername, setReplyCommentID, focus}: {
    replyUsername: string, comment: string, setComment: (cmt: string) => void, handleComment: () => void,
    setReplyUsername: (name: string) => void, setReplyCommentID: (id: string) => void, focus: number
}) => {
    const colorScheme = useColorScheme();
    const textInputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (replyUsername) {
            focusInput();
        }
    }, [replyUsername])

    useEffect(() => {
        if (focus > 0) {
            focusInput();
        }
    }, [focus])

    const focusInput = () => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{position: 'absolute', bottom: 0, width: '100%', zIndex: 1}}
        >
            <View style={styles.inputContainer}>
                {replyUsername != "" && (
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 5,}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Ionicons name="caret-forward" size={20} color={Colors[colorScheme ?? 'light'].text} />
                        <Text style={styles.replyText}>Replying to <Text style={styles.username}>@{replyUsername}</Text></Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                        setReplyUsername('');
                        setReplyCommentID('');
                    }}>
                        <Ionicons name="close" size={20} color={Colors[colorScheme ?? 'light'].text} />
                    </TouchableOpacity>
                    </View>
                )}
                <View style={{flexDirection: 'row', flex: 1, alignItems: 'center'}}>
                    <TextInput
                        ref={textInputRef}
                        placeholder="Write a comment..."
                        placeholderTextColor="#999"
                        value={comment}
                        onChangeText={setComment}
                        style={[styles.input,{color: Colors[colorScheme ?? 'light'].text,}]}
                    />
                    {comment != "" && (
                    <TouchableOpacity onPress={handleComment} style={{
                        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7,
                        backgroundColor: Colors[colorScheme ?? 'light'].text,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].background}}>Post</Text>
                    </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        width: '100%',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      input: {
        height: 40,
        fontSize: 16,
        paddingRight: 5,
        flex: 1,
      },
      username: {
        fontSize: 14,
        fontWeight: '300',
      },
      replyText: {
        fontSize: 14,
        fontWeight: '400',
        paddingHorizontal: 3,
      }
})