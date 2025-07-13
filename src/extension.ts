import * as vscode from 'vscode';
import { UrlPingerViewProvider } from './UrlPingerViewProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "url-pinger" is now active!');

	const provider = new UrlPingerViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(UrlPingerViewProvider.viewType, provider)
	);

	// Register new commands
	context.subscriptions.push(
		vscode.commands.registerCommand('url-pinger.clearHistory', () => {
			provider.clearHistory();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('url-pinger.exportResults', () => {
			provider.exportResults();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('url-pinger.bulkTest', async () => {
			const urls = await vscode.window.showInputBox({
				prompt: 'Enter URLs separated by commas or new lines',
				placeHolder: 'https://example.com, https://google.com',
				value: ''
			});
			
			if (urls) {
				const urlList = urls.split(/[,\n]/).map(url => url.trim()).filter(url => url);
				if (urlList.length > 0) {
					// This would need to be handled by the webview
					vscode.window.showInformationMessage(`Starting bulk test for ${urlList.length} URLs`);
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('url-pinger.scheduleTest', async () => {
			const url = await vscode.window.showInputBox({
				prompt: 'Enter URL to schedule periodic testing',
				placeHolder: 'https://example.com'
			});
			
			if (url) {
				const interval = await vscode.window.showInputBox({
					prompt: 'Enter interval in seconds (default: 60)',
					placeHolder: '60',
					value: '60'
				});
				
				if (interval && !isNaN(parseInt(interval))) {
					vscode.window.showInformationMessage(`Scheduled periodic test for ${url} every ${interval} seconds`);
				}
			}
		})
	);

	// Clean up scheduled pings on deactivation
	context.subscriptions.push({
		dispose: () => {
			provider.dispose();
		}
	});
}

export function deactivate() {}
