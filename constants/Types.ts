type BaseItem = {
    [key: string]: any;
    id: string,
    poster_path: string,
    overview: string,
};

interface Movie extends BaseItem {
    title: string,
    release_date: string,
}
  
interface Show extends BaseItem {
    name: string,
    first_air_date: string,
}

interface ItemInfo extends BaseItem {
    genres: { id: string, name: string }[]
};

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
