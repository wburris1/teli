import { useLoading } from '@/contexts/loading';
import React, { useEffect, useState } from 'react'

const tmdbKey = "0d2333678b1855f85120aecc3077e72d";
const movieSearchUrl = "https://api.themoviedb.org/3/search/movie?api_key=";
const movieDiscoverUrl = "https://api.themoviedb.org/3/discover/movie?api_key=";
const movieDetailsUrl = "https://api.themoviedb.org/3/movie/";
const tvSearchUrl = "https://api.themoviedb.org/3/search/tv?api_key=";
const tvDiscoverUrl = "https://api.themoviedb.org/3/discover/tv?api_key=";
const tvDetailsUrl = "https://api.themoviedb.org/3/tv/";

export const useItemSearch = (query: string, isMovie: boolean) => {
    const [itemList, setItemList] = useState<Item[]>([]);
    const { setLoading } = useLoading();

    const baseUrl = isMovie ? movieSearchUrl : tvSearchUrl;
    var fetchUrl = baseUrl + tmdbKey + "&query=" + query;

    if (!query) {
        fetchUrl = isMovie ? movieDiscoverUrl + tmdbKey : tvDiscoverUrl + tmdbKey;
    }

    const getItem = () => {
        setLoading(true);
        fetch(fetchUrl)
        .then(res=>res.json())
        .then(json=>{
            setItemList(json.results);
            //console.log(json.results);
        })
    }

    useEffect(() => {
        getItem();
    }, [query]);


    return itemList;
};

export const useItemDetails = (id: string, isMovie: boolean) => {
    const [item, setItem] = useState<Item>();

    const baseUrl = isMovie ? movieDetailsUrl : tvDetailsUrl;
    const fetchUrl = baseUrl + id + "?api_key=" + tmdbKey;

    const getItem = () => {
        fetch(fetchUrl)
        .then(res=>res.json())
        .then(json=>{
            setItem(json);
        })
    }

    useEffect(() => {
        getItem();
    }, [id]);


    return item as Item;
};
