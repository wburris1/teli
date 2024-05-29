import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { LoadingProvider } from '@/contexts/loading';

const screenWidth = Dimensions.get('window').width;

type Tab = {
    title: string,
    content: () => ReactElement
};

type Props = {
    tabs: Tab[],
    onTabChange: (index: number) => void
};

const SearchTabs = ({ tabs, onTabChange }: Props) => {
    const [tabIndex, setTabIndex] = useState(0);
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
                <Animated.View style={[styles.line, {left: indicatorPosition}]}/>
                {tabs.map((tab, index) => {
                    const active = index === tabIndex;
                    return (
                        <TouchableOpacity key={index} onPress={()=>handleTabPress(index)} style={active ? styles.activeTab : styles.tab}>
                            <Text style={active ? styles.activeTabText : styles.tabText}>{tab.title}</Text>
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
        backgroundColor: '#ccc',
        marginLeft: 5,
        marginRight: 5,
        padding: 5,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#000',
        width: (screenWidth / 2) - 10
    },
    activeTab: {
        alignItems: 'center',
        backgroundColor: '#fff',
        marginLeft: 5,
        marginRight: 5,
        padding: 5,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#000',
        width: (screenWidth / 2) - 10
    },
    tabText: {
        color: '#000'
    },
    activeTabText: {
        color: '#000'
    },
    line: {
        position: 'absolute',
        bottom: 0,
        width: (screenWidth / 2) - 10,
        height: 3,
        backgroundColor: '#000',
        borderRadius: 10,
        marginLeft: 5
    }
});

export default SearchTabs;