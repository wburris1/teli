import { List, UserItem } from '@/constants/ImportTypes';
import { serverTimestamp } from 'firebase/firestore';
import React, { ReactNode, createContext, useContext, useState } from 'react';

interface ListContextType {
  activeTab: number;
  setActiveTab: (index: number) => void;
  addModalVisible: boolean,
  setAddModalVisible: (modalVisible: boolean) => void;
  selectedLists: List[],
  setSelectedLists: (lists: List[]) => void;
  removeLists: List[],
  setRemoveLists: (lists: List[]) => void;
  item: UserItem | undefined,
  setItem: (item: UserItem) => void;
}

type Props = {
    children: ReactNode;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

export const ListProvider: React.FC<Props> = ({ children }: Props) => {
  const [activeTab, setActiveTab] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedLists, setSelectedLists] = useState<List[]>([]);
  const [removeLists, setRemoveLists] = useState<List[]>([]);
  const [item, setItem] = useState<UserItem | undefined>();

  return (
    <ListContext.Provider value={{
        activeTab, setActiveTab, addModalVisible, setAddModalVisible,
        selectedLists, setSelectedLists, removeLists, setRemoveLists, item, setItem
      }}>
      {children}
    </ListContext.Provider>
  );
};

export const useTab = (): ListContextType => {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error('useTab must be used within a ListProvider');
  }
  return context;
};