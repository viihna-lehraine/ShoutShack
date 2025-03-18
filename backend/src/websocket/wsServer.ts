// File: backend/src/websocket/wsServer.ts

import { env } from '../env/load.js';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketManager } from './WebSocketManager.js';

const wss = new WebSocketServer({ port: env.WS_PORT });

wss.on('connection', (ws: WebSocket, req) => {
	console.log(`Client connected: ${req.socket.remoteAddress}`);

	WebSocketManager.handleConnection(ws, req);

	ws.on('close', () => {
		console.log(`Client disconnected: ${req.socket.remoteAddress}`);
	});
});

console.log(`WebSocket server started on ws://localhost:${env.WS_PORT}`);
