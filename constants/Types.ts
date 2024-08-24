type UserData = {
    user_id: string,
    email: string,
    username: string,
    first_name: string,
    last_name: string,
    is_private: boolean,
    profile_picture: string,
    bio: string,
    userPushToken: string,
}

type BaseItem = {
    [key: string]: any;
    id: string,
    poster_path: string,
    overview: string,
    genres: { id: string, name: string }[],
    backdrop_path: string,
    tagline: string,
    vote_average: number,
    vote_count: number,
};

interface Movie extends BaseItem {
    title: string,
    release_date: string,
    revenue: number,
    budget: number,
    runtime: number,
}
  
interface Show extends BaseItem {
    name: string,
    first_air_date: string,
    number_of_episodes: number,
    number_of_seasons: number,
    episode_run_time: number,
}

type Item = Movie | Show;

