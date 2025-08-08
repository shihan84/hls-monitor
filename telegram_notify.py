#!/usr/bin/env python3
"""
Telegram Notification Relay for ITAssist HLS Multiviewer
Sends notifications to Telegram when HLS streams fail or have issues.
"""

import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from your web app

# Telegram Configuration
TELEGRAM_BOT_TOKEN = "8292264755:AAGFFsGQW04gQELvUORHotp8-MksUFzw_AE"
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# Chat ID storage - will be set manually or auto-detected
CHAT_ID_FILE = "telegram_chat_id.txt"
chat_id = None

def load_chat_id():
    """Load chat ID from file if exists"""
    global chat_id
    try:
        if os.path.exists(CHAT_ID_FILE):
            with open(CHAT_ID_FILE, 'r') as f:
                chat_id = f.read().strip()
                logger.info(f"Loaded chat ID from file: {chat_id}")
                return chat_id
    except Exception as e:
        logger.error(f"Error loading chat ID: {e}")
    return None

def save_chat_id(chat_id):
    """Save chat ID to file"""
    try:
        with open(CHAT_ID_FILE, 'w') as f:
            f.write(str(chat_id))
        logger.info(f"Saved chat ID to file: {chat_id}")
        return True
    except Exception as e:
        logger.error(f"Error saving chat ID: {e}")
        return False

def get_updates():
    """Get updates from Telegram to find your chat ID"""
    try:
        response = requests.get(f"{TELEGRAM_API_URL}/getUpdates")
        if response.status_code == 200:
            data = response.json()
            if data.get('ok') and data.get('result'):
                for update in data['result']:
                    if 'message' in update:
                        chat_id = update['message']['chat']['id']
                        logger.info(f"Found chat ID: {chat_id}")
                        save_chat_id(chat_id)
                        return chat_id
        return None
    except Exception as e:
        logger.error(f"Error getting updates: {e}")
        return None

def send_telegram_message(message, provided_chat_id=None):
    """Send a message to Telegram"""
    global chat_id
    
    if not provided_chat_id:
        # Try to get chat ID if not provided
        provided_chat_id = load_chat_id() or get_updates()
        if not provided_chat_id:
            logger.error("No chat ID available. Please send a message to your bot first or set manually.")
            return False
    
    try:
        payload = {
            'chat_id': provided_chat_id,
            'text': message,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(f"{TELEGRAM_API_URL}/sendMessage", json=payload)
        
        if response.status_code == 200:
            logger.info(f"Message sent successfully: {message[:50]}...")
            return True
        else:
            logger.error(f"Failed to send message: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok', 
        'timestamp': datetime.now().isoformat(),
        'chat_id_configured': bool(load_chat_id())
    })

@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    current_chat_id = load_chat_id()
    return jsonify({
        'bot_token': TELEGRAM_BOT_TOKEN[:20] + "...",
        'chat_id': current_chat_id,
        'configured': bool(current_chat_id)
    })

@app.route('/config', methods=['POST'])
def set_config():
    """Set chat ID manually"""
    try:
        data = request.get_json()
        new_chat_id = data.get('chat_id')
        
        if not new_chat_id:
            return jsonify({'success': False, 'error': 'Chat ID is required'}), 400
        
        # Test the chat ID by sending a test message
        test_message = """
🧪 <b>Configuration Test</b>

This is a test message to verify your chat ID configuration.

✅ If you receive this message, your configuration is correct!
        """.strip()
        
        # Test the chat ID by sending a test message
        success = send_telegram_message(test_message, new_chat_id)
        
        if success:
            save_chat_id(new_chat_id)
            return jsonify({
                'success': True,
                'message': 'Chat ID configured successfully! Test message sent.'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to send test message. Please verify your chat ID.'
            }), 400
            
    except Exception as e:
        logger.error(f"Error setting config: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/notify', methods=['POST'])
def notify():
    """Receive notification requests from the web app"""
    try:
        data = request.get_json()
        message = data.get('message', 'No message provided')
        stream_name = data.get('stream_name', 'Unknown Stream')
        error_type = data.get('error_type', 'Error')
        
        # Format the message for Telegram
        formatted_message = f"""
🚨 <b>HLS Stream Alert</b>

📺 <b>Stream:</b> {stream_name}
⚠️ <b>Type:</b> {error_type}
⏰ <b>Time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

{message}
        """.strip()
        
        # Send to Telegram
        success = send_telegram_message(formatted_message)
        
        return jsonify({
            'success': success,
            'message': 'Notification sent' if success else 'Failed to send notification'
        })
        
    except Exception as e:
        logger.error(f"Error processing notification: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/test', methods=['GET'])
def test_notification():
    """Test endpoint to send a test notification"""
    test_message = """
🧪 <b>Test Notification</b>

This is a test message from your ITAssist HLS Multiviewer notification system.

✅ If you receive this message, your notification system is working correctly!
        """.strip()
    
    success = send_telegram_message(test_message)
    return jsonify({
        'success': success,
        'message': 'Test notification sent' if success else 'Failed to send test notification'
    })

@app.route('/reset', methods=['POST'])
def reset_config():
    """Reset chat ID configuration"""
    try:
        if os.path.exists(CHAT_ID_FILE):
            os.remove(CHAT_ID_FILE)
        global chat_id
        chat_id = None
        return jsonify({
            'success': True,
            'message': 'Configuration reset successfully'
        })
    except Exception as e:
        logger.error(f"Error resetting config: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🤖 ITAssist HLS Multiviewer - Telegram Notification Relay")
    print("=" * 60)
    print(f"Bot Token: {TELEGRAM_BOT_TOKEN[:20]}...")
    print("\n📋 Setup Instructions:")
    print("1. Open Telegram and search for your bot")
    print("2. Send any message to your bot")
    print("3. The script will automatically detect your chat ID")
    print("4. Or use the web interface to configure manually")
    print("\n🚀 Starting notification relay on http://localhost:3001")
    print("📡 Your web app can now send notifications to this relay")
    print("=" * 60)
    
    # Try to load chat ID on startup
    chat_id = load_chat_id()
    if chat_id:
        print(f"✅ Chat ID loaded: {chat_id}")
    else:
        print("⚠️  No chat ID found. Please send a message to your bot or configure manually.")
    
    app.run(host='0.0.0.0', port=3001, debug=False)
