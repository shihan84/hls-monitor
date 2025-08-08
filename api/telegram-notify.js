const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8292264755:AAGFFsGQW04gQELvUORHotp8-MksUFzw_AE";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Default chat ID for the group
const DEFAULT_CHAT_ID = "-1002894846288";

async function sendTelegramMessage(message, chatId = DEFAULT_CHAT_ID) {
  try {
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    };
    
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, payload);
    
    if (response.status === 200) {
      console.log('Message sent successfully:', message.substring(0, 50) + '...');
      return true;
    } else {
      console.error('Failed to send message:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    return false;
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        if (req.url.includes('/health')) {
          return res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            chat_id_configured: true
          });
        }
        
        if (req.url.includes('/config')) {
          return res.json({
            bot_token: TELEGRAM_BOT_TOKEN.substring(0, 20) + "...",
            chat_id: DEFAULT_CHAT_ID,
            configured: true
          });
        }
        
        if (req.url.includes('/test')) {
          const testMessage = `
🧪 <b>Test Notification</b>

This is a test message from your ITAssist HLS Multiviewer notification system (Vercel).

✅ If you receive this message, your notification system is working correctly!
          `.trim();
          
          const success = await sendTelegramMessage(testMessage);
          return res.json({
            success,
            message: success ? 'Test notification sent' : 'Failed to send test notification'
          });
        }
        
        return res.status(404).json({ error: 'Endpoint not found' });

      case 'POST':
        if (req.url.includes('/notify')) {
          const { message, stream_name, error_type } = req.body;
          
          const formattedMessage = `
🚨 <b>HLS Stream Alert</b>

📺 <b>Stream:</b> ${stream_name || 'Unknown Stream'}
⚠️ <b>Type:</b> ${error_type || 'Error'}
⏰ <b>Time:</b> ${new Date().toLocaleString()}

${message || 'No message provided'}
          `.trim();
          
          const success = await sendTelegramMessage(formattedMessage);
          return res.json({
            success,
            message: success ? 'Notification sent' : 'Failed to send notification'
          });
        }
        
        if (req.url.includes('/config')) {
          const { chat_id } = req.body;
          
          if (!chat_id) {
            return res.status(400).json({ 
              success: false, 
              error: 'Chat ID is required' 
            });
          }
          
          const testMessage = `
🧪 <b>Configuration Test</b>

This is a test message to verify your chat ID configuration.

✅ If you receive this message, your configuration is correct!
          `.trim();
          
          const success = await sendTelegramMessage(testMessage, chat_id);
          
          if (success) {
            return res.json({
              success: true,
              message: 'Chat ID configured successfully! Test message sent.'
            });
          } else {
            return res.status(400).json({
              success: false,
              error: 'Failed to send test message. Please verify your chat ID.'
            });
          }
        }
        
        return res.status(404).json({ error: 'Endpoint not found' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
