const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const compression = require('compression');

dotenv.config();

const { STATPAL_KEY, PORT } = require('./config');
const logger = require('./logger');

const app = express();
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 🚀 Local Memory Database (Replaces Supabase Postgres & RabbitMQ)
let matchHistory = {}; 
let matchOdds = {};

async function fetchAndProduce() {
  try {
    const response = await axios.get(`https://statpal.io/api/v1/cricket/livescores?access_key=${STATPAL_KEY}`);
    const data = response.data;
    if (!data || !data.scores || !data.scores.category) return;

    const categories = Array.isArray(data.scores.category) ? data.scores.category : [data.scores.category];

    categories.forEach(cat => {
      const matches = Array.isArray(cat.match) ? cat.match : [cat.match];
      matches.forEach(match => {
        if (!match || !match.id) return;
        
        const statusLower = match.status?.toLowerCase() || '';
        const isLive = statusLower.includes('live') || 
                       statusLower.includes('in progress') ||
                       statusLower.includes('lunch') ||
                       statusLower.includes('tea') ||
                       statusLower.includes('stumps');

        const isFinished = statusLower.includes('won') || 
                          statusLower.includes('tied') || 
                          statusLower.includes('drawn') ||
                          statusLower.includes('abandoned') ||
                          statusLower.includes('no result') ||
                          statusLower.includes('finished');

        // --- Enhanced Mapping for User JSON ---
        const homeScore = match.home?.stat || match.home?.score || match.home?.totalscore || 'Yet to bat';
        const awayScore = match.away?.stat || match.away?.score || match.away?.totalscore || 'Yet to bat';

        // Extract batsmen and bowlers from innings if available
        let batsmen = [];
        let bowlers = [];
        if (Array.isArray(match.inning)) {
          // Get stats from latest inning
          const lastInning = match.inning[match.inning.length - 1];
          if (lastInning?.batsmanstats?.player) {
            const players = Array.isArray(lastInning.batsmanstats.player) ? lastInning.batsmanstats.player : [lastInning.batsmanstats.player];
            batsmen = players.map(p => ({
              name: p.batsman || p.name || 'Unknown',
              runs: p.r || p.runs || '0',
              balls: p.b || p.balls || '0',
              fours: p.s4 || p.fours || '0',
              sixes: p.s6 || p.sixes || '0',
              sr: p.sr || '0.0',
              out_desc: p.status || p.out_desc || ''
            }));
          }
          if (lastInning?.bowlers?.player) {
            const players = Array.isArray(lastInning.bowlers.player) ? lastInning.bowlers.player : [lastInning.bowlers.player];
            bowlers = players.map(p => ({
              name: p.bowler || p.name || 'Unknown',
              overs: p.o || p.overs || '0.0',
              maidens: p.m || p.maidens || '0',
              runs: p.r || p.runs || '0',
              wickets: p.w || p.wickets || '0',
              econ: p.er || p.econ || '0.0'
            }));
          }
        }

        // --- Advanced Calculations for CRR, RRR, Target ---
        const homeRuns = parseInt(match.home?.totalscore || match.home?.score || '0');
        const awayRuns = parseInt(match.away?.totalscore || match.away?.score || '0');
        
        // Extract overs from status or total
        const currentOverStr = match.status?.match(/(\d+\.\d+)/)?.[0] || '0.0';
        const [overNum, ballNum] = currentOverStr.split('.').map(n => parseInt(n) || 0);
        const totalBalls = overNum * 6 + ballNum;
        
        const crr = totalBalls > 0 ? ((isLive && statusLower.includes('inn')) ? (awayRuns / (totalBalls / 6)).toFixed(2) : (homeRuns / (totalBalls / 6)).toFixed(2)) : '0.00';
        
        // Simple Target logic: if it's the second innings, look for a target
        let target = null;
        let rrr = null;
        if (statusLower.includes('2nd inn') || statusLower.includes('target')) {
          target = homeRuns + 1; // Assuming home batted first
          const runsNeeded = target - awayRuns;
          const ballsRemaining = 120 - totalBalls; // Assuming T20 for RRR calculation
          rrr = ballsRemaining > 0 ? ((runsNeeded / (ballsRemaining / 6))).toFixed(2) : '0.00';
        }

        // --- Over Timeline (recent_balls) ---
        if (!matchHistory[match.id]) {
          matchHistory[match.id] = { recent_balls: [] };
        }
        
        // Extract last ball event from commentary if available
        const lastComm = match.commentaries?.commentary?.[0];
        if (lastComm && lastComm.runs !== undefined) {
          const ballKey = `${lastComm.id}`;
          if (!matchHistory[match.id].last_ball_id || matchHistory[match.id].last_ball_id !== ballKey) {
            matchHistory[match.id].last_ball_id = ballKey;
            const ballEvent = lastComm.iswicket === 'True' ? 'W' : 
                              lastComm.isfour === 'True' ? '4' :
                              lastComm.issix === 'True' ? '6' : lastComm.runs;
            
            matchHistory[match.id].recent_balls.push(ballEvent);
            if (matchHistory[match.id].recent_balls.length > 12) {
              matchHistory[match.id].recent_balls.shift();
            }
          }
        }

        const payload = {
          id: match.id,
          matchId: match.id,
          series: cat.name,
          teams: { 
            home: match.home?.name || 'Home', 
            away: match.away?.name || 'Away' 
          },
          score: { 
            home: homeScore, 
            away: awayScore 
          },
          status: match.comment?.post || match.status || 'Scheduled',
          live: isLive,
          finished: isFinished,
          last_wicket: match.last_wicket || null,
          crr,
          rrr,
          target,
          recent_balls: matchHistory[match.id].recent_balls,
          batsmen,
          bowlers,
          history: [] 
        };
        
        // --- Score History Tracking for Graphs ---
        if (!matchHistory[match.id]) {
          matchHistory[match.id] = payload;
          matchHistory[match.id].scoreHistory = [];
        } else {
          // Keep old history
          const oldHistory = matchHistory[match.id].scoreHistory || [];
          // Attach odds if available
          payload.odds = matchOdds[match.id] || null;
          matchHistory[match.id] = { ...payload, scoreHistory: oldHistory };
        }

        // Record history point if it's a live match and the score/over changed
        if (isLive) {
          const currentOver = match.status?.match(/(\d+\.\d+)/)?.[0] || (Array.isArray(match.inning) && match.inning.slice(-1)[0]?.total?.tot?.match(/\(\s*(\d+)/)?.[1]) || '0.0';
          const currentTotal = match.home?.score || match.home?.totalscore || '0';
          const lastPoint = matchHistory[match.id].scoreHistory.slice(-1)[0];
          
          if (!lastPoint || lastPoint.over !== currentOver) {
            matchHistory[match.id].scoreHistory.push({
              over: currentOver,
              runs: currentTotal,
              timestamp: new Date().toISOString()
            });
            // Keep last 100 points
            if (matchHistory[match.id].scoreHistory.length > 100) {
              matchHistory[match.id].scoreHistory.shift();
            }
          }
        }
        
        // --- Payload Slimming for Global Broadcast ---
        const slimPayload = {
          id: payload.id,
          series: payload.series,
          teams: payload.teams,
          score: payload.score,
          status: payload.status,
          live: payload.live,
          finished: payload.finished,
          upcoming: !!match.upcoming
        };
        
        // Broadcast FULL payload ONLY to the specific match room
        io.to(`match:${match.id}`).emit('score_update', payload);
        // Broadcast SLIM payload to the global room
        io.emit('score_update_global', slimPayload);
      });
    });
    logger.info('Live scores updated', { count: Object.values(matchHistory).filter(m => m.live).length });
  } catch (err) {
    logger.error('Fetch Live Scores Error', { message: err.message });
  }
}

async function fetchUpcoming() {
  try {
    const response = await axios.get(`https://statpal.io/api/v1/cricket/upcoming-schedule?access_key=${STATPAL_KEY}`);
    const data = response.data;
    if (!data || !data.fixtures || !data.fixtures.category) return;

    const categories = Array.isArray(data.fixtures.category) ? data.fixtures.category : [data.fixtures.category];

    categories.forEach(cat => {
      const matches = Array.isArray(cat.match) ? cat.match : [cat.match];
      matches.forEach(match => {
        if (!match || !match.id) return;

        // Only add if not already in history
        if (!matchHistory[match.id]) {
          // Extract venue from matchinfo.info if available
          let venue = 'TBD';
          if (match.matchinfo?.info) {
            const infoArray = Array.isArray(match.matchinfo.info) ? match.matchinfo.info : [match.matchinfo.info];
            const venueInfo = infoArray.find(i => i.name === 'Venue' || i.name === 'City');
            if (venueInfo) venue = venueInfo.value;
          }

          const payload = {
            id: match.id,
            matchId: match.id,
            series: cat.name,
            teams: { 
              home: match.home?.name || match.home_name || 'Home Team', 
              away: match.away?.name || match.away_name || 'Away Team' 
            },
            score: { home: 'Upcoming', away: 'Upcoming' },
            status: match.time ? `${match.date} at ${match.time}` : match.date || 'Scheduled',
            venue: venue,
            live: false,
            upcoming: true,
            created_at: new Date().toISOString()
          };
          matchHistory[match.id] = payload;
        }
      });
    });
    logger.info('Upcoming matches updated', { count: Object.values(matchHistory).filter(m => m.upcoming).length });
  } catch (err) {
    logger.error('Fetch Upcoming Error', { message: err.message });
  }
}

async function fetchOdds() {
  try {
    const response = await axios.get(`https://statpal.io/api/v1/cricket/odds?access_key=${STATPAL_KEY}`);
    const data = response.data;
    if (!data || !data.odds || !data.odds.category) return;

    const categories = Array.isArray(data.odds.category) ? data.odds.category : [data.odds.category];
    categories.forEach(cat => {
      // The new structure has cat.matches.match instead of just cat.match
      let matches = cat.matches?.match || cat.match || [];
      const matchArray = Array.isArray(matches) ? matches : [matches];
      
      matchArray.forEach(m => {
        if (m && m.id) {
          // Store the entire odds object for the matchId
          matchOdds[m.id] = m.odds; 
        }
      });
    });
    logger.info('Market odds updated');
  } catch (err) {
    logger.error('Fetch Odds Error', { message: err.message });
  }
}

io.on('connection', socket => {
  socket.on('subscribe', ({ matchId }) => socket.join(`match:${matchId}`));
  socket.on('unsubscribe', ({ matchId }) => socket.leave(`match:${matchId}`));
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/matches', (req, res) => {
  const sorted = Object.values(matchHistory)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 50);
  
  // Return SLIM payloads for the match list
  res.json(sorted.map(m => ({ 
    id: m.id, 
    payload: {
      id: m.id,
      series: m.series,
      teams: m.teams,
      score: m.score,
      status: m.status,
      live: m.live,
      finished: m.finished,
      upcoming: !!m.upcoming
    }, 
    created_at: m.created_at 
  })));
});

app.get('/history/:id', (req, res) => {
  const match = matchHistory[req.params.id];
  res.json({ id: req.params.id, payload: match || {} });
});

const listenPort = PORT || process.env.PORT || 4000;
server.listen(listenPort, () => {
  logger.info('🚀 ZERO-DEPENDENCY Server listening', { port: listenPort });
  
  // Start fetching scores immediately
  fetchAndProduce();
  fetchUpcoming();
  fetchOdds();
  setInterval(fetchAndProduce, 10000); 
  setInterval(fetchUpcoming, 300000); 
  setInterval(fetchOdds, 60000); // Fetch odds every minute
});
