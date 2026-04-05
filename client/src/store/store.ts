import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import authReducer, { AuthState, AuthAction } from './auth/reducer'
import createSagaMiddleware from 'redux-saga'
// import { thunk, ThunkMiddleware } from 'redux-thunk'
import rootSaga from './sagas'

// Create saga middleware
const sagaMiddleware = createSagaMiddleware()

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
}

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
})

// Persist the combined reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)
// Example middleware to log actions
const loggerMiddleware = store => next => action => {
  // console.log('Dispatching action:', action)
  return next(action)
}
let store
let persistor
// Configure the store with `configureStore` from Redux Toolkit
const configureAppStore = () => {
  if (!store) {
    
    console.log('Initializing store...') // Add logging here
    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
      }).concat(sagaMiddleware, loggerMiddleware), // Add saga middleware
      devTools: process.env.NODE_ENV !== 'production', // Enable DevTools in development
    })

    // Run saga middleware
    sagaMiddleware.run(rootSaga)

    // Persistor
    persistor = persistStore(store)
    if (import.meta.hot) {
      import.meta.hot.accept('./sagas', () => {
        sagaMiddleware.cancel()
        const newRootSaga = require('./sagas').default
        sagaMiddleware.run(newRootSaga)
      })
    }
  }

  return { store, persistor }
}

export default configureAppStore
