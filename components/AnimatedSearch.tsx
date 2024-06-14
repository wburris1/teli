import Colors from "@/constants/Colors";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import SearchInput from "./Search/SearchInput";

export const AnimatedSearch = ({ searchVisible, search, handleSearch } : { searchVisible: boolean, search: string, handleSearch: (query: string) => void, }) => {
    const searchInputHeight = useSharedValue(0);
    const colorScheme = useColorScheme();

    const searchInputStyle = useAnimatedStyle(() => {
        return {
          height: searchInputHeight.value,
          opacity: interpolate(searchInputHeight.value, [0, 50], [0, 1]),
        };
      });
  
      useEffect(() => {
        if (searchVisible) {
          searchInputHeight.value = 0;
          searchInputHeight.value = withSpring(50);
        } else {
          handleSearch("");
          searchInputHeight.value = 50;
          searchInputHeight.value = withSpring(0);
        }
      }, [searchVisible]);

      return (
        <>
          {searchVisible && <Animated.View style={[searchInputStyle, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
            <SearchInput search={search} setSearch={handleSearch} isFocused={true} />
          </Animated.View>}
        </>
      )
}