import { View, Text, StyleSheet, TouchableOpacity, Animated, useColorScheme, LayoutChangeEvent } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';

// COMPLETELY UNUSED RIGHT NOW. Could be helpful down the road, prob not tho

const screenHeight = Dimensions.screenHeight;
const offset = 130;

type Props = {
  title: string;
  children: React.ReactNode;
};

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ListTab = ({ title, children }: Props) => {
  const [buttonLayout, setButtonLayout] = useState<Layout | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownHeight, setDropdownHeight] = useState(new Animated.Value(0));
  const [animationInProgress, setAnimationInProgress] = useState(false);

  const colorScheme = useColorScheme();

  const onButtonLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    setButtonLayout({
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height
    });
  };

  const calculateDistance = () => {
    return screenHeight - (buttonLayout!.y + buttonLayout!.height) - offset;
  };

  const toggleOpen = () => {
    if (!buttonLayout || animationInProgress) return;

    setAnimationInProgress(true); // Lock further interactions

    const finalValue = isOpen ? 0 : calculateDistance(); // Use a function to calculate this based on stable values

    Animated.timing(dropdownHeight, {
        toValue: finalValue,
        duration: 300,
        useNativeDriver: false
    }).start(() => {
        setIsOpen(!isOpen);
        setAnimationInProgress(false); // Unlock after animation
    });
};

  return (
    <View onLayout={onButtonLayout}>
      <TouchableOpacity style={styles.tab} onPress={toggleOpen}>
        <Text style={styles.tabText}>{title}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={25}
          color={Colors[colorScheme ?? 'light'].text}
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>
      <Animated.View style={{ height: dropdownHeight }}>
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tab: {
      padding: 10,
      backgroundColor: '#ffff',
      borderBottomWidth: 2,
      borderBottomColor: '#000000',
      flexDirection: 'row',
      alignItems: 'center',
  },
  tabText: {
      fontSize: 24,
      paddingVertical: 20,
      paddingHorizontal: 10,
  },
  content: {
      overflow: 'hidden',
      backgroundColor: '#fff',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 10
  },
});

export default ListTab;