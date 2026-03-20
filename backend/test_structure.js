const axios = require('axios');
const STATPAL_KEY = 'dc516d19-3430-4fb7-810b-c4a44193d6ec';

async function testApi() {
  try {
    console.log('Fetching Livescores...');
    const response = await axios.get(`https://statpal.io/api/v1/cricket/livescores?access_key=${STATPAL_KEY}`);
    const data = response.data;
    console.log('Top level keys:', Object.keys(data));
    if (data.scores) {
      console.log('Scores keys:', Object.keys(data.scores));
    }
    // Check if there are matches with "Finished" or similar status in the scores
    if (data.scores && data.scores.category) {
      const categories = Array.isArray(data.scores.category) ? data.scores.category : [data.scores.category];
      categories.forEach(cat => {
        const matches = Array.isArray(cat.match) ? cat.match : [cat.match];
        matches.forEach(m => {
          if (m.status && !m.status.toLowerCase().includes('live')) {
             console.log(`Match ${m.id} Status: ${m.status}`);
          }
        });
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApi();
