import React from "react"
import { withRouter } from "react-router-dom"
const parseJwt = (token) => {
  try {
    console.log(atob(token.split(".")[1]))
    return JSON.parse(atob(token.split(".")[1]))
  } catch (e) {
    return null
  }
}

const AuthVerify = (props) => {
  props.history.listen(() => {
    // const user = JSON.parse(localStorage.getItem("user"));
    if (props.auth !== undefined && props.auth.token !== null) {
      const decodedJwt = parseJwt(props.auth.token.slice(7))
      // console.log("Token Expires on " + new Date(decodedJwt.exp*1000).toLocaleString())
      if (decodedJwt.exp * 1000 < Date.now()) {
        // Need to refresh token
        console.log("Token refresh needed!")
        // props.logOut();
      }
    }
  })

  return <div />
}

export default withRouter(AuthVerify)
