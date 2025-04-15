// src/redux/matchDetailsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for fetching match details
export const fetchMatchDetails = createAsyncThunk(
  'matchDetails/fetchMatchDetails',
  async ({ season_game_uid, es_season_game_uid }, { rejectWithValue }) => {
    try {
      const timestamp = new Date().getTime() + 5.5 * 60 * 60 * 1000; // IST offset
      const response = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_match_7_${
          season_game_uid || es_season_game_uid
        }.json?${timestamp}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch match details');
    }
  }
);

// Async thunk for fetching GL teams
export const fetchGLTeams = createAsyncThunk(
  'matchDetails/fetchGLTeams',
  async ({ season_game_uid }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        'https://plapi.perfectlineup.in/fantasy/lobby/get_user_fixture_data',
        {
          season_game_uid,
          website_id: 1,
          sports_id: '7',
          fixture_detail: '',
        },
        {
          headers: {
            sessionkey: '3cd0fb996816c37121c765f292dd3f78',
            moduleaccess: '7',
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch GL teams');
    }
  }
);

// Async thunk for fetching SL teams
export const fetchSLTeams = createAsyncThunk(
  'matchDetails/fetchSLTeams',
  async ({ season_game_uid }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        'https://plapi.perfectlineup.in/fantasy/lobby/get_sl_teams',
        {
          season_game_uid,
          no_of_teams: 2,
        },
        {
          headers: {
            sessionkey: '3cd0fb996816c37121c765f292dd3f78',
            moduleaccess: '7',
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch SL teams');
    }
  }
);

const matchDetailsSlice = createSlice({
  name: 'matchDetails',
  initialState: {
    matchData: null,
    glTeams: null,
    slTeams: null,
    loading: false,
    error: null,
    selectedLeague: 'GL',
  },
  reducers: {
    setSelectedLeague(state, action) {
      state.selectedLeague = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Match Details
      .addCase(fetchMatchDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.matchData = [action.payload]; // Wrap in array for consistency
      })
      .addCase(fetchMatchDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // GL Teams
      .addCase(fetchGLTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGLTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.glTeams = action.payload;
      })
      .addCase(fetchGLTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // SL Teams
      .addCase(fetchSLTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSLTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.slTeams = action.payload;
      })
      .addCase(fetchSLTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedLeague } = matchDetailsSlice.actions;
export default matchDetailsSlice.reducer;