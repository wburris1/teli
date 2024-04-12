import { useLoading } from '@/contexts/loading';
import React, { useEffect, useState } from 'react'

const tmdbKey = "0d2333678b1855f85120aecc3077e72d";
const tvSearchUrl = "https://api.themoviedb.org/3/search/tv?api_key=";
const tvDiscoverUrl = "https://api.themoviedb.org/3/discover/tv?api_key=";

export const useTVSearch = (query: string) => {
    const [TVList, setTVList] = useState<Item[]>([]);
    const { setLoading } = useLoading();
    
    var fetchUrl = tvSearchUrl + tmdbKey + "&query=" + query;

    if (!query) {
        fetchUrl = tvDiscoverUrl + tmdbKey;
    }

    const getTV = () => {
        setLoading(true);
        fetch(fetchUrl)
        .then(res=>res.json())
        .then(json=>setTVList(json.results))
    }

    useEffect(() => {
        getTV();
    }, [query]);

    return TVList;
};