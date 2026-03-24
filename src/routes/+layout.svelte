<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { globalState, loadInfo, saveLoginState } from '$lib/state.svelte';
	import Login from '$lib/components/Login.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import LoadingPage from '$lib/components/LoadingPage.svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	// @ts-expect-error no typings for this?
	$effect.pre(async () => {
		// @ts-expect-error intentional
		if (globalState.refreshTrigger !== 'trigger' && globalState.login.isLoggedIn) {
			await loadInfo();
		}
	});

	$effect.pre(() => {
		if (!globalState.login.isLoggedIn) {
			// @ts-expect-error should error
			globalState.info = null;
		}
		saveLoginState(globalState.login);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>mcapi-frontend</title>
</svelte:head>

{#if !globalState.login.isLoggedIn && browser}
	<Login />
{:else if globalState.info === null || !browser}
	<LoadingPage />
{:else}
	<Navbar />
	{@render children()}
{/if}
