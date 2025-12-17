/**
 * Discord Duty Hours Bot
 * 
 * This bot listens for duty status messages and forwards them to the MDT webhook.
 * 
 * To run this bot:
 * 1. Install Node.js (https://nodejs.org)
 * 2. Open terminal in this folder
 * 3. Run: npm install discord.js
 * 4. Run: node duty-bot.js
 * 
 * Or deploy to Railway/Render for 24/7 operation.
 */

const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DUTY_CHANNEL_ID = process.env.DUTY_CHANNEL_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN || !DUTY_CHANNEL_ID || !WEBHOOK_URL) {
  console.error('❌ Missing required environment variables.');
  console.error('Required: BOT_TOKEN, DUTY_CHANNEL_ID, WEBHOOK_URL');
  console.error('Received:', {
    BOT_TOKEN: BOT_TOKEN ? '[set]' : '[missing]',
    DUTY_CHANNEL_ID: DUTY_CHANNEL_ID ? '[set]' : '[missing]',
    WEBHOOK_URL: WEBHOOK_URL ? '[set]' : '[missing]',
  });
  process.exit(1);
}

function postJson(urlString, body) {
  const url = new URL(urlString);
  const payload = JSON.stringify(body);

  const options = {
    method: 'POST',
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let data = raw;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          // keep raw string
        }

        resolve({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode ?? 0,
          data,
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📡 Listening for duty messages in channel: ${DUTY_CHANNEL_ID}`);
});

client.on('messageCreate', async (message) => {
  // Only process messages from the duty channel
  if (message.channel.id !== DUTY_CHANNEL_ID) return;

  const content = message.content;
  const normalized = content.toLowerCase();

  // Check if message matches duty format variants:
  // (license:xxxxx) went on-duty/off-duty. (Rank)
  // (license:xxxxx) went on duty/off duty. (Rank)
  const isDutyMessage = /went\s+(on[- ]duty|off[- ]duty)/i.test(normalized);

  if (isDutyMessage) {
    console.log(`📨 Duty message detected: ${content}`);

    try {
      const { ok, status, data } = await postJson(WEBHOOK_URL, { content });

      if (ok) {
        console.log('✅ Duty log saved:', data);
      } else {
        console.error(`❌ Error saving duty log (HTTP ${status}):`, data);
      }
    } catch (error) {
      console.error('❌ Failed to send to webhook:', error?.message || error);
    }
  }
});

client.login(BOT_TOKEN).catch((err) => {
  console.error('❌ Discord login failed. Check BOT_TOKEN and bot permissions/intents.');
  console.error(err);
  process.exit(1);
});

