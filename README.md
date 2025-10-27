# PoC Chat - Your Car Your Way

Système de chat en temps réel entre clients et support.

## Stack Technique

- SvelteKit + TypeScript
- Socket.io (temps réel)
- PostgreSQL + Prisma
- Bun
- TailwindCSS

## Installation

1. **Installer les dépendances**
```bash
bun install
```

2. **Configurer la base de données**

Créer un fichier `.env` à la racine :
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

3. **Initialiser Prisma**
```bash
bunx prisma generate
bunx prisma migrate dev
```

4. **Créer un utilisateur de test**
```bash
bun run scripts/seed.ts
```

Copier l'ID affiché et le coller dans `src/routes/+page.svelte` ligne 7.

## Lancement

**Ouvrir DEUX terminaux :**

### Terminal 1 - Serveur Socket.io
```bash
bun run socket
```

### Terminal 2 - Application SvelteKit
```bash
bun run dev
```

## Utilisation

- **Interface Client** : http://localhost:5173
  - Démarrer un chat
  - Envoyer des messages
  - Voir l'indicateur "en train d'écrire..."
  - Terminer le chat

- **Interface Support** : http://localhost:5173/support
  - Voir les sessions actives
  - Sélectionner une session
  - Répondre aux messages
  - Terminer les conversations

## Fonctionnalités

✅ Chat en temps réel bidirectionnel
✅ Messages persistés en base de données
✅ Indicateur de frappe ("en train d'écrire...")
✅ Gestion de plusieurs sessions simultanées
✅ Historique des messages dans chaque session
✅ Statuts des sessions (WAITING, ACTIVE, ENDED)

## Test Rapide

1. Ouvrir http://localhost:5173 (client)
2. Ouvrir http://localhost:5173/support (support)
3. Démarrer un chat côté client
4. Sélectionner la session côté support
5. Échanger des messages
