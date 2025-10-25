import { io, type Socket } from 'socket.io-client';
import { chatStore, type ChatMessage } from './stores/chat';

let socket: Socket | null = null;

export function initSocket() {
	if (socket) return socket;

	socket = io('http://localhost:3001', {
		autoConnect: false
	});

	socket.on('connect', () => {
		console.log('✅ Connecté au serveur Socket.io');
		chatStore.setConnected(true);
	});

	socket.on('disconnect', () => {
		console.log('❌ Déconnecté du serveur Socket.io');
		chatStore.setConnected(false);
	});

	socket.on('chat:started', (data: { sessionId: string }) => {
		console.log('Session créée:', data.sessionId);
		chatStore.setSessionId(data.sessionId);
	});

	socket.on('message:receive', (data: { message: ChatMessage }) => {
		console.log('Message reçu:', data.message);
		chatStore.addMessage({
			...data.message,
			sentAt: new Date(data.message.sentAt)
		});
	});

	socket.on('typing:indicator', (data: { isTyping: boolean; isFromSupport: boolean }) => {
		console.log('Typing indicator:', data);
		chatStore.setTyping(data.isTyping);
	});

	socket.on('chat:ended', (data: { sessionId: string }) => {
		console.log('Session terminée:', data.sessionId);
		chatStore.endChat();
	});

	socket.on('error', (data: { message: string }) => {
		console.error('Erreur Socket.io:', data.message);
		alert(`Erreur: ${data.message}`);
	});

	return socket;
}

export function connectSocket() {
	if (!socket) {
		initSocket();
	}
	socket?.connect();
}

export function disconnectSocket() {
	socket?.disconnect();
}

export function startChat(userId: string) {
	if (!socket?.connected) {
		connectSocket();
	}
	socket?.emit('chat:start', { userId });
}

export function joinChat(sessionId: string) {
	if (!socket?.connected) {
		connectSocket();
	}
	socket?.emit('chat:join', { sessionId });
}

export function sendMessage(sessionId: string, content: string, isFromSupport: boolean) {
	socket?.emit('message:send', { sessionId, content, isFromSupport });
}

export function startTyping(sessionId: string, isFromSupport: boolean) {
	socket?.emit('typing:start', { sessionId, isFromSupport });
}

export function stopTyping(sessionId: string, isFromSupport: boolean) {
	socket?.emit('typing:stop', { sessionId, isFromSupport });
}

export function endChat(sessionId: string) {
	socket?.emit('chat:end', { sessionId });
}

export function getSocket() {
	return socket;
}
