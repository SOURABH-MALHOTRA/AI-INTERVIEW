import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import interviewReducer from '../slices/interviewSlice';
import candidateReducer from '../slices/candidateSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['interview', 'candidate'], // Only persist these reducers
};

const rootReducer = combineReducers({
  interview: interviewReducer,
  candidate: candidateReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
export default store;