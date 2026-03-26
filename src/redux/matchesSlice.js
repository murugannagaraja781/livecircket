import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CONFIG } from '../api/config';

export const fetchMatches = createAsyncThunk('matches/fetchMatches', async () => {
  const response = await axios.get(`${CONFIG.SOCKET_SERVER}/matches`);
  return response.data; // Expected [{ id, payload: { ...slim } }]
});

export const fetchMatchDetail = createAsyncThunk('matches/fetchMatchDetail', async (matchId) => {
  const response = await axios.get(`${CONFIG.SOCKET_SERVER}/history/${matchId}`);
  return { matchId, data: response.data.payload };
});

const DUMMY_MATCHES = [
  {
    id: "dummy-1",
    series: "International T20 League",
    live: true,
    teams: { home: "India", away: "Australia" },
    score: { home: "185/4", away: "162/6", overs_home: "18.2", overs_away: "17.5" },
    status: "India won by 23 runs",
    venue: "Narendra Modi Stadium, Ahmedabad",
    batsmen: [
      { name: "Virat Kohli", runs: 82, balls: 53, fours: 6, sixes: 3, sr: 154.7, out_desc: "not out" },
      { name: "Rohit Sharma", runs: 45, balls: 30, fours: 4, sixes: 2, sr: 150.0, out_desc: "c Smith b Cummins" }
    ],
    bowlers: [
      { name: "Pat Cummins", overs: 4, maidens: 0, runs: 35, wickets: 2, econ: 8.75 },
      { name: "Mitchell Starc", overs: 4, maidens: 0, runs: 42, wickets: 1, econ: 10.5 }
    ]
  },
  {
    id: "dummy-2",
    series: "World Cup 2024",
    upcoming: true,
    teams: { home: "England", away: "Pakistan" },
    status: "Starts in 2 hours",
    venue: "Lord's, London",
    batsmen: [],
    bowlers: []
  },
  {
    id: "dummy-3",
    series: "IPL 2024",
    finished: true,
    teams: { home: "CSK", away: "MI" },
    score: { home: "210/4", away: "190/8" },
    status: "CSK won by 20 runs",
    venue: "MA Chidambaram Stadium, Chennai",
    batsmen: [],
    bowlers: []
  }
];

const INITIAL_FORMATTED = DUMMY_MATCHES;
const INITIAL_LIVE = INITIAL_FORMATTED.filter(m => m.live);
const INITIAL_UPCOMING = INITIAL_FORMATTED.filter(m => m.upcoming);
const INITIAL_FINISHED = INITIAL_FORMATTED.filter(m => m.finished || (!m.live && !m.upcoming));

const matchesSlice = createSlice({
  name: 'matches',
  initialState: {
    live: INITIAL_LIVE,
    upcoming: INITIAL_UPCOMING,
    finished: INITIAL_FINISHED,
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
        const matches = Array.isArray(action.payload) ? action.payload : [];
        const formatted = matches.length > 0 ? matches.map(m => m.payload || m) : DUMMY_MATCHES;
        state.live = formatted.filter(m => m.live);
        state.upcoming = formatted.filter(m => m.upcoming);
        state.finished = formatted.filter(m => m.finished || (!m.live && !m.upcoming));
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        // Load dummy data on failure
        state.live = DUMMY_MATCHES.filter(m => m.live);
        state.upcoming = DUMMY_MATCHES.filter(m => m.upcoming);
        state.finished = DUMMY_MATCHES.filter(m => m.finished || (!m.live && !m.upcoming));
      })
      .addCase(fetchMatchDetail.fulfilled, (state, action) => {
        const { matchId, data } = action.payload;
        state.details[matchId] = data;
      })
      .addCase(fetchMatchDetail.rejected, (state, action) => {
        const matchId = action.meta.arg;
        // Fallback to dummy detail if available
        const dummy = DUMMY_MATCHES.find(m => m.id === matchId);
        if (dummy) {
          state.details[matchId] = dummy;
        }
      });
  },
});

export const { updateMatch, setMatchDetail } = matchesSlice.actions;
export default matchesSlice.reducer;
