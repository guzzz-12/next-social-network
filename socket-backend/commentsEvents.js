const {postsAndUsers, subscribeUserToPost, unsubscribeUserFromPost} = require("../utilsServer/socketActions");

// Suscribir usuario a un post
const subscribeUser = (socketId, data) => {
  const {postId, userId} = data;
  subscribeUserToPost(postId, userId, socketId);
}

// Desuscribir usuario de un post
const unsubscribeUser = (data) => {
  const {postId, userId} = data;
  unsubscribeUserFromPost(postId, userId)
}

// Emitir el evento de nuevo comentario a los usuarios suscritos a un post
const commentAdded = (io, data) => {
  const {postId, comment} = data;
  const commentAuthor = comment.author._id.toString();

  // Buscar los usuario suscritos al post y filtrar al autor del comentario
  const posts = postsAndUsers.filter(item => item.postId === postId && item.user.userId !== commentAuthor);

  // Extraer los sockets id de los usuarios sucritos al post y emitirles el evento
  const usersSockets = posts.map(el => el.user.socketId);
  usersSockets.forEach(item => {
    io.to(item).emit("newComment", comment);
  })
}

// Emitir el evento de comentario eliminado a los usuarios suscritos al post
const commentDeleted = (io, data) => {
  const {comment} = data;
  const commentId = comment._id.toString();
  const postId = comment.commentedPost.toString();
  const commentAuthor = comment.author.toString();

  // Buscar los usuario suscritos al post y filtrar al autor del comentario
  const posts = postsAndUsers.filter(item => item.postId === postId && item.user.userId !== commentAuthor);

  // Extraer los socket id de los usuarios suscritos al post y emitirles el evento de comentario eliminado
  const usersSockets = posts.map(el => el.user.socketId);
  usersSockets.forEach(item => {
    io.to(item).emit("deletedComment", commentId);
  })
}

module.exports = {
  subscribeUser,
  unsubscribeUser,
  commentAdded,
  commentDeleted
}