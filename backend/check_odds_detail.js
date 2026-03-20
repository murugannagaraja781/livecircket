const axios = require('axios');
const STATPAL_KEY = 'dc516d19-3430-4fb7-810b-c4a44193d6ec';

async function testApi() {
  try {
    const response = await axios.get(`https://statpal.io/api/v1/cricket/odds?access_key=${STATPAL_KEY}`);
    const data = response.data;
    
    if (data.odds && data.odds.category) {
      const categories = Array.isArray(data.odds.category) ? data.odds.category : [data.odds.category];
      for (const cat of categories) {
        const matchWrapper = cat.matches?.match;
        const matches = Array.isArray(matchWrapper) ? matchWrapper : [matchWrapper];
        for (const m of matches) {
           if (m && m.odds) {
              console.log('--- ODDS FOUND FOR MATCH ---');
              console.log('Match ID:', m.id);
              console.log('Odds Object:', JSON.stringify(m.odds, null, 2));
              return;
           }
        }
      }
    }
    console.log('No odds found in current data.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApi();
