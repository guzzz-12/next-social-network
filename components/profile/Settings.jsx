import {useState, useContext} from "react";
import {Header, Icon, Checkbox, Divider, Segment} from "semantic-ui-react";
import axios from "axios";
import ChangePasswordForm from "./settings-forms/ChangePasswordForm";
import ChangeEmailForm from "./settings-forms/ChangeEmailForm";
import DeleteAccountForm from "./settings-forms/DeleteAccountForm";
import {UserContext} from "../../context/UserContext";

const Settings = ({newMessagePopup}) => {
  const userContext = useContext(UserContext);

  // State del ajuste del popup de nuevo mensaje
  const [loadingPopupSetting, setLoadingPopupSetting] = useState(false);
  const [popupSetting, setPopupSetting] = useState(newMessagePopup);

  /*--------------------------------------------------------*/
  // Modificar el ajuste del popup de nuevo mensaje recibido
  /*--------------------------------------------------------*/
  const popupSettingHandler = async () => {
    try {
      setLoadingPopupSetting(true);

      const res = await axios({
        method: "PATCH",
        url: "/api/profile/settings/message-popup",
        data: {msgPopupSetting: !popupSetting},
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = res.data.data.newMessagePopup;
      setPopupSetting(result);
      setLoadingPopupSetting(false);
      userContext.setCurrentUser({...userContext.currentUser, newMessagePopup: result});
      
    } catch (error) {
      console.log({popuSettingError: error.message});
      setLoadingPopupSetting(false);
    }
  }


  return (
    <Segment>
      <Header as="h2" textAlign="center">
        <Icon
          style={{display: "block", margin: "0 auto"}}
          name="settings"
        />
        Settings
        <Header.Subheader>
          Manage your account settings
        </Header.Subheader>
      </Header>

      <Divider />
      
      {/* Formulario de cambio de contraseña */}
      <ChangePasswordForm />

      <Divider />

      {/* Formulario de cambio de email */}
      <ChangeEmailForm />

      <Divider />

      {/* Formulario de eliminación de cuenta de usuario */}
      <DeleteAccountForm />

      <Divider />

      <Header as="h4" textAlign="center">
        <Icon name="paper plane outline" />
        Show new message popup?
      </Header>

      <div style={{marginTop: "1rem", textAlign: "center"}}>
        <p>Whether to show or hide the incoming message popup</p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div style={{display: "flex", alignItems: "center"}}>
            <span style={{marginRight: "10px"}}>Hide</span>
            <Checkbox
              toggle
              checked={popupSetting}
              disabled={loadingPopupSetting}
              onChange={(e) => popupSettingHandler()}
            />
            <span style={{marginLeft: "10px"}}>Show</span>
          </div>
        </div>
      </div>
      
    </Segment>
  )
}

export default Settings;
