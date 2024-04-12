type Item = {
    id: string,
    title: string,
    poster_path: string,
    release_date: string,
    overview: string,
};

type MovieInfo = {
    id: string,
    genres: { id: string, name: string }[]
};