# MDT Duty Hours Discord Bot

This bot monitors a Discord channel for duty status messages and forwards them to the MDT system.

## Setup Instructions

### Option 1: Run on Your Computer

1. **Install Node.js** from https://nodejs.org (LTS version)

2. **Open terminal/command prompt** in this `discord-bot` folder

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

5. Keep the terminal open while you want the bot to run.

### Option 2: Deploy to Railway (Free, 24/7)

1. Go to https://railway.app and sign up with GitHub

2. Create a new project → "Deploy from GitHub repo" or "Empty Project"

3. Add a new service → "Empty Service"

4. Add environment variables:
   - `BOT_TOKEN`: Your Discord bot token
   - `DUTY_CHANNEL_ID`: The channel ID
   - `WEBHOOK_URL`: https://dvaudymlldvgjsltduus.supabase.co/functions/v1/duty-webhook

5. Deploy the `discord-bot` folder contents

### Option 3: Deploy to Render (Free)

1. Go to https://render.com and sign up

2. Create a new "Background Worker"

3. Connect your GitHub repo or upload files

4. Set environment variables as above

5. Deploy

## How It Works

The bot listens for messages containing:
- `went on-duty` - Records duty start time
- `went off-duty` - Records duty end time

Messages must include a license ID in format: `(license:xxxxx)`

Example: `(license:a4958a6f) went on-duty. (Deputy)`

## Troubleshooting

- **Bot not responding**: Make sure "Message Content Intent" is enabled in Discord Developer Portal
- **Permission errors**: Ensure bot has access to view the duty channel
- **Connection issues**: Check your internet connection and bot token
