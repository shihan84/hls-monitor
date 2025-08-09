const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/')));

// API endpoint to send Telegram notifications
app.post('/api/telegram-notify', async (req, res) => {
  const { message } = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || '-1002894846288'; // Default chat ID from DEPLOYMENT.md

  if (!botToken) {
    return res.status(500).json({ success: false, error: 'TELEGRAM_BOT_TOKEN is not configured.' });
  }

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required.' });
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    res.status(200).json({ success: true, message: 'Notification sent successfully.' });
  } catch (error) {
    console.error('Error sending Telegram notification:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: 'Failed to send notification.' });
  }
});

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
