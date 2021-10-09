import {createContext, useState} from "react";

export const PostsSubscribedContext = createContext({
  postsSubscribed: [],
  initPostsSubscribed: () => {},
  updatePostsSubscribed: () => {},
  removePostSubscribed: () => {}
});

const PostsSubscribedProvider = ({children}) => {
  const [postsSubscribed, setPostsSubscribed] = useState([]);

  // Inicializar los posts a los que el usuario está suscrito
  const initPostsSubscribed = (postId) => {
    setPostsSubscribed(postId);
  }

  // Agregar un post a los posts suscritos
  const updatePostsSubscribed = (postId) => {
    setPostsSubscribed(prev => [...prev, postId]);
  }

  // Remover un post de los posts suscritos
  const removePostSubscribed = (postId) => {
    setPostsSubscribed(prev => {
      return [...prev].filter(el => el.toString() !== postId.toString());
    });
  }

  return (
    <PostsSubscribedContext.Provider
      value={{
        postsSubscribed,
        initPostsSubscribed,
        updatePostsSubscribed,
        removePostSubscribed
      }}
    >
      {children}
    </PostsSubscribedContext.Provider>
  )
}

export default PostsSubscribedProvider;
