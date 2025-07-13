# URL Pinger

A simple VS Code extension that allows you to ping URLs to check if they're alive and responsive.

## Features

- **Simple URL Pinging**: Enter any URL and get instant response information
- **Detailed Response Info**: Shows status code, response time, content type, and health status
- **Smart URL Handling**: Automatically adds https:// if protocol is missing
- **Visual Feedback**: Clear success/error indicators with helpful error messages
- **Keyboard Support**: Press Enter to ping URLs quickly

## How to Use

1. Open the URL Pinger view by clicking the pulse icon in the Activity Bar
2. Enter a URL in the input field (e.g., `google.com` or `https://example.com`)
3. Click "Ping URL" or press Enter
4. View the detailed response information

## Requirements

- VS Code 1.102.0 or higher
- Internet connection for pinging URLs

## Sample URLs to Test

- `google.com` - Should show healthy response
- `httpbin.org/status/404` - Shows error status
- `nonexistent-domain-12345.com` - Shows domain not found error

## Known Issues

- Timeout is set to 10 seconds for all requests
- Only supports HTTP/HTTPS protocols

## Release Notes

### 0.0.1

Initial release of URL Pinger
- Basic URL pinging functionality
- Response time measurement
- Status code display
- Error handling for common network issues
---

## License

This extension is released under the MIT License.

**Enjoy!**
