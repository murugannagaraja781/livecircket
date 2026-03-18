const QUEUE_URL = process.env.QUEUE_URL || 'amqp://admin:Admin%402017@206.189.139.102';
const QUEUE_NAME = process.env.QUEUE_NAME || 'score_updates';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:RKy2KjNfcaFhd0qi@db.lmjpttkvfunuvyqkdkzv.supabase.co:5432/postgres';
const STATPAL_KEY = process.env.STATPAL_KEY || 'dc516d19-3430-4fb7-810b-c4a44193d6ec';
const PORT = process.env.PORT || 3000;

module.exports = {
  QUEUE_URL,
  QUEUE_NAME,
  DATABASE_URL,
  STATPAL_KEY,
  PORT,
};

