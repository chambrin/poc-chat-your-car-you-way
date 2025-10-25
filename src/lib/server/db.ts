import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Utilisation d'une instance globale en développement pour éviter trop de connexions
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: dev ? ['query', 'error', 'warn'] : ['error']
	});

if (dev) globalForPrisma.prisma = prisma;
