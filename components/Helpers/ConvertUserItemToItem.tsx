import { UserItem } from "@/constants/ImportTypes";

function convertUserItemToItem(userItem: UserItem): Item {
  const baseItem = {
    id: userItem.item_id,
    poster_path: userItem.poster_path,
    overview: userItem.caption, // Assuming `caption` is similar to `overview`
    genres: [], // Assuming no direct mapping for genres; you may need to adjust this
    backdrop_path: '', // Set to empty or map if available
    tagline: '', // Set to empty or map if available
    vote_average: userItem.score,
    vote_count: userItem.likes.length,
  };

  if ('title' in userItem) {
    // UserItem is a UserMovie
    return {
      ...baseItem,
      title: userItem.item_name,
      release_date: userItem.release_date,
      revenue: 0, // Set to a default or map from UserItem if applicable
      budget: 0, // Set to a default or map from UserItem if applicable
      runtime: 0, // Set to a default or map from UserItem if applicable
    };
  } else {
    // UserItem is a UserShow
    return {
      ...baseItem,
      name: userItem.item_name,
      first_air_date: userItem.first_air_date,
      number_of_episodes: 0, // Set to a default or map from UserItem if applicable
      number_of_seasons: 0, // Set to a default or map from UserItem if applicable
      episode_run_time: 0, // Set to a default or map from UserItem if applicable
    } ;
  }
};
export default convertUserItemToItem;