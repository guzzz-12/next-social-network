import {Modal, List} from "semantic-ui-react";
import moment from "moment";

const CommentHistory = ({history, isModalOpen, setIsModalOpen}) => {
  return (
    <Modal
      open={isModalOpen}
      size="tiny"
      closeIcon
      onClose={() => setIsModalOpen(false)}
    >
      <Modal.Header as="h4" style={{fontWeight: 400}}>
        Comment history
      </Modal.Header>
      <Modal.Content scrolling>
        <List divided relaxed>
          {history.map(item => {
            return (
              <List.Item>
                <List.Content>
                  <List.Header>{moment(item.date).calendar()}</List.Header>
                  <List.Description>{item.text}</List.Description>
                </List.Content>
              </List.Item>
            )
          })}
        </List>
      </Modal.Content>
    </Modal>
  )
}

export default CommentHistory;
