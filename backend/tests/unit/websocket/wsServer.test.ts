// File: backend/tests/unit/websocket/wsServer.test.ts

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketManager } from '../../../src/websocket/WebSocketManager.js';
import { env } from '../../../src/env/load.js';

// ✅ Mock WebSocket class
class MockWebSocket extends WebSocket {
	send = vi.fn();
	close = vi.fn();
	readyState = WebSocket.OPEN;
}

// ✅ Mock console.log to prevent test pollution
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('WebSocket Server', () => {
	let wss: WebSocketServer;
	let mockWs: MockWebSocket;

	beforeEach(() => {
		(WebSocketManager as any).clients.clear(); // Reset clients before each test
		wss = new WebSocketServer({ port: env.WS_PORT });
		mockWs = new MockWebSocket('ws://localhost');
	});

	it('should accept WebSocket connections', () => {
		const req = { socket: { remoteAddress: '127.0.0.1' } };
		wss.emit('connection', mockWs, req);

		expect((WebSocketManager as any).clients.size).toBe(1);
		expect(console.log).toHaveBeenCalledWith(`Client connected: 127.0.0.1`);
	});

	it('should handle messages correctly', () => {
		const req = { socket: { remoteAddress: '127.0.0.1' } };
		wss.emit('connection', mockWs, req);

		const message = 'Hello, server!';
		mockWs.emit('message', Buffer.from(message));

		expect(mockWs.send).toHaveBeenCalledWith(`Echo: ${message}`);
	});

	it('should remove clients on disconnect', () => {
		const req = { socket: { remoteAddress: '127.0.0.1' } };
		wss.emit('connection', mockWs, req);

		expect((WebSocketManager as any).clients.size).toBe(1);

		mockWs.emit('close');

		expect((WebSocketManager as any).clients.size).toBe(0);
		expect(console.log).toHaveBeenCalledWith(`Client disconnected: 127.0.0.1`);
	});

	afterEach(() => {
		wss.close();
	});
});
