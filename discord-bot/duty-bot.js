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

// Configuration - Replace these with your values
const BOT_TOKEN = 'MTQ1MDgxNzU3MzQ1NjE4MzQ3Mg.GCk5Xm.rEC8E9OzCDfZCEuBwnsXDRx7UrvI_9_Tnvxnhg';
const DUTY_CHANNEL_ID = '1442201608048873493';
const WEBHOOK_URL = 'https://dvaudymlldvgjsltduus.supabase.co/functions/v1/duty-webhook';

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
  
  // Ignore bot messages (optional - remove if your duty bot posts messages)
  // if (message.author.bot) return;
  
  const content = message.content;
  
  // Check if message matches duty format: (license:xxxxx) went on-duty/off-duty. (Rank)
  if (content.includes('went on-duty') || content.includes('went off-duty')) {
    console.log(`📨 Duty message detected: ${content}`);
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Duty log saved:', data);
      } else {
        console.error('❌ Error saving duty log:', data);
      }
    } catch (error) {
      console.error('❌ Failed to send to webhook:', error.message);
    }
  }
});

client.login(BOT_TOKEN);
