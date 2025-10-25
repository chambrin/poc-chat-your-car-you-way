import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { prisma } from './db';

export function initSocketServer(httpServer: HTTPServer) {
	const io = new Server(httpServer, {
		cors: {
			origin: 'http://localhost:5173', // Port dev SvelteKit
			methods: ['GET', 'POST']
		}
	});

	io.on('connection', (socket) => {
		console.log('Client connecté:', socket.id);

		// Démarrer une nouvelle session de chat
		socket.on('chat:start', async (data: { userId: string }) => {
			try {
				const session = await prisma.chatSession.create({
					data: {
						userId: data.userId,
						status: 'WAITING'
					}
				});

				socket.join(`session-${session.id}`);
				socket.emit('chat:started', { sessionId: session.id });
				console.log(`Session créée: ${session.id}`);
			} catch (error) {
				console.error('Erreur lors de la création de session:', error);
				socket.emit('error', { message: 'Impossible de créer la session' });
			}
		});

		// Rejoindre une session existante (pour le support)
		socket.on('chat:join', async (data: { sessionId: string }) => {
			try {
				const session = await prisma.chatSession.findUnique({
					where: { id: data.sessionId }
				});

				if (!session) {
					socket.emit('error', { message: 'Session introuvable' });
					return;
				}

				// Mettre à jour le statut à ACTIVE si c'était WAITING
				if (session.status === 'WAITING') {
					await prisma.chatSession.update({
						where: { id: data.sessionId },
						data: { status: 'ACTIVE' }
					});
				}

				socket.join(`session-${data.sessionId}`);
				console.log(`Client ${socket.id} a rejoint la session ${data.sessionId}`);
			} catch (error) {
				console.error('Erreur lors du join:', error);
				socket.emit('error', { message: 'Impossible de rejoindre la session' });
			}
		});

		// Envoyer un message
		socket.on(
			'message:send',
			async (data: { sessionId: string; content: string; isFromSupport: boolean }) => {
				try {
					const message = await prisma.chatMessage.create({
						data: {
							chatSessionId: data.sessionId,
							content: data.content,
							isFromSupport: data.isFromSupport
						}
					});

					// Émettre le message à tous les clients de la session
					io.to(`session-${data.sessionId}`).emit('message:receive', {
						message: {
							id: message.id,
							content: message.content,
							sentAt: message.sentAt,
							isFromSupport: message.isFromSupport
						}
					});

					console.log(`Message envoyé dans session ${data.sessionId}`);
				} catch (error) {
					console.error('Erreur lors de l\'envoi du message:', error);
					socket.emit('error', { message: 'Impossible d\'envoyer le message' });
				}
			}
		);

		// Indicateur de frappe - début
		socket.on('typing:start', (data: { sessionId: string; isFromSupport: boolean }) => {
			socket.to(`session-${data.sessionId}`).emit('typing:indicator', {
				isTyping: true,
				isFromSupport: data.isFromSupport
			});
		});

		// Indicateur de frappe - fin
		socket.on('typing:stop', (data: { sessionId: string; isFromSupport: boolean }) => {
			socket.to(`session-${data.sessionId}`).emit('typing:indicator', {
				isTyping: false,
				isFromSupport: data.isFromSupport
			});
		});

		// Terminer une session de chat
		socket.on('chat:end', async (data: { sessionId: string }) => {
			try {
				// Récupérer tous les messages de la session pour créer le transcript
				const messages = await prisma.chatMessage.findMany({
					where: { chatSessionId: data.sessionId },
					orderBy: { sentAt: 'asc' }
				});

				// Générer le transcript
				const transcript = messages
					.map(
						(msg) =>
							`[${msg.sentAt.toISOString()}] ${msg.isFromSupport ? 'Support' : 'Client'}: ${msg.content}`
					)
					.join('\n');

				// Mettre à jour la session
				await prisma.chatSession.update({
					where: { id: data.sessionId },
					data: {
						status: 'ENDED',
						endedAt: new Date(),
						transcript
					}
				});

				// Notifier tous les clients de la session
				io.to(`session-${data.sessionId}`).emit('chat:ended', {
					sessionId: data.sessionId
				});

				console.log(`Session terminée: ${data.sessionId}`);
			} catch (error) {
				console.error('Erreur lors de la fin de session:', error);
				socket.emit('error', { message: 'Impossible de terminer la session' });
			}
		});

		socket.on('disconnect', () => {
			console.log('Client déconnecté:', socket.id);
		});
	});

	return io;
}
