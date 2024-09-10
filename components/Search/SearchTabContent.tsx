import { useCallback, useEffect, useRef, useState } from "react";
import ItemScreen from "./SearchCard";
import { fetchMoreItems, useItemSearch } from "@/data/itemData";
import _, { set } from 'lodash';
import { RenderGrid } from "../GridItems";

export const MoviesTabContent = ({ query, isPosting, isAdding, addItems, outItems, setAddItems, setOutItems, listID }:
    { query: string, isPosting: boolean, isAdding: boolean, addItems: Item[], outItems: Item[], 
    setAddItems: (items: Item[]) => void, setOutItems: (items: Item[]) => void, listID: string }) => {
    const [movieList, setMovieList] = useState<Item[]>([]);
    const [displayGrid, setDisplayGrid] = useState(true);
    const cachedResults = useRef<Item[] | null>(null);
    const startPage = useRef(2);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

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
    const loadMore = async () => {
      setIsLoadingMore(true);
      const newItems = await fetchMoreItems(startPage.current, true)
      setMovieList([...movieList, ...newItems]);
      setIsLoadingMore(false);
      startPage.current += 1;
    }

    useEffect(() => {
        debouncedFetchData(query);
    }, [query, debouncedFetchData]);
    return (
      displayGrid && !isAdding ? <RenderGrid listID={listID} items={movieList} isLoadingMore={isLoadingMore} loadMoreItems={loadMore} isPosting={isPosting} /> 
      : (<ItemScreen movieList={movieList} isAdding={isAdding} addItems={addItems} outItems={outItems}
         setAddItems={setAddItems} setOutItems={setOutItems} listID={listID} isPosting={isPosting} /> )
  )
};

export const ShowsTabContent = ({ query, isPosting, isAdding, addItems, outItems, setAddItems, setOutItems, listID }:
    { query: string, isPosting: boolean, isAdding: boolean, addItems: Item[], outItems: Item[], 
    setAddItems: (items: Item[]) => void, setOutItems: (items: Item[]) => void, listID: string }) => {
    const [tvList, setTvList] = useState<Item[]>([]);
    const [displayGrid, setDisplayGrid] = useState(true);
    const cachedResults = useRef<Item[] | null>(null);
    const startPage = useRef(2);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
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
    const loadMore = async () => {
      setIsLoadingMore(true);
      const newItems = await fetchMoreItems(startPage.current, false)
      setTvList([...tvList, ...newItems]);
      setIsLoadingMore(false);
      startPage.current += 1;
    }

    return (
      displayGrid && !isAdding ? <RenderGrid listID={listID} items={tvList} isLoadingMore={isLoadingMore} loadMoreItems={loadMore} isPosting={isPosting} />
      : (<ItemScreen movieList={tvList} isAdding={isAdding} addItems={addItems} outItems={outItems}
        setAddItems={setAddItems} setOutItems={setOutItems} listID={listID} isPosting={isPosting} /> )
    )
};