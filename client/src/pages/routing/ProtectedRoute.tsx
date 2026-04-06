import { Route, Redirect, useHistory } from "react-router-dom";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import React, { useCallback } from "react";
import { faLongArrowAltUp } from "@fortawesome/free-solid-svg-icons";
import { logoutUser } from "../../helpers/UsersApiHelper";

import { persistedState } from "../../main";
type AppDispatch = typeof persistedState.store.dispatch;
type RootState = ReturnType<typeof persistedState.store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ component: Component, ...props }: any) => {
  const history = useHistory();

  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const logOut = useCallback(async () => {
    try {
      // Call logout API to log the event on server
      const authToken = auth?.token;
      if (authToken) {
        await logoutUser(authToken);
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with client-side logout even if API fails
    } finally {
      // Always perform client-side logout
      dispatch({ type: "LOGOUT" });
      history.replace("/vera-portal");
    }
  }, [dispatch, auth, history]);
  if (props.auth !== undefined && props.auth.token !== null) {
    const decodedJwt = parseJwt(props.auth.token.slice(7));
    console.log(decodedJwt);
    // console.log("Token Expires on " + new Date(decodedJwt.exp*1000).toLocaleString())
    if (decodedJwt.exp * 1000 < Date.now()) {
      // Need to refresh token
      console.log("Token refresh needed!");
    }
  }
  let isAuthenticated = auth.isAuthenticated;
  if (auth !== undefined && auth.token !== null) {
    const decodedJwt = parseJwt(auth.token.slice(7));
    console.log(
      "Token Expires on " + new Date(decodedJwt.exp * 1000).toLocaleString(),
    );
    if (decodedJwt.exp * 1000 < Date.now()) {
      // Need to refresh token
      console.log("Token refresh needed!");
      logOut();
      // props.logOut();
    } else {
      isAuthenticated = true;
    }
  }
  if (!isAuthenticated) {
    logOut();
  }
  return (
    <Route
      {...props}
      render={(innerProps) =>
        isAuthenticated ? (
          <Component {...innerProps} />
        ) : (
          <Redirect to="/vera-portal" />
        )
      }
    />
  );
};
ProtectedRoute.displayName = "ProtectedRoute";
export default ProtectedRoute;
