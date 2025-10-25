<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { chatStore } from '$lib/stores/chat';
	import { joinChat, sendMessage, startTyping, stopTyping, endChat, initSocket } from '$lib/socket';

	interface Session {
		id: string;
		status: string;
		startedAt: string;
		user: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
		};
		messages: Array<{
			id: string;
			content: string;
			sentAt: string;
			isFromSupport: boolean;
		}>;
	}

	let sessions: Session[] = [];
	let selectedSessionId: string | null = null;
	let messageInput = '';
	let messagesContainer: HTMLDivElement;
	let typingTimeout: ReturnType<typeof setTimeout>;
	let refreshInterval: ReturnType<typeof setInterval>;

	$: chat = $chatStore;
	$: selectedSession = sessions.find((s) => s.id === selectedSessionId);

	onMount(() => {
		initSocket();
		loadSessions();

		// Rafraîchir les sessions toutes les 5 secondes
		refreshInterval = setInterval(loadSessions, 5000);
	});

	async function loadSessions() {
		try {
			const response = await fetch('/api/sessions');
			if (response.ok) {
				sessions = await response.json();
			}
		} catch (error) {
			console.error('Erreur lors du chargement des sessions:', error);
		}
	}

	function handleSelectSession(sessionId: string) {
		selectedSessionId = sessionId;
		chatStore.reset();
		chatStore.setSessionId(sessionId);

		// Charger les messages existants de la session
		const session = sessions.find((s) => s.id === sessionId);
		if (session && session.messages) {
			session.messages.forEach((msg) => {
				chatStore.addMessage({
					id: msg.id,
					content: msg.content,
					sentAt: new Date(msg.sentAt),
					isFromSupport: msg.isFromSupport
				});
			});
		}

		joinChat(sessionId);
	}

	function handleSendMessage() {
		if (!messageInput.trim() || !selectedSessionId) return;

		sendMessage(selectedSessionId, messageInput, true);
		messageInput = '';

		// Arrêter l'indicateur de typing après envoi
		stopTyping(selectedSessionId, true);
	}

	function handleTyping() {
		if (!selectedSessionId) return;

		startTyping(selectedSessionId, true);

		// Arrêter l'indicateur après 2 secondes d'inactivité
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			stopTyping(selectedSessionId!, true);
		}, 2000);
	}

	function handleEndChat() {
		if (!selectedSessionId) return;
		if (confirm('Voulez-vous vraiment terminer cette session de chat ?')) {
			endChat(selectedSessionId);
			selectedSessionId = null;
			chatStore.reset();
			loadSessions();
		}
	}

	// Auto-scroll vers le bas quand de nouveaux messages arrivent
	$: if (chat.messages.length && messagesContainer) {
		setTimeout(() => {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}, 0);
	}

	onDestroy(() => {
		clearTimeout(typingTimeout);
		clearInterval(refreshInterval);
	});
</script>

<div class="min-h-screen bg-gray-100">
	<!-- Header -->
	<div class="bg-green-600 text-white p-4 shadow-lg">
		<h1 class="text-2xl font-bold">Interface Support - Your Car Your Way</h1>
		<p class="text-sm opacity-90">Gestion des conversations clients</p>
	</div>

	<div class="flex h-[calc(100vh-80px)]">
		<!-- Liste des sessions (sidebar) -->
		<div class="w-80 bg-white border-r overflow-y-auto">
			<div class="p-4 border-b bg-gray-50">
				<h2 class="font-semibold text-lg">
					Sessions actives ({sessions.length})
				</h2>
				<div class="flex items-center gap-2 mt-2">
					<div class="w-2 h-2 rounded-full {chat.isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
					<span class="text-sm text-gray-600">
						{chat.isConnected ? 'Connecté' : 'Déconnecté'}
					</span>
				</div>
			</div>

			{#if sessions.length === 0}
				<div class="p-4 text-center text-gray-500">
					<p>Aucune session active</p>
				</div>
			{:else}
				<div class="divide-y">
					{#each sessions as session (session.id)}
						<button
							onclick={() => handleSelectSession(session.id)}
							class="w-full p-4 text-left hover:bg-gray-50 transition {selectedSessionId ===
							session.id
								? 'bg-blue-50 border-l-4 border-blue-600'
								: ''}"
						>
							<div class="flex items-center gap-2 mb-1">
								<span
									class="px-2 py-1 text-xs rounded-full {session.status === 'WAITING'
										? 'bg-yellow-100 text-yellow-800'
										: 'bg-green-100 text-green-800'}"
								>
									{session.status}
								</span>
							</div>
							<p class="font-medium text-gray-900">
								{session.user.firstName}
								{session.user.lastName}
							</p>
							<p class="text-sm text-gray-600">{session.user.email}</p>
							<p class="text-xs text-gray-500 mt-1">
								{new Date(session.startedAt).toLocaleString('fr-FR')}
							</p>
							<p class="text-xs text-gray-500">
								{session.messages.length} message{session.messages.length > 1 ? 's' : ''}
							</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Zone de chat -->
		<div class="flex-1 flex flex-col bg-white">
			{#if !selectedSession}
				<div class="flex-1 flex items-center justify-center text-gray-500">
					<div class="text-center">
						<svg
							class="w-20 h-20 mx-auto mb-4 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
							></path>
						</svg>
						<p>Sélectionnez une session pour commencer</p>
					</div>
				</div>
			{:else}
				<!-- En-tête de la conversation -->
				<div class="border-b p-4 bg-gray-50">
					<div class="flex justify-between items-start">
						<div>
							<h3 class="font-semibold text-lg">
								{selectedSession.user.firstName}
								{selectedSession.user.lastName}
							</h3>
							<p class="text-sm text-gray-600">{selectedSession.user.email}</p>
							<p class="text-xs text-gray-500">
								Session: {selectedSession.id.substring(0, 8)}...
							</p>
						</div>
						<button
							onclick={handleEndChat}
							class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
						>
							Terminer
						</button>
					</div>
				</div>

				<!-- Messages -->
				<div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
					{#if chat.messages.length === 0}
						<div class="text-center text-gray-500 py-8">
							<p>Aucun message dans cette session</p>
						</div>
					{/if}

					{#each chat.messages as message (message.id)}
						<div class="flex {message.isFromSupport ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-lg px-4 py-2 rounded-lg {message.isFromSupport
									? 'bg-green-600 text-white'
									: 'bg-gray-200 text-gray-800'}"
							>
								<p class="text-sm font-medium mb-1">
									{message.isFromSupport ? 'Vous (Support)' : selectedSession.user.firstName}
								</p>
								<p class="break-words">{message.content}</p>
								<p class="text-xs mt-1 opacity-75">
									{new Date(message.sentAt).toLocaleTimeString('fr-FR', {
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
							</div>
						</div>
					{/each}

					{#if chat.isTyping}
						<div class="flex justify-start">
							<div class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
								<p class="text-sm font-medium mb-1">{selectedSession.user.firstName}</p>
								<div class="flex gap-1">
									<span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
									<span
										class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
										style="animation-delay: 0.1s"
									></span>
									<span
										class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
										style="animation-delay: 0.2s"
									></span>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Zone de saisie -->
				<div class="border-t p-4">
					<form onsubmit={(e) => { e.preventDefault(); handleSendMessage(); }} class="flex gap-2">
						<input
							type="text"
							bind:value={messageInput}
							oninput={handleTyping}
							placeholder="Répondre au client..."
							class="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
						<button
							type="submit"
							disabled={!messageInput.trim()}
							class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
						>
							Envoyer
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</div>
