import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, useColorScheme } from 'react-native';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { LoadingProvider } from '@/contexts/loading';
import Colors from '@/constants/Colors';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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

const SearchTabs = ({ tabs, onTabChange, index}: Props) => {
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
                
                <View style={styles.browseTextContainer}>
                  <Text style={{fontSize: screenWidth  > 400 ? 24 : 20, fontWeight: 'bold',
                  top: 2, left: 5, zIndex: 2}}>Browse</Text>
                </View>
                <LinearGradient colors={[Colors[colorScheme ?? 'light'].background,
                  colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent']}
                  style={{height: screenWidth > 400 ? 35 : 30, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1}} />
            



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
        zIndex: 3
    },
    browseTextContainer: {
      position: 'absolute',
      top: 2,
      left: 5,
      zIndex: 2,
      width: '100%', // Ensure full-width
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