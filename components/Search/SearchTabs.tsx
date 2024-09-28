import { StyleSheet, TouchableOpacity, Dimensions, Animated, useColorScheme } from 'react-native';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { LoadingProvider } from '@/contexts/loading';
import Colors from '@/constants/Colors';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from '../Themed';

const screenWidth = Dimensions.get('window').width;

type Tab = {
    title: string,
    content: () => ReactElement
};

type Props = {
    tabs: Tab[],
    onTabChange: (index: number) => void
    index: number
    browse: boolean
};

const SearchTabs = ({ tabs, onTabChange, index, browse }: Props) => {
    const colorScheme = useColorScheme();
    const [tabIndex, setTabIndex] = useState(index);
    const indicatorPosition = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(indicatorPosition, {
          toValue: tabIndex * (screenWidth / tabs.length),
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, [tabIndex]);
    
      const handleTabPress = (index: number) => {
        setTabIndex(index);
        onTabChange(index);
      };

    const browseText = useCallback(() => {
        return (
            browse && tabIndex != 2 && <View style={styles.browseTextContainer}>
            <Text style={{fontSize: screenWidth  > 400 ? 24 : 20, fontWeight: 'bold',
              zIndex: 3}}>Browse</Text>
            </View>
        )
    }, [browse, tabIndex])

    return (
        <View style={styles.container}>
            <View style={styles.tabs}>
                <Animated.View style={[styles.line, {left: indicatorPosition, width: screenWidth / tabs.length}]}/>
                <View style={styles.separatorLine}/>
                {tabs.map((tab, index) => {
                    const active = index === tabIndex;
                    return (
                        <TouchableOpacity key={index} onPress={()=>handleTabPress(index)} style={[active ? styles.activeTab : styles.tab, {width: screenWidth / tabs.length}]}>
                            <Text style={active ? [styles.activeTabText, { color: Colors[colorScheme ?? 'light'].text}] : styles.tabText}>{tab.title}</Text>
                        </TouchableOpacity>
                    );
                })}
                
            </View>
            {browseText()}
            <LoadingProvider>
                {tabs[tabIndex].content()}
            </LoadingProvider>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        zIndex: 3,
    },
    browseTextContainer: {
      zIndex: 2,
      width: screenWidth,
      backgroundColor: 'transparent',
      paddingHorizontal: 5,
      paddingTop: 5,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 10,
        width: screenWidth
    },
    tab: {
        alignItems: 'center',
        padding: 5,
        borderColor: '#000',
    },
    activeTab: {
        alignItems: 'center',
        padding: 5,
        borderColor: '#000',
    },
    tabText: {
        fontSize: 16,
        color: 'gray'
    },
    activeTabText: {
        fontSize: 16,
        color: '#000'
    },
    line: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        borderRadius: 2,
        zIndex: 1,
        backgroundColor: Colors['theme']
    },
    separatorLine: {
        position: 'absolute',
        bottom: 0,
        width: screenWidth,
        height: 1,
        borderRadius: 0,
        backgroundColor: '#d3d3d3'
    },
});

export default SearchTabs;