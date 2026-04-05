import React, { useCallback, useEffect } from 'react'
import Loading from './components/Loading'
import AllRoutes from './pages/routing/AllRoutes'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
// import EventBus from "./common/EventBus"
// import { useHistory } from 'react-router-dom'
// import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
// import store from './store/store'
// import AuthVerify from './common/AuthVerify'
// import { history } from "./helpers/history";

// Use throughout your app instead of plain `useDispatch` and `useSelector`


export default function App() {
  

  // useEffect(() => {
  //   if (auth.isAuthenticated) {
  //     // setShowModeratorBoard(currentUser.roles.includes("ROLE_MODERATOR"));
  //     // setShowAdminBoard(currentUser.roles.includes("ROLE_ADMIN"));
  //   } else {
  //     console.log("No user...")
  //     history.replace('/vera-portal')
  //     // logOut();
  //     // setShowModeratorBoard(false);
  //     // setShowAdminBoard(false);
  //   }
  //   let logoutEvent = () => {
  //     logOut()
  //   }
  //   EventBus.on("logout", logoutEvent)

  //   return () => {
  //     EventBus.remove("logout", logoutEvent)
  //   }
  // }, [auth, logOut])
  return (
    <>
    <React.Suspense fallback={<Loading />}>
      
      <AllRoutes />
    </React.Suspense>
    </>
  )
}
