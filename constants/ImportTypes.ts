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
    num_comments: number,
    likes: string[],
    score: number,
    created_at: Timestamp | FieldValue,
}

export interface FeedPost extends Post {
    user_id: string,
    username: string,
    first_name: string,
    last_name: string,
    profile_picture: string,
}

type BaseUserItem = {
    item_id: string,
    item_name: string,
    poster_path: string,
    score: number,
    caption: string,
    has_spoilers: boolean,
    num_comments: number,
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

export type UserComment = {
    user_id: string,
    comment: string,
    likes: string[],
    created_at: Timestamp | FieldValue,
    num_replies: number,
}

export interface DisplayComment extends UserComment {
    comment_id: string,
    profile_picture: string,
    username: string,
    first_name: string,
    last_name: string,
}