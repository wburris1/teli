import React, { ReactNode, createContext, useContext, useState } from 'react';

interface ListContextType {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

type Props = {
    children: ReactNode;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

export const ListProvider: React.FC<Props> = ({ children }: Props) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <ListContext.Provider value={{ activeTab, setActiveTab }}>
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