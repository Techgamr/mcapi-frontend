import { browser } from '$app/environment';

export interface LoginState {
	baseUrl: string;
	apiKey: string;
	isLoggedIn: boolean;
	isLoaded: boolean;
}

const defaultState: LoginState = {
	baseUrl: 'sdfsdf',
	apiKey: '',
	isLoggedIn: false,
	isLoaded: false
};
export const loginState = $state(defaultState);

export const loadLoginState = async () => {
	const itemFromLocalStorage = browser ? localStorage.getItem('login') : null;
	if (itemFromLocalStorage) {
		const authState: LoginState = JSON.parse(itemFromLocalStorage);
		authState.isLoaded = true;
		if (authState.isLoggedIn && !(await validateLoginState(authState))) {
			authState.isLoggedIn = false;
		}
		saveLoginState(authState);
		return authState;
	} else {
		const authState = defaultState;
		authState.isLoaded = true;
		return authState;
	}
};

export const validateLoginState = async (authState: LoginState) => {
	const response = await fetch(authState.baseUrl, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${authState.apiKey}`
		}
	});
	return response.status === 200;
};

export const saveLoginState = (authState: LoginState) => {
	const toWrite = { ...authState };
	if (!browser || !toWrite.isLoaded) return;
	// @ts-expect-error not needed in the json
	delete toWrite.isLoaded;
	localStorage.setItem('login', JSON.stringify(toWrite));
};
