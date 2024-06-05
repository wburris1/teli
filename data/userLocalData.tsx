import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeDataLocally = async (key: string, value: any) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e: any) {
      console.error('Error saving data locally', e);
    }
};

export const getDataLocally = async (key: string) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e: any) {
      console.error('Error reading data locally', e);
    }
};
