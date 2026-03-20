import { configureStore } from '@reduxjs/toolkit';
import matchesReducer from './matchesSlice';

export const store = configureStore({
  reducer: {
    matches: matchesReducer,
  },
});
