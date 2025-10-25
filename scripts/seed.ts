import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Démarrage du seeding...');

	// Créer un utilisateur de test
	const user = await prisma.user.upsert({
		where: { email: 'test@yourcaryourway.com' },
		update: {},
		create: {
			email: 'test@yourcaryourway.com',
			passwordHash: 'test123', // En production, utiliser bcrypt
			firstName: 'Jean',
			lastName: 'Dupont',
			birthDate: new Date('1990-01-01'),
			phoneNumber: '+33612345678',
			drivingLicenseNumber: 'ABC123456',
			licenseObtainedDate: new Date('2008-01-01'),
			street: '123 Rue de Test',
			city: 'Paris',
			postalCode: '75001',
			country: 'France',
			isEmailVerified: true
		}
	});

	console.log('✅ Utilisateur de test créé:', {
		id: user.id,
		email: user.email,
		name: `${user.firstName} ${user.lastName}`
	});

	console.log('\n📝 Pour utiliser cet utilisateur dans le PoC, utilisez cet ID:');
	console.log(`User ID: ${user.id}`);
}

main()
	.catch((e) => {
		console.error('❌ Erreur lors du seeding:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
