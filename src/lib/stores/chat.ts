import { writable } from 'svelte/store';

export interface ChatMessage {
	id: string;
	content: string;
	sentAt: Date;
	isFromSupport: boolean;
}

export interface ChatState {
	sessionId: string | null;
	messages: ChatMessage[];
	isTyping: boolean;
	isConnected: boolean;
	isChatActive: boolean;
}

const initialState: ChatState = {
	sessionId: null,
	messages: [],
	isTyping: false,
	isConnected: false,
	isChatActive: false
};

function createChatStore() {
	const { subscribe, set, update } = writable<ChatState>(initialState);

	return {
		subscribe,
		setSessionId: (sessionId: string) =>
			update((state) => ({ ...state, sessionId, isChatActive: true })),
		addMessage: (message: ChatMessage) =>
			update((state) => ({
				...state,
				messages: [...state.messages, message]
			})),
		setTyping: (isTyping: boolean) => update((state) => ({ ...state, isTyping })),
		setConnected: (isConnected: boolean) => update((state) => ({ ...state, isConnected })),
		endChat: () =>
			update((state) => ({
				...state,
				isChatActive: false
			})),
		reset: () => set(initialState)
	};
}

export const chatStore = createChatStore();
