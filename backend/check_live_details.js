const axios = require('axios');
const STATPAL_KEY = 'dc516d19-3430-4fb7-810b-c4a44193d6ec';

async function testApi() {
  try {
    const response = await axios.get(`https://statpal.io/api/v1/cricket/livescores?access_key=${STATPAL_KEY}`);
    const data = response.data;
    
    if (data.scores && data.scores.category) {
      const categories = Array.isArray(data.scores.category) ? data.scores.category : [data.scores.category];
      for (const cat of categories) {
        const matches = Array.isArray(cat.match) ? cat.match : [cat.match];
        for (const m of matches) {
           if (m.status && m.status.toLowerCase().includes('live')) {
              console.log('--- LIVE MATCH DETECTED ---');
              console.log('ID:', m.id);
              console.log('Innings Keys:', Object.keys(m.innings || {}));
              if (m.innings && m.innings.inning) {
                 const innings = Array.isArray(m.innings.inning) ? m.innings.inning : [m.innings.inning];
                 innings.forEach(inn => {
                    console.log(`Inning ${inn.id} Keys:`, Object.keys(inn));
                 });
              }
              console.log('Batsmen first 1:', (m.batsmen?.player || [])[0]);
              console.log('Bowlers first 1:', (m.bowler?.player || [])[0]);
              return;
           }
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApi();
