import {Form, Segment, Image, Icon, Header} from "semantic-ui-react";

const ImageDropInput = ({imgInputRef, setImage, onChangeHandler, imagePreview, setImagePreview, highlighted, setHighlighted}) => {

  return (
    <Form.Field>
      <Segment placeholder basic secondary>
        <input
          ref={imgInputRef}
          style={{display: "none"}}
          type="file"
          name="image"
          onChange={onChangeHandler}
          accept="image/*"
        />
        <div
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
          {!imagePreview &&
            <Segment color={highlighted ? "green" : "grey"} placeholder basic>
              <Header icon>
                <Icon
                  style={{cursor: "pointer"}}
                  name="file image outline"
                  onClick={() => imgInputRef.current.click()}
                />
                Drag and drop the image or click to pick image from your system
              </Header>
            </Segment>
          }
          {imagePreview &&
            <Segment color="green">
              <Image
                centered
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "350px",
                  objectFit: "contain",
                  objectPosition: "center center",
                  cursor: "pointer"
                }}
                src={imagePreview}
                size="medium"
                onClick={() => imgInputRef.current.click()}
              />
            </Segment>
          }
        </div>
      </Segment>
    </Form.Field>
  )
}

export default ImageDropInput;
