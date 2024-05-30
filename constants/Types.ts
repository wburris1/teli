type BaseItem = {
    [key: string]: any;
    id: string,
    poster_path: string,
    overview: string,
    genres: { id: string, name: string }[]
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

type BaseUserItem = {
    item_id: string,
    poster_path: string,
    score: number
}

interface UserMovie extends BaseUserItem {
    title: string,
    release_date: string,
}

interface UserShow extends BaseUserItem {
    name: string,
    first_air_date: string,
}

type UserItem = UserMovie | UserShow;

type List = {
    list_id: string,
    is_ranked: boolean,
    top_poster_path: string,
    second_poster_path: string,
    bottom_poster_path: string,
}
