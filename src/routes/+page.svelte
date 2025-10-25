<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { chatStore } from '$lib/stores/chat';
	import { startChat, sendMessage, startTyping, stopTyping, endChat, initSocket } from '$lib/socket';

	// ID utilisateur de test (à récupérer depuis votre seed)
	const TEST_USER_ID = 'ef65e0c9-e82e-4773-a45d-5ccce4544ca0';

	let messageInput = '';
	let messagesContainer: HTMLDivElement;
	let typingTimeout: ReturnType<typeof setTimeout>;

	$: chat = $chatStore;

	onMount(() => {
		initSocket();
	});

	function handleStartChat() {
		startChat(TEST_USER_ID);
	}

	function handleSendMessage() {
		if (!messageInput.trim() || !chat.sessionId) return;

		sendMessage(chat.sessionId, messageInput, false);
		messageInput = '';

		// Arrêter l'indicateur de typing après envoi
		stopTyping(chat.sessionId, false);
	}

	function handleTyping() {
		if (!chat.sessionId) return;

		startTyping(chat.sessionId, false);

		// Arrêter l'indicateur après 2 secondes d'inactivité
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			stopTyping(chat.sessionId!, false);
		}, 2000);
	}

	function handleEndChat() {
		if (!chat.sessionId) return;
		if (confirm('Voulez-vous vraiment terminer le chat ?')) {
			endChat(chat.sessionId);
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
	});
</script>

<div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
	<div class="max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
		<!-- Header -->
		<div class="bg-blue-600 text-white p-4">
			<h1 class="text-2xl font-bold">Your Car Your Way - Support Client</h1>
			<p class="text-sm opacity-90">
				{#if !chat.isChatActive}
					Démarrez une conversation avec notre équipe
				{:else}
					Session: {chat.sessionId?.substring(0, 8)}...
				{/if}
			</p>
		</div>

		<!-- État de connexion -->
		<div class="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
			<div
				class="w-2 h-2 rounded-full {chat.isConnected ? 'bg-green-500' : 'bg-red-500'}"
			></div>
			<span class="text-sm text-gray-600">
				{chat.isConnected ? 'Connecté' : 'Déconnecté'}
			</span>
		</div>

		{#if !chat.isChatActive}
			<!-- Écran de démarrage -->
			<div class="p-8 text-center">
				<div class="mb-6">
					<svg
						class="w-20 h-20 mx-auto text-blue-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						></path>
					</svg>
				</div>
				<h2 class="text-xl font-semibold mb-2">Besoin d'aide ?</h2>
				<p class="text-gray-600 mb-6">
					Notre équipe est là pour répondre à toutes vos questions
				</p>
				<button
					onclick={handleStartChat}
					disabled={!chat.isConnected}
					class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
				>
					Démarrer un chat
				</button>
			</div>
		{:else}
			<!-- Zone de chat active -->
			<div class="flex flex-col h-[600px]">
				<!-- Messages -->
				<div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
					{#if chat.messages.length === 0}
						<div class="text-center text-gray-500 py-8">
							<p>Aucun message pour le moment</p>
							<p class="text-sm">Envoyez un message pour commencer la conversation</p>
						</div>
					{/if}

					{#each chat.messages as message (message.id)}
						<div class="flex {message.isFromSupport ? 'justify-start' : 'justify-end'}">
							<div
								class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {message.isFromSupport
									? 'bg-gray-200 text-gray-800'
									: 'bg-blue-600 text-white'}"
							>
								<p class="text-sm font-medium mb-1">
									{message.isFromSupport ? 'Conseiller' : 'Vous'}
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
								<p class="text-sm font-medium mb-1">Conseiller</p>
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
							placeholder="Tapez votre message..."
							class="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							type="submit"
							disabled={!messageInput.trim()}
							class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
						>
							Envoyer
						</button>
					</form>
					<button
						onclick={handleEndChat}
						class="mt-2 text-sm text-red-600 hover:text-red-700"
					>
						Terminer le chat
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
