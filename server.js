require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// CORS middleware for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Telegram API setup
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let chatId = process.env.TELEGRAM_CHAT_ID || "-1002894846288"; // Default, can be changed via API

async function sendTelegramMessage(message, targetChatId = chatId) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not configured.');
    return false;
  }
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: targetChatId,
      text: message,
      parse_mode: 'HTML'
    };
    const response = await axios.post(url, payload);
    return response.status === 200;
  } catch (error) {
    console.error('Error sending Telegram message:', error.response ? error.response.data : error.message);
    return false;
  }
}

// API Routes
const apiRouter = express.Router();

// POST /api/telegram-notify/notify
apiRouter.post('/notify', async (req, res) => {
  const { message, stream_name, error_type } = req.body;
  const formattedMessage = `
🚨 <b>HLS Stream Alert</b>

📺 <b>Stream:</b> ${stream_name || 'Unknown Stream'}
⚠️ <b>Type:</b> ${error_type || 'Error'}
⏰ <b>Time:</b> ${new Date().toLocaleString()}

${message || 'No message provided'}
  `.trim();
  const success = await sendTelegramMessage(formattedMessage);
  res.json({ success, message: success ? 'Notification sent' : 'Failed to send notification' });
});

// GET /api/telegram-notify/test
apiRouter.get('/test', async (req, res) => {
  const testMessage = `
🧪 <b>Test Notification</b>

This is a test message from your ITAssist HLS Multiviewer.
✅ If you receive this, your notification system is working!
  `.trim();
  const success = await sendTelegramMessage(testMessage);
  res.json({ success, message: success ? 'Test notification sent' : 'Failed to send test notification' });
});

// GET /api/telegram-notify/config
apiRouter.get('/config', (req, res) => {
  res.json({
    bot_token: TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.substring(0, 20) + "..." : "Not Set",
    chat_id: chatId,
    configured: !!TELEGRAM_BOT_TOKEN
  });
});

// POST /api/telegram-notify/config
apiRouter.post('/config', async (req, res) => {
  const { chat_id: newChatId } = req.body;
  if (!newChatId) {
    return res.status(400).json({ success: false, error: 'Chat ID is required' });
  }
  const testMessage = `
🧪 <b>Configuration Test</b>

This is a test message to verify your new chat ID.
✅ If you receive this, your configuration is correct!
  `.trim();
  const success = await sendTelegramMessage(testMessage, newChatId);
  if (success) {
    chatId = newChatId; // Update the chat ID
    console.log(`Telegram Chat ID updated to: ${chatId}`);
    return res.json({ success: true, message: 'Chat ID configured successfully!' });
  } else {
    return res.status(400).json({ success: false, error: 'Failed to send test message. Verify Chat ID.' });
  }
});

// POST /api/telegram-notify/reset
apiRouter.post('/reset', (req, res) => {
    chatId = process.env.TELEGRAM_CHAT_ID || "-1002894846288"; // Reset to default
    console.log('Telegram Chat ID reset to default.');
    res.json({ success: true, message: 'Configuration reset successfully' });
});

app.use('/api/telegram-notify', apiRouter);


// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
