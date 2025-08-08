# ITAssist HLS Multiviewer - Broadcast Control Panel

A modern, self-hosted HLS multi-viewer with a professional broadcast theme UI. This application allows you to simultaneously view multiple HLS streams with an intuitive control panel for managing streams.

## Features

- 🎥 **Multi-Stream Viewing**: Watch up to 6 HLS streams simultaneously
- 🎛️ **Control Panel**: Easy stream management with add/remove functionality
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Broadcast Theme**: Professional UI with modern animations
- 💾 **Local Storage**: Streams are saved locally and persist between sessions
- 🔄 **Layout Controls**: Multiple grid layouts (1x1, 2x1, 2x2, 3x2, 4x6)
- ⚡ **HLS.js Integration**: Full HLS support with fallback for native HLS
- 🎯 **Real-time Controls**: Start/stop streams individually
- 📊 **Status Indicators**: Visual feedback for stream status
- 🤖 **Telegram Notifications**: Real-time alerts when streams fail
- 🔄 **Watchdog System**: Automatic retry with configurable attempts
- 📱 **Player Controls**: Native video controls for each stream

## Quick Start

### Prerequisites
- Windows 10/11
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Python 3.7+ (for Telegram notifications)
- HLS stream URLs (.m3u8 files)

### Installation

#### Option 1: Basic Setup (HLS Only)
1. **Download the files** to your Windows machine
2. **Open the folder** containing the application files
3. **Double-click** `start.bat` or run `start.ps1`
4. **Choose option 2** for HTTP server (recommended)
5. **Open your browser** and go to: `http://localhost:8000`

#### Option 2: Full Setup (HLS + Telegram Notifications)
1. **Download the files** to your Windows machine
2. **Double-click** `start_with_notifications.bat`
3. **Follow the setup instructions** for Telegram bot
4. **Open your browser** and go to: `http://localhost:8000`

### Telegram Bot Setup (Optional)

If you want Telegram notifications:

1. **Create a Telegram Bot**:
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow the instructions
   - Copy the bot token provided

2. **Configure the Bot**:
   - The bot token is already configured in `telegram_notify.py`
   - Send a message to your bot in Telegram
   - The script will automatically detect your chat ID

3. **Test Notifications**:
   - Start the application with `start_with_notifications.bat`
   - Click the "Test" button in the control panel
   - You should receive a test message on Telegram

## Usage Guide

### Adding Streams

1. **Click "Add Stream"** in the control panel
2. **Enter stream details**:
   - **Stream Name**: A descriptive name for your stream
   - **HLS URL**: The .m3u8 URL of your stream
   - **Layout Position**: Choose which grid position (1-24)
3. **Click "Add Stream"** to start viewing

### Managing Streams

- **Play/Pause**: Click the play/pause button next to each stream
- **Remove Stream**: Click the trash icon to remove a stream
- **Layout Controls**: Use the layout buttons to change grid arrangement

### Notification Controls

- **Notifications**: Toggle Telegram notifications on/off
- **Test**: Send a test notification to Telegram
- **Automatic Alerts**: Stream errors and retries are automatically reported

### Watchdog Features

- **Automatic Retry**: Failed streams are automatically retried (3 attempts)
- **Error Notifications**: Real-time alerts when streams fail
- **Retry Tracking**: Shows retry attempts in notifications
- **Configurable**: Adjust retry count and delay in the code

### Keyboard Shortcuts

- `Ctrl + N`: Open "Add Stream" modal
- `Esc`: Close modal (when open)

### Supported HLS URLs

The application supports standard HLS streams with:
- `.m3u8` manifest files
- HTTP/HTTPS URLs
- Live and VOD streams

## File Structure

```
multiviewr/
├── index.html                    # Main application file
├── styles.css                    # Broadcast theme styling
├── script.js                     # Application logic
├── telegram_notify.py            # Telegram notification relay
├── requirements.txt              # Python dependencies
├── start_with_notifications.bat  # Full setup script
├── start.bat                     # Basic setup script
├── start.ps1                     # PowerShell setup script
├── sample-streams.json           # Demo streams
└── README.md                     # This file
```

## Features in Detail

### Control Panel
- **Stream List**: Shows all added streams with status
- **Add Stream**: Modal dialog for adding new streams
- **Individual Controls**: Play/pause and remove for each stream
- **Notification Controls**: Toggle and test Telegram notifications

### Video Grid
- **Multiple Layouts**: 1x1, 2x1, 2x2, 3x2, 4x6 grid arrangements
- **Responsive Design**: Adapts to screen size
- **Hover Effects**: Visual feedback on interaction
- **Player Controls**: Native video controls for each stream

### Stream Management
- **Local Storage**: Streams persist between browser sessions
- **Error Handling**: Visual feedback for stream errors
- **Status Indicators**: Shows loading, playing, error states
- **Watchdog System**: Automatic retry with notifications

### Telegram Notifications
- **Real-time Alerts**: Instant notifications when streams fail
- **Retry Tracking**: Shows retry attempts and success/failure
- **Error Details**: Includes specific error information
- **Test Function**: Send test notifications to verify setup

## Browser Compatibility

| Browser | HLS Support | Status |
|---------|-------------|--------|
| Chrome | HLS.js | ✅ Full Support |
| Firefox | HLS.js | ✅ Full Support |
| Edge | HLS.js | ✅ Full Support |
| Safari | Native HLS | ✅ Full Support |

## Troubleshooting

### Stream Not Loading
1. **Check URL**: Ensure the HLS URL is valid and accessible
2. **CORS Issues**: Use a local HTTP server (see installation)
3. **Network**: Verify internet connection and stream availability

### Performance Issues
1. **Reduce Streams**: Limit to 2-3 streams for better performance
2. **Browser**: Try a different browser
3. **Hardware**: Ensure sufficient CPU/memory resources

### Audio Issues
- Streams are muted by default for better multi-stream experience
- Click on individual video players to unmute if needed

### Telegram Notifications Not Working
1. **Check Bot Setup**: Ensure you sent a message to your bot
2. **Verify Relay**: Check if `telegram_notify.py` is running on port 3001
3. **Test Connection**: Use the "Test" button in the control panel
4. **Check Logs**: Look at the relay console for error messages

## Advanced Features

### Export/Import Streams
- **Export**: Save your stream configuration as JSON
- **Import**: Load previously saved stream configurations

### Customization
The application can be customized by modifying:
- `styles.css`: Change colors, layout, animations
- `script.js`: Add new features or modify behavior
- `index.html`: Modify the UI structure
- `telegram_notify.py`: Customize notification messages

## Security Notes

- **Local Storage**: Stream data is stored locally in your browser
- **No Server**: This is a client-side application, no data is sent to external servers
- **HTTPS**: Use HTTPS URLs for secure streams
- **Telegram**: Notifications are sent via Telegram's secure API

## Development

### Adding New Features
1. **Fork the repository** (if using version control)
2. **Modify files** as needed
3. **Test thoroughly** with different stream types
4. **Update documentation** for new features

### Custom Themes
To create a custom theme:
1. **Modify `styles.css`** with your color scheme
2. **Update gradients** and animations
3. **Test** on different screen sizes

## Support

For issues or questions:
1. **Check browser console** for error messages
2. **Verify stream URLs** are accessible
3. **Test with different browsers**
4. **Ensure proper file permissions**
5. **Check Telegram bot setup** for notification issues

## License

This project is open source and available under the MIT License.

---

**Enjoy your ITAssist HLS Multiviewer!** 🎥📺🤖
