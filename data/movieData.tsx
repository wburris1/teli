import { useLoading } from '@/contexts/loading';
import React, { useEffect, useState } from 'react'

const tmdbKey = "0d2333678b1855f85120aecc3077e72d";
const movieSearchUrl = "https://api.themoviedb.org/3/search/movie?api_key=";
const movieDiscoverUrl = "https://api.themoviedb.org/3/discover/movie?api_key=";
const movieDetailsUrl = "https://api.themoviedb.org/3/movie/";

export const useMovieSearch = (query: string) => {
    const [movieList, setMovieList] = useState<Item[]>([]);
    const { setLoading } = useLoading();

    var fetchUrl = movieSearchUrl + tmdbKey + "&query=" + query;

    if (!query) {
        fetchUrl = movieDiscoverUrl + tmdbKey;
    }

    const getMovie = () => {
        setLoading(true);
        fetch(fetchUrl)
        .then(res=>res.json())
        .then(json=>{
            setMovieList(json.results);
            //console.log(json.results);
        })
    }

    useEffect(() => {
        getMovie();
    }, [query]);


    return movieList;
};

export const useMovieDetails = (id: string) => {
    const [movie, setMovie] = useState<MovieInfo>();

    const fetchUrl = movieDetailsUrl + id + "?api_key=" + tmdbKey;

    const getMovie = () => {
        fetch(fetchUrl)
        .then(res=>res.json())
        .then(json=>{
            setMovie(json);
        })
    }

    useEffect(() => {
        getMovie();
    }, [id]);


    return movie;
};