const vscode = acquireVsCodeApi();

document.getElementById('ping-button').addEventListener('click', () => {
    const url = document.getElementById('url-input').value;
    vscode.postMessage({
        type: 'ping',
        value: url
    });
});
