import {Message} from "semantic-ui-react";

const ValidationErrorMessage = ({message}) => {
  return (
    <Message
      negative
      size="mini"
      icon="warning circle"
      content={message}
    />
  )
}

export default ValidationErrorMessage;
