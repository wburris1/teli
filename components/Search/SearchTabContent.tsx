import { useCallback, useEffect, useRef, useState } from "react";
import ItemScreen from "./SearchCard";
import { useItemSearch } from "@/data/itemData";
import _, { set } from 'lodash';
import { RenderGrid } from "../GridItems";

export const MoviesTabContent = ({ query, isAdding, addItems, outItems, setAddItems, setOutItems, listID }:
    { query: string, isAdding: boolean, addItems: Item[], outItems: Item[], 
    setAddItems: (items: Item[]) => void, setOutItems: (items: Item[]) => void, listID: string }) => {
    const [movieList, setMovieList] = useState<Item[]>([]);
    const [displayGrid, setDisplayGrid] = useState(true);
    const cachedResults = useRef<Item[] | null>(null);

    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
          if (!query && cachedResults.current) {
            setMovieList(cachedResults.current);
            setDisplayGrid(true);
          } else {
            const items = await useItemSearch(query, true);
            setMovieList(items);
            setDisplayGrid(query ? false : true);
            // Cache results when query is empty
            if (!query) {
              cachedResults.current = items;
            }
          }
        }, 300),[]
    );

    useEffect(() => {
        debouncedFetchData(query);
    }, [query, debouncedFetchData]);
    return (
      displayGrid ? <RenderGrid listID={listID} items={movieList} /> 
      : (<ItemScreen movieList={movieList} isAdding={isAdding} addItems={addItems} outItems={outItems}
         setAddItems={setAddItems} setOutItems={setOutItems} listID={listID} /> )
  )
};

export const ShowsTabContent = ({ query, isAdding, addItems, outItems, setAddItems, setOutItems, listID }:
    { query: string, isAdding: boolean, addItems: Item[], outItems: Item[], 
    setAddItems: (items: Item[]) => void, setOutItems: (items: Item[]) => void, listID: string }) => {
    const [tvList, setTvList] = useState<Item[]>([]);
    const [displayGrid, setDisplayGrid] = useState(true);
    const cachedResults = useRef<Item[] | null>(null);
    
    const debouncedFetchData = useCallback(
        _.debounce(async (query) => {
          if (!query && cachedResults.current) {
            setTvList(cachedResults.current);
            setDisplayGrid(true);
          } else {
            const items = await useItemSearch(query, false);
            setTvList(items);
            setDisplayGrid(query ? false : true);
            // Cache results when query is empty
            if (!query) {
              cachedResults.current = items;
            }
          }
        }, 300),[]
    );

    useEffect(() => {
        debouncedFetchData(query);
    }, [query, debouncedFetchData]);

    return (
      displayGrid ? <RenderGrid listID={listID} items={tvList} />
      : (<ItemScreen movieList={tvList} isAdding={isAdding} addItems={addItems} outItems={outItems}
        setAddItems={setAddItems} setOutItems={setOutItems} listID={listID} /> )
    )
};