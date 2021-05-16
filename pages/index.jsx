import {useEffect, useState, useContext} from "react";
import Head from "next/head";
import {Segment} from "semantic-ui-react";
import jwt from "jsonwebtoken";
import {parseCookies, destroyCookie} from "nookies";
import {NoPosts} from "../components/Layout/NoData";
import {UserContext} from "../context/UserContext";
import Post from "../models/PostModel";
import CreatePost from "../components/post/CreatePost";
import CardPost from "../components/post/CardPost";

const HomePage = ({posts}) => {
  const userContext = useContext(UserContext);

  const [title, setTitle] = useState("");
  const [postsData, setPostsData] = useState(JSON.parse(posts));
  const [showToastr, setShowToastr] = useState(false);

  /*----------------------------------------------------*/
  // Actualizar el meta tag title con el usuario actual
  /*----------------------------------------------------*/
  useEffect(() => {
    if(userContext.currentUser) {
      const userFirstName = userContext.currentUser.name.split(" ")[0];
      setTitle(`Welcome, ${userFirstName}`);
    }    
  }, [userContext.currentUser]);

  if(postsData.length === 0) {
    return <NoPosts />
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Segment>
        {/* Input para crear post */}
        {userContext.currentUser &&
          <CreatePost user={userContext.currentUser} setPosts={setPostsData} />
        }
        {/* Lista de todos los posts disponibles */}
        {postsData.map(post => {
          return (
            <CardPost
              key={post._id}
              post={post}
              user={userContext.currentUser}
              setPosts={setPostsData}
              setShowToastr={setShowToastr}
            />
          )
        })}
      </Segment>
    </>
  );
}


export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);

    if(!token) {
      return {
        redirect: {
          destination: "/login",
          permanent: false
        }
      }
    }

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Es necesario extraer la lógica de la consulta a la DB ya que no es posible
    // realizar consultas a los endpoints de la API interna desde getServerSideProps
    const posts = await Post.find()
    .sort({createdAt: "desc"})
    .populate("user", "_id avatar name username role email")
    .populate({
      path: "comments.user",
      select: "_id name username avatar"
    });

    return {
      props: {
        posts: JSON.stringify(posts)
      }
    }
  } catch (error) {
    destroyCookie(context, "token");
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    }
  }
}

export default HomePage;
