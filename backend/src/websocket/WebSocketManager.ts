// File: backend/src/websocket/WebSocketManager.ts

import { WebSocket } from 'ws';

export class WebSocketManager {
	private static clients = new Set<WebSocket>();

	static handleConnection(ws: WebSocket, req: any) {
		WebSocketManager.clients.add(ws);
		console.log(`New client connected. Total clients: ${WebSocketManager.clients.size}`);

		ws.on('message', (message: Buffer | string) => {
			const data = message.toString();
			console.log(`Received from ${req.socket.remoteAddress}:`, data);
			ws.send(`Echo: ${data}`);
		});

		ws.on('close', () => {
			WebSocketManager.clients.delete(ws);
			console.log(`Client disconnected. Remaining clients: ${WebSocketManager.clients.size}`);
		});
	}

	static broadcast(message: string) {
		WebSocketManager.clients.forEach(ws => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(message);
			}
		});
	}
}
