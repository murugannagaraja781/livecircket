const axios = require('axios');
const STATPAL_KEY = 'dc516d19-3430-4fb7-810b-c4a44193d6ec';

async function testApi() {
  try {
    console.log('Testing Results Endpoint...');
    const response = await axios.get(`https://statpal.io/api/v1/cricket/results?access_key=${STATPAL_KEY}`);
    console.log(JSON.stringify(response.data, null, 2).substring(0, 2000));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApi();
