import { Link } from "expo-router"
import { Text, View } from "../Themed"
import { FlatList, Image, StyleSheet, TouchableOpacity } from "react-native"

export const UsersListScreen = ({users, redirectPath}: {users: UserData[], redirectPath: string}) => {
    const renderItem = ({item, index}: {item: UserData, index: number}) => {
        return (
            <View key={item.user_id}>
                <Link href={{pathname: redirectPath, params: { userID: item.user_id }}} asChild>
                    <TouchableOpacity style={styles.userContainer}>
                        <Image
                            source={{ uri: item.profile_picture }}
                            style={styles.image}
                        />
                        <View>
                            <Text style={styles.name}>{item.first_name + " " + item.last_name}</Text>
                            <Text style={styles.username}>{item.username}</Text>
                        </View>
                    </TouchableOpacity>
                </Link>
            </View>
        )
    }

    return (
        <View style={styles.list}>
            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={item => item.user_id}
                numColumns={1}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    list: {
        paddingBottom: 15
    },
    userContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
    },
    image: {
        width: 60,
        aspectRatio: 1,
        borderRadius: 50,
        backgroundColor: 'gray',
        marginRight: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: '500',
    },
    username: {
        fontSize: 16,
        fontWeight: '300',
    }
})