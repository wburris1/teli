import { useCallback, useState } from 'react';
import { FeedPost } from '@/constants/ImportTypes';
import { serverTimestamp } from 'firebase/firestore';
import { useData } from '@/contexts/dataContext';

const useModalState = () => {
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [post, setPost] = useState<any>({
    post_id: "", user_id: "", score: -1, list_type_id: "", profile_picture: "", first_name: "", last_name: "",
    num_comments: 0, likes: [], item_id: "", item_name: "", has_spoilers: false,
    created_at: serverTimestamp(), username: "", caption: "", poster_path: "", isMovie: false, backdrop_path: "", runtime: 0
  });
  const [incrementComment, setIncrementComment] = useState(false)

  const handleComments = (show: boolean, commentPost: any) => {
    setShowComments(show);
    setPost(commentPost);
  }

  const handleLikes = (show: boolean, feedPost: any) => {
    setShowLikes(show);
    setPost(feedPost);
  }

  const handleIncrementComment = () => {
    setIncrementComment((prev) => !prev);
  };
  
  return { incrementComment, showComments, showLikes, post, handleComments, handleLikes, setShowComments, setShowLikes, handleIncrementComment};
};

export default useModalState;
