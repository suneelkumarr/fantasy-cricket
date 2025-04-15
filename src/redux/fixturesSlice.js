// src/store/fixturesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for fetching upcoming fixtures
export const fetchUpcomingFixtures = createAsyncThunk(
  'fixtures/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      const timestamp = new Date().getTime() + 5.5 * 60 * 60 * 1000;
      const response = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_lobby_fixture_list_7.json?${timestamp}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch upcoming fixtures');
    }
  }
);

// Async thunk for fetching completed fixtures
export const fetchCompletedFixtures = createAsyncThunk(
  'fixtures/fetchCompleted',
  async (_, { rejectWithValue }) => {
    try {
      const timestamp = new Date().getTime() + 5.5 * 60 * 60 * 1000;
      const popularResponse = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_completed_fixture_list_popular_7.json?${timestamp}`
      );
      const overallResponse = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_completed_fixture_list_7.json?${timestamp}`
      );
      return {
        popular: popularResponse.data,
        overall: overallResponse.data,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch completed fixtures');
    }
  }
);

const fixturesSlice = createSlice({
  name: 'fixtures',
  initialState: {
    upcoming: [],
    completed: { popular: [], overall: [] },
    loading: false,
    error: null,
    viewMode: 'upcoming',
    completedFilter: 'popular',
  },
  reducers: {
    setViewMode(state, action) {
      state.viewMode = action.payload;
    },
    setCompletedFilter(state, action) {
      state.completedFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upcoming Fixtures
      .addCase(fetchUpcomingFixtures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingFixtures.fulfilled, (state, action) => {
        state.loading = false;
        state.upcoming = action.payload;
      })
      .addCase(fetchUpcomingFixtures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Completed Fixtures
      .addCase(fetchCompletedFixtures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletedFixtures.fulfilled, (state, action) => {
        state.loading = false;
        state.completed = action.payload;
      })
      .addCase(fetchCompletedFixtures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setViewMode, setCompletedFilter } = fixturesSlice.actions;
export default fixturesSlice.reducer;