// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import fixturesReducer from './fixturesSlice';
import matchDetailsReducer from './matchDetailsSlice';

export const store = configureStore({
  reducer: {
    fixtures: fixturesReducer,
    matchDetails: matchDetailsReducer,
  },
});