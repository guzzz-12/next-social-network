import {Form, Button, Message, TextArea, Divider} from "semantic-ui-react";
import ValidationErrorMessage from "./ValidationErrorMessage";

const CommonInputs = ({user: {bio, facebook, instagram, youtube, twitter}, onChangeHandler, showSocialLinks, setShowSocialLinks, bioError, onBlur}) => {

  const socialInputs = [
    {name: "facebook", value: facebook},
    {name: "instagram", value: instagram},
    {name: "twitter", value: twitter},
    {name: "youtube", value: youtube}
  ];

  return (
    <>
      <Form.Field
        error={!!bioError}
        name="bio"
        control={TextArea}
        placeholder="Bio"
        value={bio}
        onBlur={onBlur}
        onChange={onChangeHandler}
      />
      {bioError && <ValidationErrorMessage message={bioError} />}

      <Button
        content={showSocialLinks ? "Hide social links" : "Add social links"}
        color="red"
        icon="at"
        type="button"
        onClick={() => setShowSocialLinks(prev => !prev)}
      />

      {showSocialLinks && 
        <>
          <Divider />
          {socialInputs.map(item => {
            return (
              <Form.Input
                key={item.name}
                icon={item.name}
                iconPosition="left"
                name={item.name}
                placeholder={item.name[0].toUpperCase() + item.name.substring(1)}
                value={item.value}
                onChange={onChangeHandler}
              />
            )
          })}

          <Message
            info
            icon="attention"
            size="small"
            header="Social media links are optional"
          />
        </>
      }
    </>
  )
}

export default CommonInputs;
