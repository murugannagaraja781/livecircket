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

        const payload = {
          id: match.id,
          matchId: match.id,
          series: cat.name,
          teams: { 
            home: match.home?.name || 'Home', 
            away: match.away?.name || 'Away' 
          },
          score: { 
            home: match.home?.score ? `${match.home.score}/${match.home.wickets || 0}` : 'Yet to bat', 
            away: match.away?.score ? `${match.away.score}/${match.away.wickets || 0}` : 'Yet to bat' 
          },
          status: match.status || 'Scheduled',
          live: isLive,
          finished: isFinished,
          last_wicket: match.last_wicket || null,
          history: [] // Added for future graph data
        };
        
        // --- Score History Tracking for Graphs ---
        if (!matchHistory[match.id]) {
          matchHistory[match.id] = payload;
          matchHistory[match.id].scoreHistory = [];
        } else {
          // Attach odds if available
          payload.odds = matchOdds[match.id] || null;
          matchHistory[match.id] = { ...payload, scoreHistory: oldHistory };
        }

        // Record history point if it's a live match and the score/over changed
        if (isLive) {
          const currentOver = match.status?.match(/(\d+\.\d+)/)?.[0] || '0.0'; // Simple regex to find over in status
          const currentTotal = match.home?.score || match.away?.score || '0';
          const lastPoint = matchHistory[match.id].scoreHistory.slice(-1)[0];
          
          if (!lastPoint || lastPoint.over !== currentOver) {
            matchHistory[match.id].scoreHistory.push({
              over: currentOver,
              runs: currentTotal,
              timestamp: new Date().toISOString()
            });
            // Keep last 100 points to save memory
            if (matchHistory[match.id].scoreHistory.length > 100) {
              matchHistory[match.id].scoreHistory.shift();
            }
          }
          // Attach history to payload for the detail request
          payload.scoreHistory = matchHistory[match.id].scoreHistory;
        }
        
        // Broadcast to clients via Socket.io
        io.to(`match:${match.id}`).emit('score_update', payload);
        io.emit('score_update_global', payload);
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

        // Only add if not already in history (to avoid overwriting live scores with scheduled info)
        if (!matchHistory[match.id]) {
          const payload = {
            id: match.id,
            matchId: match.id,
            series: cat.name,
            teams: { 
              home: match.home?.name || match.home_name || 'Home Team', 
              away: match.away?.name || match.away_name || 'Away Team' 
            },
            score: { home: 'Upcoming', away: 'Upcoming' },
            status: `${match.date} at ${match.time}`,
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
      const matches = cat.matches?.match || [];
      const matchArray = Array.isArray(matches) ? matches : [matches];
      matchArray.forEach(m => {
        if (m.id) {
          matchOdds[m.id] = m.odds; // Store odds by match ID
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
  // Return matches sorted by created_at desc
  const sorted = Object.values(matchHistory)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);
  
  // Format identically to what the frontend expects
  res.json(sorted.map(m => ({ id: m.id, payload: m, created_at: m.created_at })));
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
