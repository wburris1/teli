import { CastMember } from '@/constants/ImportTypes';
import React, { useEffect, useState } from 'react'

const tmdbKey = "0d2333678b1855f85120aecc3077e72d";
const movieSearchUrl = "https://api.themoviedb.org/3/search/movie?api_key=";
const movieDiscoverUrl = "https://api.themoviedb.org/3/discover/movie?api_key=";
const movieDetailsUrl = "https://api.themoviedb.org/3/movie/";
const tvSearchUrl = "https://api.themoviedb.org/3/search/tv?api_key=";
const tvDiscoverUrl = "https://api.themoviedb.org/3/discover/tv?api_key=";
const tvDetailsUrl = "https://api.themoviedb.org/3/tv/";

export const useItemSearch = async (query: string, isMovie: boolean): Promise<Item[]> => {
    const baseUrl = isMovie ? movieSearchUrl : tvSearchUrl;
    let fetchUrl = baseUrl + tmdbKey + "&query=" + query;

    if (!query) {
        fetchUrl = isMovie ? movieDiscoverUrl + tmdbKey : tvDiscoverUrl + tmdbKey;
    }

    const response = await fetch(fetchUrl);
    const json = await response.json();
    return json.results;
};

export const useItemDetails = (id: string, isMovie: boolean) => {
    const [item, setItem] = useState<Item>();
    const [cast, setCast] = useState<CastMember[]>([]);
    const [reccomendations, setReccomendations] = useState<Item[]>([]);

    const baseUrl = isMovie ? movieDetailsUrl : tvDetailsUrl;
    const fetchUrl = baseUrl + id + "?api_key=" + tmdbKey;
    const castURL = `https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${id}/${isMovie ? 'credits' : 'aggregate_credits'}?api_key=${tmdbKey}`;
    const recURL = `https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${id}/recommendations?api_key=${tmdbKey}`

    const getCast = () => {
      fetch(isMovie? castURL : castURL)
        .then(res => res.json())
        .then(json => {
          const actorsArray = json.cast
          //.sort((a: CastMember, b: CastMember) => b.popularity - a.popularity) // Sort by popularity (descending)
          .slice(0, 20) // Get the first 20 actors
          .map((actor: any) => ({
              name: actor.name,
              popularity: actor.popularity,
              profile_path: actor.profile_path,
              character: isMovie ? actor.character // For movies, use the character directly
              : actor.roles && actor.roles.length > 0 ? actor.roles[0].character
              : '' // Fallback in case roles are empty or undefined
          } as CastMember));
          setCast(actorsArray)
        })
        .catch(error => console.error('Error Fetching Cast:', error));
    }
    const getItem = () => {
        fetch(fetchUrl)
        .then(res=>res.json())
        .then(json=>{
          setItem(json);
        })
    } 
    const getRecommendations = () => {
        fetch(recURL)
        .then(res=>res.json())
        .then(json=>{
          setReccomendations(json.results);
        })
        .catch(error => console.error(`Error fetching Recommendations: ${error}`))
    }
    useEffect(() => {
        getItem();
        getCast();
        getRecommendations();
    }, [id]);

    return {item: item as Item, cast, reccomendations: reccomendations as Item[]};
};
