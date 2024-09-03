import { useCallback, useEffect, useState } from "react";
import ItemScreen from "./SearchCard";
import { useItemSearch } from "@/data/itemData";
import _ from 'lodash';
import { RenderGrid } from "../GridItems";

export const MoviesTabContent = ({ query, isAdding, addItems, outItems, setAddItems, setOutItems, listID }:
    { query: string, isAdding: boolean, addItems: Item[], outItems: Item[], 
    setAddItems: (items: Item[]) => void, setOutItems: (items: Item[]) => void, listID: string }) => {
    const [movieList, setMovieList] = useState<Item[]>([]);

    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
            const items = await useItemSearch(query, true);
            setMovieList(items);
        }, 300),
        []
    );

    useEffect(() => {
        debouncedFetchData(query);
    }, [query, debouncedFetchData]);
    // <ItemScreen movieList={movieList} isAdding={isAdding} addItems={addItems} outItems={outItems}
    // setAddItems={setAddItems} setOutItems={setOutItems} listID={listID} />
    return <RenderGrid listID={listID} items={movieList} />
};

export const ShowsTabContent = ({ query, isAdding, addItems, outItems, setAddItems, setOutItems, listID }:
    { query: string, isAdding: boolean, addItems: Item[], outItems: Item[], 
    setAddItems: (items: Item[]) => void, setOutItems: (items: Item[]) => void, listID: string }) => {
    const [tvList, setTvList] = useState<Item[]>([]);
    
    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
            const items = await useItemSearch(query, false);
            setTvList(items);
        }, 300),
        []
    );

    useEffect(() => {
        debouncedFetchData(query);
    }, [query, debouncedFetchData]);

    return <RenderGrid listID={listID} items={tvList} />

    // return <ItemScreen movieList={tvList} isAdding={isAdding} addItems={addItems} outItems={outItems}
    // setAddItems={setAddItems} setOutItems={setOutItems} listID={listID} />;
};