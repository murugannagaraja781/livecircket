const axios = require('axios');
const STATPAL_KEY = 'dc516d19-3430-4fb7-810b-c4a44193d6ec';

async function testApi() {
  try {
    console.log('Testing Odds/Markets Endpoint...');
    // Try a few variations
    const urls = [
      `https://statpal.io/api/v1/cricket/odds?access_key=${STATPAL_KEY}`,
      `https://statpal.io/api/v1/cricket/markets?access_key=${STATPAL_KEY}`,
      `https://statpal.io/api/v1/cricket/sessions?access_key=${STATPAL_KEY}`
    ];

    for (const url of urls) {
      try {
        console.log(`Checking: ${url}`);
        const response = await axios.get(url);
        console.log(`Success! First 500 chars: ${JSON.stringify(response.data).substring(0, 500)}`);
        break;
      } catch (e) {
        console.log(`Failed: ${url} (${e.message})`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApi();
