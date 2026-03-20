const axios = require('axios');
const STATPAL_KEY = 'dc516d19-3430-4fb7-810b-c4a44193d6ec';

async function testApi() {
  try {
    console.log('Fetching Full Livescores Detail...');
    const response = await axios.get(`https://statpal.io/api/v1/cricket/livescores?access_key=${STATPAL_KEY}`);
    const data = response.data;
    
    // Find the first live or finished match to inspect
    let matchToInspect = null;
    if (data.scores && data.scores.category) {
      const categories = Array.isArray(data.scores.category) ? data.scores.category : [data.scores.category];
      for (const cat of categories) {
        const matches = Array.isArray(cat.match) ? cat.match : [cat.match];
        for (const m of matches) {
           if (m.status && m.status.toLowerCase().includes('live') || m.status.toLowerCase().includes('progress')) {
             matchToInspect = m;
             break;
           }
        }
        if (matchToInspect) break;
      }
      if (!matchToInspect && categories.length > 0) {
        const firstCat = categories[0];
        const matches = Array.isArray(firstCat.match) ? firstCat.match : [firstCat.match];
        matchToInspect = matches[0];
      }
    }

    if (matchToInspect) {
      console.log('Inspecting Match:', matchToInspect.id);
      console.log(JSON.stringify(matchToInspect, null, 2));
    } else {
      console.log('No matches found to inspect.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApi();
