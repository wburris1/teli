import { List } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { SafeAreaView, ScrollView, StyleSheet, useColorScheme } from "react-native";
import { Text, View } from "./Themed";
import { UserList } from "./UserList";
import Colors from "@/constants/Colors";
import Dimensions from "@/constants/Dimensions";

const filterWatched = (data: List[], watched: boolean) => {
    return data.filter(item => item.is_ranked === watched);
};
  
const reorderData = (data: List[], firstId: string, secondId: string) => {
    const firstItem = data.find(item => item.list_id === firstId);
    const restItems = data.filter(item => item.list_id !== firstId && item.list_id !== secondId);
    if (!firstItem) {
        return data;
    }
    return [firstItem, ...restItems];
};
  
const chunkLists = (lists: List[], size: number) => {
    var result: (List[])[] = [];
    if (lists.length <= 3) {
        result = [lists];
        return result;
    } else if (lists.length == 4) {
        result.push(lists.slice(0, 3));
        result.push(lists.slice(3, 4));
        return result;
    }
    for (let i = 0; i < lists.length; i += size) {
        result.push(lists.slice(i, i + size));
    }
    return result;
};
  
export const HorizontalListWithRows = ({lists, listTypeID, userID, isListTab, numRows }: {lists: List[], listTypeID: string, userID: string, isListTab: boolean, numRows: number}) => {
    const colorScheme = useColorScheme();
    // Watched lists
    const watchedLists = lists != null ? reorderData(filterWatched(lists, true), Values.seenListID, Values.bookmarkListID) : [];
  
    let numColumns = Math.ceil(watchedLists.length / numRows);
    const chunkedData = chunkLists(watchedLists, numColumns);
  
    // Unwatched lists
    const unwatchedLists = lists != null ? reorderData(filterWatched(lists, false), Values.bookmarkListID, Values.seenListID) : [];
    numColumns = Math.ceil(unwatchedLists.length / numRows);
    const chunkedUnwatched = chunkLists(unwatchedLists, numColumns);
  
    return (
        <ScrollView style={[styles.listsContainer, {paddingTop: !isListTab ? 45 : 0}]} showsVerticalScrollIndicator={false}>
        <View style={styles.topSeparator}>
            <Text style={styles.separatorText}>Watched</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection: 'column'}}>
            {chunkedData.map((row, rowIndex) => (
                <View key={rowIndex} style={[styles.row, styles.rowSpacing]}>
                {row.map(list => (
                    <UserList key={list.list_id} list={list} listTypeID={listTypeID} isListTab={isListTab} userID={userID} index={0} />
                ))}
                </View>
            ))}
            </View>
        </ScrollView>
        <View style={[styles.listSeparator, { borderColor: Colors[colorScheme ?? 'light'].text}]}>
            <Text style={styles.separatorText}>Unwatched</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection: 'column'}}>
            {chunkedUnwatched.map((row, rowIndex) => (
                <View key={rowIndex} style={[styles.row, styles.rowSpacing]}>
                {row.map(list => (
                    <UserList key={list.list_id} list={list} listTypeID={listTypeID} isListTab={isListTab} userID={userID} index={-1} />
                ))}
                </View>
            ))}
            </View>
        </ScrollView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listsContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    row: {
      flexDirection: 'row',
    },
    rowSpacing: {
      marginBottom: 20,
    },
    topSeparator: {
      flex: 1,
      width: Dimensions.screenWidth,
      padding: 10,
    },
    listSeparator: {
      flex: 1,
      width: Dimensions.screenWidth,
      marginTop: 10,
      padding: 10,
      borderTopWidth: 3,
    },
    separatorText: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'left',
    },
});