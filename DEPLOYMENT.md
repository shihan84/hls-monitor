# 🚀 Deployment Guide - ITAssist HLS Multiviewer

## GitHub + Vercel Deployment

This guide will help you deploy your ITAssist HLS Multiviewer to Vercel via GitHub.

### 📋 Prerequisites

1. **GitHub Account** - Create a repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Telegram Bot** - Already configured ✅

### 🔧 Step 1: Prepare Your Repository

1. **Create a new GitHub repository**
2. **Upload all files** to your repository:
   ```
   📁 Your Repository
   ├── 📄 index.html
   ├── 📄 styles.css
   ├── 📄 script.js
   ├── 📄 package.json
   ├── 📄 vercel.json
   ├── 📁 api/
   │   └── 📄 telegram-notify.js
   ├── 📄 README.md
   ├── 📄 DEPLOYMENT.md
   └── 📄 sample-streams.json
   ```

### 🔧 Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project settings:**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

### 🔧 Step 3: Environment Variables

In your Vercel project dashboard:

1. **Go to Settings → Environment Variables**
2. **Add the following variable:**
   ```
   Name: TELEGRAM_BOT_TOKEN
   Value: 8292264755:AAGFFsGQW04gQELvUORHotp8-MksUFzw_AE
   Environment: Production
   ```

### 🔧 Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for deployment to complete**
3. **Your app will be available at**: `https://your-project-name.vercel.app`

### ✅ Features Available in Production

- ✅ **HLS Multi-Viewer** - View multiple streams simultaneously
- ✅ **Telegram Notifications** - Real-time alerts to your group
- ✅ **Watchdog System** - Automatic retry with notifications
- ✅ **Layout Controls** - 1x1, 2x1, 2x2, 3x2, 4x6 grids
- ✅ **Stream Management** - Add/remove streams
- ✅ **Local Storage** - Streams persist between sessions

### 🔧 Step 5: Test Your Deployment

1. **Open your Vercel URL**
2. **Click "Config" button** in notification controls
3. **Test Telegram notifications**
4. **Add HLS streams** and verify notifications work

### 📱 Telegram Integration

Your app will automatically send notifications to:
- **Chat ID**: `-1002894846288` (Streaming Status group)
- **Bot**: `@itassist0_bot`

### 🔄 Automatic Updates

- **Push to GitHub** → **Automatic Vercel deployment**
- **No manual deployment needed**
- **Instant updates** when you commit changes

### 🛠️ Troubleshooting

#### If notifications don't work:
1. **Check Vercel logs** in dashboard
2. **Verify environment variables** are set
3. **Test bot token** manually
4. **Check Chat ID** is correct

#### If streams don't load:
1. **Check CORS** - Vercel handles this automatically
2. **Verify HLS URLs** are accessible
3. **Check browser console** for errors

### 📊 Monitoring

- **Vercel Analytics** - Track usage
- **Telegram Notifications** - Monitor stream health
- **Browser Console** - Debug issues

### 🔒 Security Notes

- **Bot token** is stored securely in Vercel
- **No sensitive data** in client-side code
- **HTTPS** enabled automatically by Vercel

### 🎉 Success!

Your ITAssist HLS Multiviewer is now:
- ✅ **Live on the web**
- ✅ **Telegram notifications working**
- ✅ **Auto-deploying from GitHub**
- ✅ **Production ready**

**Share your Vercel URL** with your team! 🚀
