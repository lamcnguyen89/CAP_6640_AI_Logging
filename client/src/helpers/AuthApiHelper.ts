import { persistedState } from "../main"
const store = persistedState.store
const dispatch = store.dispatch

type userData = { email: string; password: string }
type onError = (error: { toString: { (): string; (): string } }) => void

// Dispatches a login action, logging in a user with the given credentials
export const login = (body: userData, captchaToken: string, onError: onError) => {
  console.log("Dispatching login...")
  dispatch({
    type: 'API_CALL',
    payload: {
      route: `${import.meta.env.BASE_URL}/api/users/login`,
      token: store.getState().auth.token,
      callType: "AUTH",
      body: { ...body, captchaToken },
      actionType: "SET_CURRENT_USER",
      getPayloadFromResult: (res: any) => ({
        token: res ? res.token : null,
        user: res ? res.payload : null,
      }),
      onCatch: onError,
    },
  })
}

// Forgot password functionality
type forgotPasswordData = {
  email: string
}

// Dispatches a forgot password action, sending a password reset email to the given email address
export const forgotPassword = (
  body: forgotPasswordData,
  onError: onError,
  onSuccess: any
) => {
  dispatch({
    type: "API_CALL",
    payload: {
      route: `${import.meta.env.BASE_URL}/api/users/forgotpassword`,
      token: store.getState().auth.token,
      callType: "USER",
      actionType: "RESET_PASSWORD",
      body,
      getPayloadFromResult: onSuccess,
      onCatch: onError,
    },
  })
}

// Dispatches a register action, registering a user with the given credentials
export function register(
  email: string,
  password: string,
  captchaToken: string,
  actingFunction: any
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/users/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: store.getState().auth.token,
      },
      body: JSON.stringify({
        email: email,
        password: password,
        captchaToken: captchaToken,
      }),
    }
  )
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      actingFunction(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Finalizes the setup process for a user, sending name, institution, and lab information
export const finalizeSetup = (
  userId: string,
  firstName: string,
  lastName: string,
  institutionId: string,
  labId: string,
  captchaToken: string,
  onError: onError
) => {
  console.log("Dispatching finalizeSetup...")
  dispatch({
    type: 'API_CALL',
    payload: {
      route: `${import.meta.env.BASE_URL}/api/users/${userId}/finalizesetup`,
      token: store.getState().auth.token,
      method: "PATCH",
      callType: "AUTH",
      body: {
        firstName: firstName,
        lastName: lastName,
        institutionId: institutionId,
        labId: labId,
        captchaToken: captchaToken,
      },
      actionType: "SET_CURRENT_USER",
      getPayloadFromResult: (res: any) => ({
        token: res ? res.token : null,
        user: res ? res.payload : null,
      }),
      onCatch: onError,
    },
  })
}