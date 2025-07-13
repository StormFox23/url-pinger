
import * as vscode from 'vscode';
import fetch from 'node-fetch';

export class UrlPingerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'url-pinger-view';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'pingUrl') {
        try {
          let url = message.url.trim();
          
          // Add protocol if missing
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          
          const startTime = Date.now();
          const res = await fetch(url, {
            method: 'GET',
            timeout: 10000, // 10 second timeout
            headers: {
              'User-Agent': 'VS Code URL Pinger Extension'
            }
          });
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          const statusText = res.statusText || 'Unknown';
          const contentType = res.headers.get('content-type') || 'Unknown';
          
          let result = `✅ Response received!\n`;
          result += `URL: ${url}\n`;
          result += `Status: ${res.status} ${statusText}\n`;
          result += `Response Time: ${responseTime}ms\n`;
          result += `Content-Type: ${contentType}\n`;
          result += `Content-Length: ${res.headers.get('content-length') || 'Unknown'}\n`;
          
          if (res.ok) {
            result += `\n🟢 Status: Healthy (${res.status})`;
          } else {
            result += `\n🔴 Status: Error (${res.status})`;
          }
          
          webviewView.webview.postMessage({
            command: 'showResult',
            result: result
          });
        } catch (err: any) {
          let errorMessage = `❌ Failed to ping URL\n`;
          errorMessage += `Error: ${err.message}\n`;
          
          if (err.code === 'ENOTFOUND') {
            errorMessage += `\n💡 The domain could not be found. Check the URL spelling.`;
          } else if (err.code === 'ECONNREFUSED') {
            errorMessage += `\n💡 Connection refused. The server may be down.`;
          } else if (err.code === 'ETIMEDOUT') {
            errorMessage += `\n💡 Request timed out. The server may be slow or unreachable.`;
          }
          
          webviewView.webview.postMessage({
            command: 'showResult',
            result: errorMessage
          });
        }
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>URL Pinger</title>
        <style>
          body { 
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 10px; 
          }
          .container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          input { 
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            box-sizing: border-box;
          }
          button { 
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          #result { 
            margin-top: 15px; 
            white-space: pre-wrap; 
            padding: 10px;
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <input id="urlInput" type="text" placeholder="Enter URL (e.g., https://example.com)" />
          <button id="pingBtn">Ping URL</button>
          <div id="result"></div>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          
          document.getElementById('pingBtn').onclick = () => {
            const url = document.getElementById('urlInput').value.trim();
            if (!url) {
              document.getElementById('result').textContent = 'Please enter a URL';
              return;
            }
            document.getElementById('result').textContent = 'Pinging...';
            vscode.postMessage({ command: 'pingUrl', url });
          };
          
          // Allow Enter key to trigger ping
          document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              document.getElementById('pingBtn').click();
            }
          });
          
          window.addEventListener('message', event => {
            const msg = event.data;
            if (msg.command === 'showResult') {
              document.getElementById('result').textContent = msg.result;
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}

// ...existing code...
