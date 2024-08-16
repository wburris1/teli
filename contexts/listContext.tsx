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
  item: UserItem,
  setItem: (item: UserItem) => void;
}

type Props = {
    children: ReactNode;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

export const ListProvider: React.FC<Props> = ({ children }: Props) => {
  const placeholderItem: UserItem = {
    item_id: "",
    title: "",
    release_date: "",
    poster_path: "",
    score: 0,
    has_spoilers: false,
    caption: "",
    num_comments: 0,
    likes: [],
    created_at: serverTimestamp(),
    item_name: "",
    list_type_id: "",
    lists: [],
    user_id: '',
    post_id: ''
  };
  const [activeTab, setActiveTab] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedLists, setSelectedLists] = useState<List[]>([]);
  const [removeLists, setRemoveLists] = useState<List[]>([]);
  const [item, setItem] = useState<UserItem>(placeholderItem);

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