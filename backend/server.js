const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const { STATPAL_KEY, PORT } = require('./config');
const logger = require('./logger');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 🚀 Local Memory Database (Replaces Supabase Postgres & RabbitMQ)
let matchHistory = {}; 

async function fetchAndProduce() {
  try {
    const response = await axios.get(`https://statpal.io/api/v1/cricket/livescores?access_key=${STATPAL_KEY}`);
    const data = response.data;
    if (!data || !data.scores || !data.scores.category) return;

    data.scores.category.forEach(cat => {
      const matches = Array.isArray(cat.match) ? cat.match : [cat.match];
      matches.forEach(match => {
        if (!match || !match.id) return;
        
        const payload = {
          id: match.id,
          matchId: match.id,
          series: cat.name,
          teams: { 
            home: match.home?.name || 'Home', 
            away: match.away?.name || 'Away' 
          },
          score: { 
            home: match.home?.totalscore || 'Yet to bat', 
            away: match.away?.totalscore || 'Yet to bat' 
          },
          status: match.status || 'Scheduled',
          live: match.status?.toLowerCase().includes('live') || match.status?.toLowerCase().includes('in progress'),
          created_at: new Date().toISOString()
        };

        matchHistory[match.id] = payload;
        
        // Broadcast to clients via Socket.io
        io.to(`match:${match.id}`).emit('score_update', payload);
        io.emit('score_update_global', payload);
      });
    });
  } catch (err) {
    logger.error('Fetch Error', { message: err.message });
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
  
  // Start fetching live scores immediately and every 30 seconds
  fetchAndProduce();
  setInterval(fetchAndProduce, 30000);
});
