# ITAssist HLS Multiviewer - Broadcast Control Panel

A modern, self-hosted HLS multi-viewer with a professional broadcast theme UI. This application allows you to simultaneously view multiple HLS streams with an intuitive control panel for managing streams.

## Features

- 🎥 **Multi-Stream Viewing**: Watch up to 6 HLS streams simultaneously
- 🎛️ **Control Panel**: Easy stream management with add/remove functionality
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Broadcast Theme**: Professional UI with modern animations
- 💾 **Local Storage**: Streams are saved locally and persist between sessions
- 🔄 **Layout Controls**: Multiple grid layouts (1x1, 2x1, 2x2, 3x2)
- ⚡ **HLS.js Integration**: Full HLS support with fallback for native HLS
- 🎯 **Real-time Controls**: Start/stop streams individually
- 📊 **Status Indicators**: Visual feedback for stream status

## Quick Start

### Prerequisites
- Windows 10/11
- Modern web browser (Chrome, Firefox, Edge, Safari)
- HLS stream URLs (.m3u8 files)

### Installation

1. **Download the files** to your Windows machine
2. **Open the folder** containing the application files
3. **Double-click** `index.html` to open in your default browser
   - Or right-click and select "Open with" → Choose your preferred browser

### Alternative: Using Python HTTP Server

For better performance and to avoid CORS issues:

1. **Open Command Prompt** in the application folder
2. **Run the command**:
   ```cmd
   python -m http.server 8000
   ```
3. **Open your browser** and go to: `http://localhost:8000`

## Usage Guide

### Adding Streams

1. **Click "Add Stream"** in the control panel
2. **Enter stream details**:
   - **Stream Name**: A descriptive name for your stream
   - **HLS URL**: The .m3u8 URL of your stream
   - **Layout Position**: Choose which grid position (1-6)
3. **Click "Add Stream"** to start viewing

### Managing Streams

- **Play/Pause**: Click the play/pause button next to each stream
- **Remove Stream**: Click the trash icon to remove a stream
- **Layout Controls**: Use the layout buttons to change grid arrangement

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
├── index.html          # Main application file
├── styles.css          # Broadcast theme styling
├── script.js           # Application logic
└── README.md          # This file
```

## Features in Detail

### Control Panel
- **Stream List**: Shows all added streams with status
- **Add Stream**: Modal dialog for adding new streams
- **Individual Controls**: Play/pause and remove for each stream

### Video Grid
- **Multiple Layouts**: 1x1, 2x1, 2x2, 3x2 grid arrangements
- **Responsive Design**: Adapts to screen size
- **Hover Effects**: Visual feedback on interaction

### Stream Management
- **Local Storage**: Streams persist between browser sessions
- **Error Handling**: Visual feedback for stream errors
- **Status Indicators**: Shows loading, playing, error states

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

## Advanced Features

### Export/Import Streams
- **Export**: Save your stream configuration as JSON
- **Import**: Load previously saved stream configurations

### Customization
The application can be customized by modifying:
- `styles.css`: Change colors, layout, animations
- `script.js`: Add new features or modify behavior
- `index.html`: Modify the UI structure

## Security Notes

- **Local Storage**: Stream data is stored locally in your browser
- **No Server**: This is a client-side application, no data is sent to external servers
- **HTTPS**: Use HTTPS URLs for secure streams

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

## License

This project is open source and available under the MIT License.

---

**Enjoy your ITAssist HLS Multiviewer!** 🎥📺
