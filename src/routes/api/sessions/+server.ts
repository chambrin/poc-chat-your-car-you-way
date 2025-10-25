import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const sessions = await prisma.chatSession.findMany({
			where: {
				OR: [{ status: 'WAITING' }, { status: 'ACTIVE' }]
			},
			include: {
				user: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				},
				messages: {
					orderBy: {
						sentAt: 'asc'
					}
				}
			},
			orderBy: {
				startedAt: 'desc'
			}
		});

		return json(sessions);
	} catch (error) {
		console.error('Erreur lors de la récupération des sessions:', error);
		return json({ error: 'Erreur serveur' }, { status: 500 });
	}
};
