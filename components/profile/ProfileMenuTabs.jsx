import {Menu} from "semantic-ui-react";

const ProfileMenuTabs = ({activeTab, tabClickHandler, followers, following, isAccountOwner}) => {
  return (
    <Menu pointing secondary>
      <Menu.Item
        name="profile"
        active={activeTab === "profile"}
        onClick={() => tabClickHandler("profile")}
      />
      <Menu.Item
        name={`${followers.length} followers`}
        active={activeTab === "followers"}
        onClick={() => tabClickHandler("followers")}
      />
      <Menu.Item
        name={`${following.length} following`}
        active={activeTab === "following"}
        onClick={() => tabClickHandler("following")}
      />
      {isAccountOwner &&
        <>
          <Menu.Item
            name="Update Profile"
            active={activeTab === "updateProfile"}
            onClick={() => tabClickHandler("updateProfile")}
          />
          <Menu.Item
            name="Settings"
            active={activeTab === "settings"}
            onClick={() => tabClickHandler("settings")}
          />
        </>
      }
    </Menu>
  )
}

export default ProfileMenuTabs;