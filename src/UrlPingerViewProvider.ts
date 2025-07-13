
import * as vscode from 'vscode';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

interface PingResult {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class UrlPingerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'url-pinger-view';
  private _view?: vscode.WebviewView;
  private _urlHistory: string[] = [];
  private _pingResults: PingResult[] = [];
  private _scheduledPings: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.loadHistory();
  }

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
      switch (message.command) {
        case 'pingUrl':
          await this.handlePingUrl(message.url, webviewView);
          break;
        case 'bulkTest':
          await this.handleBulkTest(message.urls, webviewView);
          break;
        case 'clearHistory':
          this.clearHistory();
          this.updateWebview();
          break;
        case 'exportResults':
          this.exportResults();
          break;
        case 'scheduleTest':
          this.schedulePeriodicTest(message.url, message.interval);
          break;
        case 'stopScheduledTest':
          this.stopScheduledTest(message.url);
          break;
        case 'getHistory':
          this.sendHistoryToWebview(webviewView);
          break;
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
          .button-group {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          input, textarea { 
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            box-sizing: border-box;
            font-family: var(--vscode-font-family);
          }
          textarea {
            min-height: 80px;
            resize: vertical;
          }
          button { 
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
            font-size: 12px;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .secondary-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          .secondary-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
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
            max-height: 300px;
            overflow-y: auto;
          }
          .history-item {
            padding: 4px 8px;
            margin: 2px 0;
            background-color: var(--vscode-list-hoverBackground);
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
          }
          .history-item:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
          }
          .section {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 8px;
          }
          .hidden {
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="section">
            <div class="section-title">🎯 Single URL Test</div>
            <input id="urlInput" type="text" placeholder="Enter URL (e.g., https://example.com)" />
            <div style="margin-top: 12px;"></div>
            <div class="button-group">
              <button id="pingBtn">Ping URL</button>
              <button id="scheduleBtn" class="secondary-btn">Schedule Test</button>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 Bulk URL Test</div>
            <textarea id="bulkUrls" placeholder="Enter multiple URLs (one per line)"></textarea>
            <button id="bulkTestBtn">Test All URLs</button>
          </div>

          <div class="section">
            <div class="section-title">📝 Recent URLs</div>
            <div id="history"></div>
            <div class="button-group">
              <button id="clearHistoryBtn" class="secondary-btn">Clear History</button>
              <button id="exportBtn" class="secondary-btn">Export Results</button>
            </div>
          </div>

          <div id="result"></div>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          // Single URL ping
          document.getElementById('pingBtn').onclick = () => {
            const url = document.getElementById('urlInput').value.trim();
            if (!url) {
              document.getElementById('result').textContent = 'Please enter a URL';
              return;
            }
            document.getElementById('result').textContent = 'Pinging...';
            vscode.postMessage({ command: 'pingUrl', url });
          };

          // Bulk URL test
          document.getElementById('bulkTestBtn').onclick = () => {
            const urls = document.getElementById('bulkUrls').value.trim();
            if (!urls) {
              document.getElementById('result').textContent = 'Please enter URLs for bulk testing';
              return;
            }
            const urlList = urls.split('\\n').filter(url => url.trim());
            if (urlList.length === 0) {
              document.getElementById('result').textContent = 'No valid URLs found';
              return;
            }
            document.getElementById('result').textContent = 'Testing multiple URLs...';
            vscode.postMessage({ command: 'bulkTest', urls: urlList });
          };

          // Schedule test
          document.getElementById('scheduleBtn').onclick = () => {
            const url = document.getElementById('urlInput').value.trim();
            if (!url) {
              document.getElementById('result').textContent = 'Please enter a URL to schedule';
              return;
            }
            const interval = prompt('Enter interval in seconds (default: 60):', '60');
            if (interval && !isNaN(parseInt(interval))) {
              vscode.postMessage({ 
                command: 'scheduleTest', 
                url, 
                interval: parseInt(interval) * 1000 
              });
            }
          };

          // Clear history
          document.getElementById('clearHistoryBtn').onclick = () => {
            vscode.postMessage({ command: 'clearHistory' });
          };

          // Export results
          document.getElementById('exportBtn').onclick = () => {
            vscode.postMessage({ command: 'exportResults' });
          };

          // Enter key support
          document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              document.getElementById('pingBtn').click();
            }
          });

          // History click handler
          document.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-item')) {
              document.getElementById('urlInput').value = e.target.textContent;
            }
          });

          // Message handling
          window.addEventListener('message', event => {
            const msg = event.data;
            switch (msg.command) {
              case 'showResult':
                document.getElementById('result').textContent = msg.result;
                break;
              case 'updateHistory':
                updateHistory(msg.history);
                break;
              case 'showProgress':
                document.getElementById('result').textContent = msg.message;
                break;
            }
          });

          function updateHistory(history) {
            const historyDiv = document.getElementById('history');
            historyDiv.innerHTML = '';
            history.forEach(url => {
              const item = document.createElement('div');
              item.className = 'history-item';
              item.textContent = url;
              historyDiv.appendChild(item);
            });
          }

          // Request initial history
          vscode.postMessage({ command: 'getHistory' });
        </script>
      </body>
      </html>
    `;
  }

  private async handlePingUrl(url: string, webviewView: vscode.WebviewView) {
    try {
      let cleanUrl = url.trim();
      
      // Add protocol if missing
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const config = vscode.workspace.getConfiguration('urlPinger');
      const timeout = config.get<number>('defaultTimeout', 10000);
      
      const startTime = Date.now();
      const res = await fetch(cleanUrl, {
        method: 'GET',
        timeout: timeout,
        headers: {
          'User-Agent': 'VS Code URL Pinger Extension'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const statusText = res.statusText || 'Unknown';
      const contentType = res.headers.get('content-type') || 'Unknown';
      
      const pingResult: PingResult = {
        url: cleanUrl,
        status: res.status,
        statusText,
        responseTime,
        timestamp: new Date(),
        success: res.ok
      };

      this._pingResults.push(pingResult);
      this.addToHistory(cleanUrl);
      
      let result = `✅ Response received!\n`;
      result += `URL: ${cleanUrl}\n`;
      result += `Status: ${res.status} ${statusText}\n`;
      result += `Response Time: ${responseTime}ms\n`;
      result += `Content-Type: ${contentType}\n`;
      result += `Content-Length: ${res.headers.get('content-length') || 'Unknown'}\n`;
      result += `Timestamp: ${pingResult.timestamp.toLocaleString()}\n`;
      
      if (res.ok) {
        result += `\n🟢 Status: Healthy (${res.status})`;
      } else {
        result += `\n🔴 Status: Error (${res.status})`;
      }
      
      webviewView.webview.postMessage({
        command: 'showResult',
        result: result
      });

      // Show notification if enabled
      const enableNotifications = config.get<boolean>('enableNotifications', true);
      if (enableNotifications) {
        if (res.ok) {
          vscode.window.showInformationMessage(`✅ ${cleanUrl} is healthy (${res.status})`);
        } else {
          vscode.window.showWarningMessage(`⚠️ ${cleanUrl} returned ${res.status}`);
        }
      }
      
    } catch (err: any) {
      const pingResult: PingResult = {
        url: url,
        status: 0,
        statusText: 'Error',
        responseTime: 0,
        timestamp: new Date(),
        success: false,
        error: err.message
      };

      this._pingResults.push(pingResult);
      this.addToHistory(url);
      
      let errorMessage = `❌ Failed to ping URL\n`;
      errorMessage += `URL: ${url}\n`;
      errorMessage += `Error: ${err.message}\n`;
      errorMessage += `Timestamp: ${pingResult.timestamp.toLocaleString()}\n`;
      
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

      const config = vscode.workspace.getConfiguration('urlPinger');
      const enableNotifications = config.get<boolean>('enableNotifications', true);
      if (enableNotifications) {
        vscode.window.showErrorMessage(`❌ Failed to ping ${url}: ${err.message}`);
      }
    }
  }

  private async handleBulkTest(urls: string[], webviewView: vscode.WebviewView) {
    let results = `📋 Bulk URL Test Results\n`;
    results += `Testing ${urls.length} URLs...\n`;
    results += `Started: ${new Date().toLocaleString()}\n\n`;

    webviewView.webview.postMessage({
      command: 'showProgress',
      message: `Testing ${urls.length} URLs...`
    });

    const promises = urls.map(async (url, index) => {
      try {
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
        }

        const config = vscode.workspace.getConfiguration('urlPinger');
        const timeout = config.get<number>('defaultTimeout', 10000);
        
        const startTime = Date.now();
        const res = await fetch(cleanUrl, {
          method: 'GET',
          timeout: timeout,
          headers: {
            'User-Agent': 'VS Code URL Pinger Extension'
          }
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const pingResult: PingResult = {
          url: cleanUrl,
          status: res.status,
          statusText: res.statusText || 'Unknown',
          responseTime,
          timestamp: new Date(),
          success: res.ok
        };

        this._pingResults.push(pingResult);
        this.addToHistory(cleanUrl);

        return `${index + 1}. ${cleanUrl}\n   Status: ${res.status} ${res.statusText} (${responseTime}ms) ${res.ok ? '✅' : '❌'}\n`;
        
      } catch (err: any) {
        const pingResult: PingResult = {
          url: url,
          status: 0,
          statusText: 'Error',
          responseTime: 0,
          timestamp: new Date(),
          success: false,
          error: err.message
        };

        this._pingResults.push(pingResult);
        this.addToHistory(url);

        return `${index + 1}. ${url}\n   Error: ${err.message} ❌\n`;
      }
    });

    const testResults = await Promise.all(promises);
    results += testResults.join('\n');
    
    const successCount = this._pingResults.slice(-urls.length).filter(r => r.success).length;
    results += `\n\n📊 Summary: ${successCount}/${urls.length} URLs successful`;

    webviewView.webview.postMessage({
      command: 'showResult',
      result: results
    });

    vscode.window.showInformationMessage(`Bulk test completed: ${successCount}/${urls.length} URLs successful`);
  }

  private addToHistory(url: string) {
    // Remove if already exists
    const index = this._urlHistory.indexOf(url);
    if (index > -1) {
      this._urlHistory.splice(index, 1);
    }
    
    // Add to beginning
    this._urlHistory.unshift(url);
    
    // Limit history size
    const config = vscode.workspace.getConfiguration('urlPinger');
    const maxSize = config.get<number>('maxHistorySize', 20);
    if (this._urlHistory.length > maxSize) {
      this._urlHistory = this._urlHistory.slice(0, maxSize);
    }
    
    this.saveHistory();
    this.updateWebview();
  }

  public clearHistory() {
    this._urlHistory = [];
    this._pingResults = [];
    this.saveHistory();
    vscode.window.showInformationMessage('URL history cleared');
  }

  public exportResults() {
    if (this._pingResults.length === 0) {
      vscode.window.showWarningMessage('No ping results to export');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `url-ping-results-${timestamp}.json`;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      totalResults: this._pingResults.length,
      results: this._pingResults.map(r => ({
        url: r.url,
        status: r.status,
        statusText: r.statusText,
        responseTime: r.responseTime,
        timestamp: r.timestamp.toISOString(),
        success: r.success,
        error: r.error
      }))
    };

    vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(filename),
      filters: {
        'JSON Files': ['json'],
        'All Files': ['*']
      }
    }).then(uri => {
      if (uri) {
        fs.writeFileSync(uri.fsPath, JSON.stringify(exportData, null, 2));
        vscode.window.showInformationMessage(`Results exported to ${uri.fsPath}`);
      }
    });
  }

  private schedulePeriodicTest(url: string, interval: number) {
    // Stop existing scheduled test for this URL
    this.stopScheduledTest(url);

    const timeoutId = setInterval(async () => {
      if (this._view) {
        await this.handlePingUrl(url, this._view);
      }
    }, interval);

    this._scheduledPings.set(url, timeoutId);
    vscode.window.showInformationMessage(`Scheduled periodic test for ${url} every ${interval/1000} seconds`);
  }

  private stopScheduledTest(url: string) {
    const timeoutId = this._scheduledPings.get(url);
    if (timeoutId) {
      clearInterval(timeoutId);
      this._scheduledPings.delete(url);
      vscode.window.showInformationMessage(`Stopped scheduled test for ${url}`);
    }
  }

  private updateWebview() {
    if (this._view) {
      this.sendHistoryToWebview(this._view);
    }
  }

  private sendHistoryToWebview(webviewView: vscode.WebviewView) {
    webviewView.webview.postMessage({
      command: 'updateHistory',
      history: this._urlHistory
    });
  }

  private loadHistory() {
    try {
      const historyFile = path.join(this._extensionUri.fsPath, 'url-history.json');
      if (fs.existsSync(historyFile)) {
        const data = fs.readFileSync(historyFile, 'utf8');
        this._urlHistory = JSON.parse(data);
      }
    } catch (error) {
      // Ignore errors, start with empty history
    }
  }

  private saveHistory() {
    try {
      const historyFile = path.join(this._extensionUri.fsPath, 'url-history.json');
      fs.writeFileSync(historyFile, JSON.stringify(this._urlHistory, null, 2));
    } catch (error) {
      // Ignore errors
    }
  }

  public dispose() {
    // Clean up scheduled pings
    for (const timeoutId of this._scheduledPings.values()) {
      clearInterval(timeoutId);
    }
    this._scheduledPings.clear();
  }
}

// ...existing code...
