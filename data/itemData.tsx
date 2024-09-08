import { CastMember } from '@/constants/ImportTypes';
import React, { useEffect, useState } from 'react'

const tmdbKey = "0d2333678b1855f85120aecc3077e72d";
const movieSearchUrl = "https://api.themoviedb.org/3/search/movie?api_key=";
const movieDiscoverUrl = "https://api.themoviedb.org/3/discover/movie?api_key=";
// const movieDiscoverUrl = 'https://api.themoviedb.org/3/movie/upcoming?api_key='

const movieDetailsUrl = "https://api.themoviedb.org/3/movie/";
const tvSearchUrl = "https://api.themoviedb.org/3/search/tv?api_key=";
const tvDiscoverUrl = "https://api.themoviedb.org/3/discover/tv?api_key=";
const tvDetailsUrl = "https://api.themoviedb.org/3/tv/";

export const useItemSearch = async (query: string, isMovie: boolean, startPage = 1): Promise<Item[]> => {
    const baseUrl = isMovie ? movieSearchUrl : tvSearchUrl;
    let fetchUrl = baseUrl + tmdbKey + "&query=" + query;
    let allResults: Item[] = [];

    if (!query) {
      allResults = await fetchMoreItems(1, isMovie)
    } else {
      const response = await fetch(fetchUrl);
      const json = await response.json();
      allResults = json.results;
    }
    // Use a Map to filter out duplicates based on unique id
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.id, item])).values()
    );
    return uniqueResults;
};

export const fetchMoreItems = async (startPage = 1, isMovie: boolean): Promise<Item[]> => {
  const promises = [];
  const baseUrl = isMovie ? movieSearchUrl : tvSearchUrl;
  let fetchUrl = baseUrl + tmdbKey + "&query=";
  fetchUrl = (isMovie ? movieDiscoverUrl : tvDiscoverUrl) + tmdbKey;
  let allResults: Item[] = [];

  for (let page = startPage; page < startPage + 1; page++) { // 6 pages would return 120 results
    const pageUrl = fetchUrl + "&page=" + page;
    promises.push(fetch(pageUrl).then(res => res.json()));
  }
  const resultsArray = await Promise.all(promises);
  resultsArray.forEach(pageJson => {
      allResults = allResults.concat(pageJson.results);
  });
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.id, item])).values()
  );
  return uniqueResults;
};

export const useItemDetails = (id: string, isMovie: boolean) => {
    const [item, setItem] = useState<Item>();
    const [cast, setCast] = useState<CastMember[]>([]);
    const [director, setDirector] = useState<CastMember>();
    const [reccomendations, setReccomendations] = useState<Item[]>([]);

    const baseUrl = isMovie ? movieDetailsUrl : tvDetailsUrl;
    const fetchUrl = baseUrl + id + "?api_key=" + tmdbKey;
    const castURL = `https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${id}/${isMovie ? 'credits' : 'aggregate_credits'}?api_key=${tmdbKey}`;
    const recURL = `https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${id}/recommendations?api_key=${tmdbKey}`

    const getCast = () => {
      fetch(castURL)
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
          const director = json.crew.find((member: any) => member.job === 'Director');
          setDirector(director);
          setCast(actorsArray);
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

    return {item: item as Item, director, cast, reccomendations: reccomendations as Item[]};
};
