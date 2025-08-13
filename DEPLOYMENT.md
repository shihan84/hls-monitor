# Vercel Deployment Guide - ITAssist HLS Multiviewer

This guide provides step-by-step instructions to deploy the ITAssist HLS Multiviewer project on Vercel.

## 📋 Prerequisites

- Node.js 18+ installed locally
- Vercel CLI installed globally: `npm i -g vercel`
- Git repository initialized (recommended)
- Telegram Bot Token and Chat ID

## 🚀 Quick Deployment Steps

### 1. Environment Variables Setup

Create a `.env` file in your project root:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

**Important:** Never commit `.env` file to git. Add it to `.gitignore`.

### 2. Update Vercel Configuration

The project already includes `vercel.json`. Update it with your configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "functions": {
    "server.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy the project:**
   ```bash
   vercel --prod
   ```

3. **Set environment variables during deployment:**
   - When prompted, add your environment variables:
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_CHAT_ID`

#### Option B: Using Vercel Dashboard

1. **Connect your repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

2. **Configure project:**
   - Framework: **Other**
   - Root Directory: `./`
   - Build Command: `npm run build` (or leave empty)
   - Output Directory: `./`

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_CHAT_ID`

4. **Deploy:**
   - Click "Deploy" button

## 🔧 Configuration Details

### Telegram Bot Setup

1. **Create a Telegram Bot:**
   - Message [@BotFather](https://t.me/botfather)
   - Create new bot: `/newbot`
   - Save the bot token

2. **Get Chat ID:**
   - Add your bot to your group/channel
   - Send a message to the group
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your chat ID (usually negative for groups)

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather | `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `TELEGRAM_CHAT_ID` | Target chat/group ID | `-1001234567890` |

## 🧪 Testing Your Deployment

### Test API Endpoints

After deployment, test your API endpoints:

1. **Health Check:**
   ```
   GET https://your-domain.vercel.app/api/telegram-notify/health
   ```

2. **Test Notification:**
   ```
   GET https://your-domain.vercel.app/api/telegram-notify/test
   ```

3. **Send Custom Notification:**
   ```
   POST https://your-domain.vercel.app/api/telegram-notify/notify
   Content-Type: application/json

   {
     "message": "Test message from deployment",
     "stream_name": "Test Stream",
     "error_type": "Test Alert"
   }
   ```

## 🛠️ Development vs Production

### Local Development
```bash
npm start
# Server runs on http://localhost:3000
```

### Production (Vercel)
- Static files served from CDN
- API functions serverless
- Auto-scaling based on demand
- Global edge network

## 📁 Project Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Frontend JavaScript
├── server.js           # Express server (for Vercel)
├── api/
│   └── telegram-notify.js  # Serverless API function
├── vercel.json         # Vercel configuration
├── package.json        # Dependencies
└── .env               # Environment variables (not committed)
```

## 🔄 Continuous Deployment

### GitHub Integration
1. Push your code to GitHub
2. Connect repository to Vercel
3. Automatic deployments on push to main branch

### Branch Previews
- Each pull request gets a unique preview URL
- Test changes before merging

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Working:**
   - Ensure variables are set in Vercel dashboard
   - Check for typos in variable names
   - Redeploy after adding variables

2. **API 404 Errors:**
   - Verify routes in `vercel.json`
   - Check function naming in `api/` directory
   - Ensure server.js is properly configured

3. **Telegram Notifications Not Sending:**
   - Verify bot token is correct
   - Check bot has permission to send messages
   - Ensure chat ID is correct (negative for groups)

### Debug Commands

```bash
# Check Vercel logs
vercel logs your-project-name

# Redeploy with logs
vercel --prod --debug
```

## 📞 Support

For issues or questions:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Telegram Bot API: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)
- Open an issue in this repository

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Telegram bot created and added to group
- [ ] Chat ID obtained
- [ ] Vercel CLI installed (if using CLI)
- [ ] Repository connected to Vercel
- [ ] Successful deployment
- [ ] API endpoints tested
- [ ] Telegram notifications working
