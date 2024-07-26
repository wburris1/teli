import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, useColorScheme } from 'react-native';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { LoadingProvider } from '@/contexts/loading';
import Colors from '@/constants/Colors';
import { useLocalSearchParams } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

type Tab = {
    title: string,
    content: () => ReactElement
};

type Props = {
    tabs: Tab[],
    onTabChange: (index: number) => void
    index: number
};

const SearchTabs = ({ tabs, onTabChange, index }: Props) => {
    const colorScheme = useColorScheme();
    const [tabIndex, setTabIndex] = useState(0);
    const indicatorPosition = useRef(new Animated.Value(0)).current;
    const tab = useLocalSearchParams();
    if (tab.whichTab != undefined){
    const num = tab.whichTab as string;
    //this is the tab number passed in 
    const whichTab = parseInt(num);
    const [startingTab, setStartingTab] = useState(whichTab);
    const [originalTab, setOriginalTab] = useState(whichTab);
    //if the original tab is different from whichTab it means the page needs to be re-rendered
    if (originalTab != whichTab){
        setStartingTab(whichTab);
        setOriginalTab(startingTab);
    }
    //sets the tab index to the startingTab and then changes the starting tab so that it doesn't re-render
    if(startingTab != tabIndex && startingTab != 97){
        setTabIndex(startingTab);
        setStartingTab(97);
    }
  }

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

    return (
        <View style={styles.container}>
            <View style={styles.tabs}>
                <Animated.View style={[styles.line, {left: indicatorPosition, backgroundColor: Colors[colorScheme ?? 'light'].text, width: screenWidth / tabs.length}]}/>
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
            <LoadingProvider>
                {tabs[tabIndex].content()}
            </LoadingProvider>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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