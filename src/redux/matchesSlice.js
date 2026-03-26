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
    series: "SA vs NZ, 3rd T20",
    live: true,
    teams: { home: "South Africa", away: "New Zealand" },
    score: { home: "136/10", away: "5/0", overs_home: "20.0", overs_away: "1.2" },
    status: "NZ need 132 runs in 112 balls",
    venue: "City Oval, Pietermaritzburg",
    crr: "3.75",
    rrr: "7.07",
    target: "137",
    recent_balls: ["0", "0", "1", "Over 2", "0", "4"],
    partnership: "5 (8)",
    scoreHistory: [
      { over: "0", runs: "0" },
      { over: "0.2", runs: "1" },
      { over: "0.4", runs: "1" },
      { over: "1.0", runs: "4" },
      { over: "1.2", runs: "5" }
    ],
    odds: {
      type: {
        value: "Home/Away",
        bookmaker: [
          {
            name: "Marathon",
            odd: [
              { name: "Home", value: "1.67" },
              { name: "Away", value: "2.07" }
            ]
          },
          {
            name: "1xBet",
            odd: [
              { name: "Home", value: "1.70" },
              { name: "Away", value: "2.17" }
            ]
          }
        ]
      }
    },
    batsmen: [
      { name: "Devon Conway", runs: 5, balls: 3, fours: 1, sixes: 0, sr: 166.7, out_desc: "not out" },
      { name: "Tom Latham", runs: 0, balls: 5, fours: 0, sixes: 0, sr: 0.0, out_desc: "not out" }
    ],
    bowlers: [
      { name: "Lutho Sipamla", overs: "0.2", maidens: 0, runs: 4, wickets: 0, econ: 12.00 }
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
        if (matches.length === 0) {
          state.live = DUMMY_MATCHES.filter(m => m.live);
          state.upcoming = DUMMY_MATCHES.filter(m => m.upcoming);
          state.finished = DUMMY_MATCHES.filter(m => m.finished || (!m.live && !m.upcoming));
          return;
        }
        
        const formatted = matches.map(m => {
          const payload = m.payload || m;
          const dummy = DUMMY_MATCHES[0];
          // Deep merge for list items
          return {
            ...dummy,
            ...payload,
            score: { ...dummy.score, ...payload?.score },
            teams: { ...dummy.teams, ...payload?.teams }
          };
        });
        
        state.live = formatted.filter(m => m.live);
        state.upcoming = formatted.filter(m => m.upcoming);
        state.finished = formatted.filter(m => m.finished || (!m.live && !m.upcoming));
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.live = DUMMY_MATCHES.filter(m => m.live);
        state.upcoming = DUMMY_MATCHES.filter(m => m.upcoming);
        state.finished = DUMMY_MATCHES.filter(m => m.finished || (!m.live && !m.upcoming));
      })
      .addCase(fetchMatchDetail.fulfilled, (state, action) => {
        const { matchId, data } = action.payload;
        const dummy = DUMMY_MATCHES[0];
        // Deep merge for details
        state.details[matchId] = {
           ...dummy,
           ...data,
           score: { ...dummy.score, ...data?.score },
           teams: { ...dummy.teams, ...data?.teams },
           batsmen: data?.batsmen?.length > 0 ? data.batsmen : dummy.batsmen,
           bowlers: data?.bowlers?.length > 0 ? data.bowlers : dummy.bowlers,
           recent_balls: data?.recent_balls?.length > 0 ? data.recent_balls : dummy.recent_balls,
           odds: data?.odds || dummy.odds,
           scoreHistory: data?.scoreHistory?.length > 0 ? data.scoreHistory : dummy.scoreHistory
        };
      })
      .addCase(fetchMatchDetail.rejected, (state, action) => {
        const matchId = action.meta.arg;
        const dummy = DUMMY_MATCHES.find(m => m.id === matchId) || DUMMY_MATCHES[0];
        state.details[matchId] = dummy;
      });
  },
});

export const { updateMatch, setMatchDetail } = matchesSlice.actions;
export default matchesSlice.reducer;
