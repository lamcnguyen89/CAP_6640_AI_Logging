import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import 'bootstrap/dist/css/bootstrap.min.css'

import { PersistGate } from 'redux-persist/integration/react'
import createPersistedState from './store/store'
import Loading from './components/Loading'

// Create the persisted state from the store
export const persistedState = createPersistedState()

const container = document.getElementById('root') as HTMLElement
if (!container) {
  throw new Error('Failed to find the root element')
}

// Check if the root is already attached to the window object
let root = (window as any)._reactRoot
if (!root) {
  root = ReactDOM.createRoot(container)
    ; (window as any)._reactRoot = root
}

root.render(
  <Provider store={persistedState.store}>
    <PersistGate loading={<Loading />} persistor={persistedState.persistor}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistGate>
  </Provider>
)
