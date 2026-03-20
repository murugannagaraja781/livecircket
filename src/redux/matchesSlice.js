import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CONFIG } from '../api/config';

export const fetchMatches = createAsyncThunk('matches/fetchMatches', async () => {
  const response = await axios.get(`${CONFIG.SOCKET_SERVER}/history`);
  return response.data;
});

export const fetchMatchDetail = createAsyncThunk('matches/fetchMatchDetail', async (matchId) => {
  const response = await axios.get(`${CONFIG.SOCKET_SERVER}/history/${matchId}`);
  return { matchId, data: response.data.payload };
});

const matchesSlice = createSlice({
  name: 'matches',
  initialState: {
    live: [],
    upcoming: [],
    finished: [],
    details: {}, // matchId -> details
    loading: false,
    error: null,
  },
  reducers: {
    updateMatch: (state, action) => {
      const match = action.payload;
      // Update in lists
      const updateList = (list) => {
        const index = list.findIndex(m => m.id === match.id);
        if (index !== -1) list[index] = { ...list[index], ...match };
      };
      updateList(state.live);
      updateList(state.upcoming);
      updateList(state.finished);
      
      // Update in details cache
      if (state.details[match.id]) {
        state.details[match.id] = { ...state.details[match.id], ...match };
      }
    },
    setMatchDetail: (state, action) => {
      const { matchId, data } = action.payload;
      state.details[matchId] = data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload.payload || {};
        state.live = Object.values(payload).filter(m => m.live);
        state.upcoming = Object.values(payload).filter(m => m.upcoming);
        state.finished = Object.values(payload).filter(m => !m.live && !m.upcoming);
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchMatchDetail.fulfilled, (state, action) => {
        const { matchId, data } = action.payload;
        state.details[matchId] = data;
      });
  },
});

export const { updateMatch, setMatchDetail } = matchesSlice.actions;
export default matchesSlice.reducer;
