import { browser } from '$app/environment';

export interface LoginState {
	baseUrl: string;
	apiKey: string;
	isLoggedIn: boolean;
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

export const loginState = $state(loadLoginState());

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

export const infoData = $state<{ info: InfoData }>({ info: null as unknown as InfoData });

export const loadInfo = async () => {
	try {
		infoData.info = await (
			await fetch(`${loginState.baseUrl}/info`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${loginState.apiKey}`
				}
			})
		).json();
	} catch {
		loginState.isLoggedIn = false;
	}
};
