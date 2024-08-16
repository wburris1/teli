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
    userPushToken: string | undefined,
    user_id: string,
}

export interface FeedPost extends Post {
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
    lists: string[],
    user_id: string,
    post_id: string,
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
    created_at: Timestamp | FieldValue | Date,
    num_replies: number,
}

export interface DisplayComment extends UserComment {
    profile_picture: string,
    username: string,
    first_name: string,
    last_name: string,
    userPushToken: string,
}

export enum NotificationType {
  LikedCommentNotification = "LikedCommentNotification",
  CommentNotification = "CommentNotification",
  FollowNotification = "FollowNotification",
  LikedPostNotification = "LikedPostNotification"
}

export type AppNotification = {
    noti_id: string,
    receiver_id: string,
    sender_id: string,
    sender_username: string,
    comment_id: string,
    profile_picture: string,
    created_at: Timestamp | FieldValue,
    notification_type: NotificationType
    item: FeedPost | null,
}

export type List = {
    list_id: string,
    name: string,
    is_custom: boolean,
    is_ranked: boolean,
    description: string,
    top_poster_path: string,
    second_poster_path: string,
    bottom_poster_path: string,
    last_modified: Timestamp | FieldValue,
}