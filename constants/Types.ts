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
};

interface Movie extends BaseItem {
    title: string,
    release_date: string,
}
  
interface Show extends BaseItem {
    name: string,
    first_air_date: string,
}

type Item = Movie | Show;

type List = {
    list_id: string,
    name: string,
    is_custom: boolean,
    is_ranked: boolean,
    description: string,
    top_poster_path: string,
    second_poster_path: string,
    bottom_poster_path: string,
}
