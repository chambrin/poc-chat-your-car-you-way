import { PrismaClient } from '@prisma/client';

// Détection de l'environnement (compatible avec et sans SvelteKit)
const isDev = process.env.NODE_ENV !== 'production';

// Utilisation d'une instance globale en développement pour éviter trop de connexions
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: isDev ? ['query', 'error', 'warn'] : ['error']
	});

if (isDev) globalForPrisma.prisma = prisma;
