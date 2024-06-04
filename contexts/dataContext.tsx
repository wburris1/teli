import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';

type DataContextType = {
    movies: UserItem[];
    setMovies: (items: UserItem[]) => void;
    shows: UserItem[];
    setShows: (items: UserItem[]) => void;
    tvLists: List[];
    setTVLists: (items: List[]) => void;
    movieLists: List[];
    setMovieLists: (items: List[]) => void;
    refreshFlag: boolean;
    requestRefresh: () => void;
};

type Props = {
    children: ReactNode;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<Props> = ({ children }: Props) => {
    const [movies, setMovies] = useState<UserItem[]>([]);
    const [shows, setShows] = useState<UserItem[]>([]);
    const [tvLists, setTVLists] = useState<List[]>([]);
    const [movieLists, setMovieLists] = useState<List[]>([]);
    const [refreshFlag, setRefreshFlag] = useState(false);

    const requestRefresh = useCallback(() => {
        setRefreshFlag(prev => !prev);
    }, []);

    return (
        <DataContext.Provider
            value={{ movies, setMovies, shows, setShows,
                tvLists, setTVLists, movieLists, setMovieLists,
                refreshFlag, requestRefresh }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};