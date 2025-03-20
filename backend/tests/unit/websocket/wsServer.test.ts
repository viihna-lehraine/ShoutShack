// File: backend/tests/unit/websocket/wsServer.test.ts

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketManager } from '../../../src/websocket/WebSocketManager.js';

class MockWebSocket extends WebSocket {
	send = vi.fn();
	close = vi.fn();
	readyState = WebSocket.OPEN;
}

let wss: WebSocketServer;
let wsClient: WebSocket;

vi.spyOn(console, 'log').mockImplementation(() => {});

describe('WebSocket Server', () => {
	let wss: WebSocketServer;
	let mockWs: MockWebSocket;

	beforeEach(async () => {
		vi.clearAllMocks();
		WebSocketManager['clients'].clear();

		wss = new WebSocketServer({ port: 8081 });

		wss.on('connection', (ws, req) => {
			WebSocketManager.handleConnection(ws, req);
		});

		wsClient = new WebSocket('ws://localhost:8122');
		await new Promise(resolve => wsClient.once('open', resolve));
	});

	afterEach(() => {
		wsClient.close();
		wss.close();
	});

	it('should accept WebSocket connections', () => {
		expect(WebSocketManager['clients'].size).toBe(1);
	});

	it('should handle messages correctly', async () => {
		const messageSpy = vi.spyOn(wsClient, 'send');

		wsClient.send('Hello, server!');
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(messageSpy).toHaveBeenCalledWith('Echo: Hello, server!');
	});

	it('should remove clients on disconnect', async () => {
		wsClient.close();
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(WebSocketManager['clients'].size).toBe(0);
	});

	afterEach(() => {
		wss.close();
	});
});
