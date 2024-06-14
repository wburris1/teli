import { FieldValue } from "firebase-admin/firestore";
import { Timestamp } from "firebase/firestore";

export type Post = {
    post_id: string,
    caption: string,
    item_id: string,
    poster_path: string,
    item_name: string,
    list_type_id: string,
    has_spoilers: boolean,
    comments: UserComment[],
    likes: string[],
    score: number,
    created_at: Timestamp | FieldValue,
}

type BaseUserItem = {
    item_id: string,
    item_name: string,
    poster_path: string,
    score: number,
    caption: string,
    has_spoilers: boolean,
    comments: UserComment[],
    likes: string[],
    created_at: Timestamp | FieldValue,
    list_type_id: string,
}

export interface UserMovie extends BaseUserItem {
    title: string,
    release_date: string,
}

export interface UserShow extends BaseUserItem {
    name: string,
    first_air_date: string,
}

export type UserItem = UserMovie | UserShow;