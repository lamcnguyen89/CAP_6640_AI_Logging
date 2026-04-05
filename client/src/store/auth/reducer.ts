export interface AuthAction {
  type: string
  payload?: any
}

export interface AuthState {
  loading: boolean
  isAuthenticated: boolean
  token: string | null
  user?: any // Replace with a proper user interface if needed
}

export const initialAuthState: AuthState = {
  loading: false,
  isAuthenticated: false,
  token: null,
}

const authReducer = (
  state: AuthState = initialAuthState,
  action: AuthAction
): AuthState => {
  switch (action.type) {
    case 'START_API_CALL_AUTH':
      return {
        ...state,
        loading: true,
      }

    case 'END_API_CALL_AUTH':
      // console.log("End API Call State:", state)
      return {
        ...state,
        loading: false,
      }

    case 'SET_CURRENT_USER':
      /*
      console.log({
          ...state,
          isAuthenticated: !!action.payload,
          token: action.payload ? action.payload.token : null,
          user: action.payload ? action.payload.user : {},
      })
          */
      console.log("Setting current user...")
      if (action.payload) {

        return {
          ...state,
          isAuthenticated: !!action.payload,
          token: action.payload ? action.payload.token : null,
          user: action.payload ? action.payload.user : {},
        }
      } else {
        return state
      }

    case 'LOGOUT':
      return {
        // ...state,
        loading: false,
        user: undefined,
        isAuthenticated: false,
        token: null,
      }
    case 'API_CALL_FAILURE_AUTH':
      return { ...state, loading: false, error: action.payload || 'Authentication failed.' }
    default:
      return state
  }
}

export default authReducer
