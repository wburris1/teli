type Item = {
    id: string,
    title: string,
    poster_path: string,
    release_date: string,
    overview: string,
};

type UserMovie = {
    movie_id: string,
    title: string,
    poster_path: string,
    score: number
}

type MovieInfo = {
    id: string,
    genres: { id: string, name: string }[]
};