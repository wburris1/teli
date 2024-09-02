import { useCallback, useState } from 'react';
import { FeedPost } from '@/constants/ImportTypes';
import { serverTimestamp } from 'firebase/firestore';

const useModalState = () => {
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [post, setPost] = useState<FeedPost>({
    post_id: "", user_id: "", score: -1, list_type_id: "", profile_picture: "", first_name: "", last_name: "",
    num_comments: 0, likes: [], item_id: "", item_name: "", has_spoilers: false,
    created_at: serverTimestamp(), username: "", caption: "", poster_path: "", userPushToken: ""
  });
  const [incrementComment, setIncrementComment] = useState(false)

  const handleComments = (show: boolean, commentPost: FeedPost) => {
    setShowComments(show);
    setPost(commentPost);
  }

  const handleLikes = (show: boolean, feedPost: FeedPost) => {
    setShowLikes(show);
    setPost(feedPost);
  }

  const handleIncrementComment = () => {
    setIncrementComment((prev) => !prev);
  };
  
  return { showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment, setIncrementComment, incrementComment};
};

export default useModalState;
