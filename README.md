# URL Pinger

A comprehensive VS Code extension for testing URL connectivity with advanced features like bulk testing, history management, scheduling, and detailed analytics.

## 🚀 Features

### Core Functionality
- **Single URL Testing**: Test individual URLs with detailed response information
- **Bulk URL Testing**: Test multiple URLs simultaneously with progress tracking
- **URL History**: Automatic history tracking with search and management
- **Scheduled Testing**: Set up periodic testing for continuous monitoring
- **Export Capabilities**: Export test results to JSON format

### Advanced Features
- **Smart URL Handling**: Automatically adds protocols if missing
- **Detailed Analytics**: Response time, status codes, content types, and headers
- **Visual Feedback**: Color-coded results with clear success/error indicators
- **Keyboard Support**: Press Enter to ping URLs quickly
- **Configurable Settings**: Customize timeouts, history size, and notification preferences

## 📦 Installation

### From Release Package
```bash
code --install-extension releases/url-pinger-X.X.X.vsix
```



## 🛠️ How to Use

1. **Open URL Pinger**: Click the pulse icon in the Activity Bar
2. **Single URL Test**: 
   - Enter a URL in the input field
   - Click "Ping URL" or press Enter
3. **Bulk Testing**:
   - Click "Bulk Test" button
   - Enter URLs line by line
   - Start the bulk test
4. **View History**: Browse previous tests and search through history
5. **Export Results**: Save test results as JSON files
6. **Schedule Tests**: Set up periodic monitoring for critical URLs

## ⚙️ Configuration

Access settings via: File → Preferences → Settings → Extensions → URL Pinger

- **Default Timeout**: Request timeout in milliseconds (default: 10000)
- **Max History Size**: Maximum URLs to keep in history (default: 20)
- **Auto Schedule Interval**: Default interval for scheduled tests (default: 60000ms)
- **Enable Notifications**: Show notifications for test results (default: true)

## 🧪 Sample URLs for Testing

- `google.com` - Healthy response
- `httpbin.org/status/404` - Error status testing
- `httpbin.org/delay/3` - Response time testing
- `jsonplaceholder.typicode.com/posts/1` - JSON API testing
- `nonexistent-domain-12345.com` - DNS error testing

## 🔧 Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/StormFox23/url-pinger.git
cd url-pinger

# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension
npm run build:release
```

### Release Builder

This project includes an automated release builder system:

```bash
# Interactive release builder
npm run build:release

# Quick version bumps
npm run build:release:patch    # 0.1.0 → 0.1.1
npm run build:release:minor    # 0.1.0 → 0.2.0
npm run build:release:major    # 0.1.0 → 1.0.0
```

See [RELEASE_BUILDER.md](RELEASE_BUILDER.md) for detailed documentation.

## 📋 Requirements

- VS Code 1.102.0 or higher
- Internet connection for URL testing
- Node.js (for development)

## 🐛 Known Issues

- Request timeout is configurable but applies to all requests
- Only supports HTTP/HTTPS protocols
- Large bulk tests may impact VS Code performance

## 📝 Release Notes

### 0.1.0 - Latest

- ✨ Added bulk URL testing with progress tracking
- ✨ Added URL history management with search
- ✨ Added export functionality for test results
- ✨ Added scheduled periodic testing
- ✨ Added configurable settings
- ✨ Improved UI with better visual feedback
- ✨ Added comprehensive error handling
- 🔧 Enhanced response time measurement
- 🔧 Better URL validation and handling

### 0.0.1 - Initial Release

- Basic URL pinging functionality
- Response time measurement
- Status code display
- Error handling for network issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This extension is released under the MIT License. See [LICENSE](LICENSE) for details.

## 🔗 Links

- [GitHub Repository](https://github.com/StormFox23/url-pinger)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=StormFox23.url-pinger)
- [Issue Tracker](https://github.com/StormFox23/url-pinger/issues)
- [Release Notes](https://github.com/StormFox23/url-pinger/releases)

**Enjoy!**
