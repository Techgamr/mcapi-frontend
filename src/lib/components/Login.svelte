<script lang="ts">
	import { globalState, validateLoginState } from '$lib/state.svelte';

	let error = $state('');
	let isLoading = $state(false);

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		isLoading = true;

		if (!globalState.login.baseUrl.trim() || !globalState.login.apiKey.trim()) {
			error = 'Please enter both base URL and API key';
			isLoading = false;
			return;
		}

		try {
			const isValid = await validateLoginState(globalState.login);
			isLoading = false;
			if (!isValid) {
				error = 'Invalid credentials. Please check your base URL and API key.';
				return;
			} else {
				globalState.login.isLoggedIn = true;
			}
		} catch (e) {
			error = 'Login failed. Please try again.';
			console.error(e);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800 dark:shadow-lg">
		<h1 class="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">mcapi login</h1>

		<form onsubmit={handleLogin} class="space-y-4">
			<div>
				<label
					for="baseUrl"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Base URL
				</label>
				<input
					id="baseUrl"
					type="url"
					bind:value={globalState.login.baseUrl}
					placeholder="https://api.example.com"
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
					disabled={isLoading}
				/>
			</div>

			<div>
				<label for="apiKey" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					API Key
				</label>
				<input
					id="apiKey"
					type="password"
					bind:value={globalState.login.apiKey}
					placeholder="Your API key"
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
					disabled={isLoading}
				/>
			</div>

			{#if error}
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			<span class="mb-1 block text-sm font-medium text-gray-700 italic dark:text-gray-300">
				These details will be saved locally in your browser.
			</span>
			<button
				type="submit"
				disabled={isLoading}
				class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-gray-600"
			>
				{isLoading ? 'Logging in...' : 'Login'}
			</button>
		</form>
	</div>
</div>
