import {useState, useRef} from "react";
import {Form, Button, Image, Divider, Segment, Header, Message, Icon, Ref} from "semantic-ui-react";
import axios from "axios";
import classes from "./createPost.module.css";

const CreatePost = ({user, setPosts}) => {
  const imgInputRef = useRef();
  const imageRef = useRef();

  const [values, setValues] = useState({
    content: "",
    location: ""
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [highlighted, setHighlighted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*---------------------------------------*/
  // Manejar el evento change de los inputs
  /*---------------------------------------*/
  const onChangeHandler = (e) => {
    setError(null);

    setValues(prev => {
      return {
        ...prev,
        [e.target.name]: e.target.value
      }
    })
  }

  /*----------------------------------------------------------*/
  // Manejar el evento change del input de selección de imagen
  /*----------------------------------------------------------*/
  const onImageChangeHandler = (e) => {
    if(e.target.files[0]) {
      setHighlighted(true);
      setImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  }

  /*--------------------------*/
  // Enviar la data al backend
  /*--------------------------*/
  const onSubmitHandler = async (e) => {
    setError(null);
    setLoading(true);
    
    try {
      const res = await axios({
        method: "POST",
        url: "/api/posts",
        data: {
          content: values.content,
          location: values.location
        },
        headers: {
          "Content-Type": "application/json"
        }
      });

      // Actualizar la imagen del post si se especifica
      if(image) {
        const formData = new FormData();
        formData.append("postImage", image);

        const imgRes = await axios({
          method: "PATCH",
          url: `/api/posts/${res.data.data._id.toString()}`,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        console.log({response: imgRes.data.data});
        
        // Actualizar los posts en la interfaz al actualizar la imagen
        setPosts(prev => [imgRes.data.data, ...prev]);

        // Restablecer el resto del state
        setLoading(false);
        setValues({
          content: "",
          location: ""
        });
        setImage(null);
        setImagePreview(null);

      } else {
        console.log({response: res.data.data});

        // Actualizar los posts en la interfaz si no se especifica imagen
        setPosts(prev => [res.data.data, ...prev]);

        // Restablecer el resto del state
        setLoading(false);
        setValues({
          content: "",
          location: ""
        });
      }
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message;
      }
      setError(message);
      setLoading(false);
    }
  }

  return (
    <>
      <Form
        error={!!error}
        loading={loading}
        onSubmit={onSubmitHandler}
      >
        <Message
          error
          header="Oops"
          content={error}
          onDismiss={() => setError(null)}
        />
        <div className={classes["post__input-group"]} style={{marginBottom: "10px"}}>
          <Image src={user.avatar} circular avatar inline />
          <Form.TextArea
            name="content"
            value={values.content}
            placeholder="What's happening?"
            rows={3}
            onChange={onChangeHandler}
          />
        </div>

        <div className={classes["post__input-group"]}>
          <Form.Input
            name="location"
            value={values.location}
            label="Want to add location?"
            icon="map marker alternate"
            iconPosition="left"
            placeholder="Add location"
            onChange={onChangeHandler}
          />
          <input
            style={{display: "none"}}
            ref={imgInputRef}
            type="file"
            accept="image/*"
            onChange={onImageChangeHandler}
          />
        </div>

        <Segment className={classes["post__image-picker-wrapper"]}>
          <Header className={classes["post__image-picker__header-wrapper"]}>
            <div className={classes["post__image-picker__header"]}>
              <span>Drag and drop or click to select an image</span>
              {image &&
                <div
                  className={classes["post__image-picker__close-icon"]}
                  onClick={() => setImage(null)}
                >
                  <Icon name="close"/>
                </div>
              }
            </div>
          </Header>
          <div
            style={{
              height: !image ? "auto" : imageRef.current?.clientHeight,
              maxHeight: "350px"
            }}
            className={classes["post__image-picker"]}
            onClick={() =>imgInputRef.current.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setHighlighted(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setHighlighted(false)
            }}
            onDrop={(e) => {
              e.preventDefault();
              setHighlighted(true);
              const droppedImg = Array.from(e.dataTransfer.files);
              if(droppedImg[0]) {
                setImage(droppedImg[0]);
                setImagePreview(URL.createObjectURL(droppedImg[0]));
              }
            }}
          >
            {!image ?
              <span style={{opacity: 0.6}}>
                <Icon name="file image outline" size="huge" />
              </span>
              :
              <Ref innerRef={imageRef}>
                <Image
                  className={classes["post__image-preview"]}
                  src={imagePreview}
                  alt="Post image"
                  size="medium"
                />
              </Ref>
            }
          </div>
        </Segment>

        <Button
          circular
          color="teal"
          icon="send"
          content={<strong>Add post</strong>}
          loading={loading}
          disabled={values.content.length === 0 || loading}
        />
      </Form>

      <Divider />
    </>
  )
}

export default CreatePost;