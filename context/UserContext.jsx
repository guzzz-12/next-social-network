import {createContext, useState} from "react";

export const UserContext = createContext({
  isAuth: false,
  currentUser: null,
  currentProfile: null,
  setCurrentUser: () => {},
  clearCurrentUser: () => {},
  setCurrentProfile: () => {}
});

const UserContextProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuth, setIsAuth] = useState(false);

  const setCurrentUser = (user) => {
    console.log({user});
    setUser(user);
    setIsAuth(true);
    localStorage.setItem("user", JSON.stringify(user));
  }

  const setCurrentProfile = (profile) => {
    console.log({profile});
    setProfile(profile);
    localStorage.setItem("profile", JSON.stringify(profile));
  }

  const clearCurrentUser = () => {
    setUser(null);
    setProfile(null);
    setIsAuth(false);

    localStorage.removeItem("user");
    localStorage.removeItem("profile");
  }

  return (
    <UserContext.Provider
      value ={{
        isAuth,
        currentUser: user,
        currentProfile: profile,
        setCurrentUser,
        setCurrentProfile,
        clearCurrentUser
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserContextProvider;