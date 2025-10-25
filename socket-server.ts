import { createServer } from 'http';
import { initSocketServer } from './src/lib/server/socket';

const PORT = 3001;

const httpServer = createServer();
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
	console.log(`🚀 Serveur Socket.io démarré sur le port ${PORT}`);
});
