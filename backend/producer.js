const axios = require('axios');
const amqp = require('amqplib');
const { QUEUE_URL, QUEUE_NAME, STATPAL_KEY } = require('./config');
const logger = require('./logger');

let channel = null;

async function initRabbit() {
  try {
    const conn = await amqp.connect(QUEUE_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    logger.info('Producer connected to RabbitMQ');
  } catch (err) {
    logger.error('RabbitMQ Init Failed', { message: err.message });
    setTimeout(initRabbit, 5000);
  }
}

async function fetchAndProduce() {
  try {
    logger.info('Fetching live scores from Statpal...');
    const response = await axios.get(`https://statpal.io/api/v1/cricket/livescores?access_key=${STATPAL_KEY}`);
    const data = response.data;

    if (!data || !data.scores || !data.scores.category) {
      logger.warn('Invalid data received from Statpal');
      return;
    }

    data.scores.category.forEach(cat => {
      const matches = Array.isArray(cat.match) ? cat.match : [cat.match];
      
      matches.forEach(match => {
        if (!match || !match.id) return;

        const payload = {
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
          live: match.status?.toLowerCase().includes('live') || match.status?.toLowerCase().includes('in progress')
        };

        if (channel) {
          channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), { persistent: true });
        }
      });
    });


  } catch (err) {
    logger.error('Fetch Error', { message: err.message });
  }
}

async function start() {
  await initRabbit();
  setInterval(fetchAndProduce, 30000); // Every 30 seconds
  fetchAndProduce();
}

start();
