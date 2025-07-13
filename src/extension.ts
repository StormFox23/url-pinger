import * as vscode from 'vscode';
import { UrlPingerViewProvider } from './UrlPingerViewProvider';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "url-pinger" is now active!');

	const provider = new UrlPingerViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(UrlPingerViewProvider.viewType, provider)
	);

	// Register the helloWorld command
	context.subscriptions.push(
		vscode.commands.registerCommand('url-pinger.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from URL Pinger!');
		})
	);
}

export function deactivate() {}
