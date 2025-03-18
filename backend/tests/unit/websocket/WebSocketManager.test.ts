// File: backend/tests/unit/websocket/wsServer.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketManager } from '../../../src/websocket/WebSocketManager.js';
import { WebSocket } from 'ws';

// ✅ Mock WebSocket class
class MockWebSocket extends WebSocket {
	send = vi.fn();
	close = vi.fn();
	readyState = WebSocket.OPEN; // Simulates an open connection
}

// ✅ Setup fresh WebSocketManager before each test
beforeEach(() => {
	(WebSocketManager as any).clients.clear(); // Reset connected clients
});

describe('WebSocketManager', () => {
	it('should add clients on connection', () => {
		const mockWs = new MockWebSocket('ws://localhost');
		WebSocketManager.handleConnection(mockWs, { socket: { remoteAddress: '127.0.0.1' } });

		expect((WebSocketManager as any).clients.size).toBe(1);
	});

	it('should echo messages received', () => {
		const mockWs = new MockWebSocket('ws://localhost');
		WebSocketManager.handleConnection(mockWs, { socket: { remoteAddress: '127.0.0.1' } });

		const message = 'Hello, WebSocket!';
		mockWs.emit('message', Buffer.from(message));

		expect(mockWs.send).toHaveBeenCalledWith(`Echo: ${message}`);
	});

	it('should remove clients on disconnect', () => {
		const mockWs = new MockWebSocket('ws://localhost');
		WebSocketManager.handleConnection(mockWs, { socket: { remoteAddress: '127.0.0.1' } });

		expect((WebSocketManager as any).clients.size).toBe(1);

		mockWs.emit('close');

		expect((WebSocketManager as any).clients.size).toBe(0);
	});

	it('should broadcast messages to all connected clients', () => {
		const mockWs1 = new MockWebSocket('ws://localhost');
		const mockWs2 = new MockWebSocket('ws://localhost');

		WebSocketManager.handleConnection(mockWs1, { socket: { remoteAddress: '127.0.0.1' } });
		WebSocketManager.handleConnection(mockWs2, { socket: { remoteAddress: '127.0.0.2' } });

		const broadcastMessage = 'Broadcast message!';
		WebSocketManager.broadcast(broadcastMessage);

		expect(mockWs1.send).toHaveBeenCalledWith(broadcastMessage);
		expect(mockWs2.send).toHaveBeenCalledWith(broadcastMessage);
	});
});
