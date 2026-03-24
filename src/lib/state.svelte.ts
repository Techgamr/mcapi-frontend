import { browser } from '$app/environment';

export interface LoginState {
	baseUrl: string;
	apiKey: string;
	isLoggedIn: boolean;
}

export interface ModInfo {
	modid: string;
	displayName: string;
	description: string;
	version: string;
	url: string | null;
	authors: string | null;
}

export interface PlayerInfo {
	name: string;
	uuid: string;
}

export interface InfoData {
	player: PlayerInfo;
	mods: ModInfo[];
	onlinePlayers: {
		maxPlayers: number;
		playerCount: number;
		players: PlayerInfo[];
	};
}

export interface GlobalState {
	login: LoginState;
	info: InfoData;
	refreshTrigger: number;
}

export const loadLoginState = () => {
	const itemFromLocalStorage = browser ? localStorage.getItem('login') : null;
	if (itemFromLocalStorage) {
		const authState: LoginState = JSON.parse(itemFromLocalStorage);
		return authState;
	} else {
		return {
			baseUrl: '',
			apiKey: '',
			isLoggedIn: false
		};
	}
};

export const globalState = $state<GlobalState>({
	login: loadLoginState(),
	info: null as unknown as InfoData,
	refreshTrigger: 0
});

export const validateLoginState = async (authState: LoginState) => {
	const response = await fetch(authState.baseUrl, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${authState.apiKey}`
		}
	});
	return response.ok;
};

export const saveLoginState = (authState: LoginState) => {
	if (!browser) return;
	localStorage.setItem('login', JSON.stringify(authState));
};

// info
export const loadInfo = async () => {
	try {
		globalState.info = await (
			await fetch(`${globalState.login.baseUrl}/info`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${globalState.login.apiKey}`
				}
			})
		).json();
	} catch {
		globalState.login.isLoggedIn = false;
	}
};
