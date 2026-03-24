<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { infoData, loadInfo, loginState, saveLoginState } from '$lib/state.svelte';
	import Login from '$lib/components/Login.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import LoadingPage from '$lib/components/LoadingPage.svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	// @ts-expect-error no typings for this?
	$effect(async () => {
		if (loginState.isLoggedIn && infoData.info === null) {
			await loadInfo();
		}
	});

	$effect.pre(() => {
		if (!loginState.isLoggedIn) {
			infoData.info = null;
		}
		saveLoginState(loginState);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>mcapi-frontend</title>
</svelte:head>

{#if !loginState.isLoggedIn && browser}
	<Login />
{:else if infoData.info === null || !browser}
	<LoadingPage />
{:else}
	<Navbar />
	{@render children()}
{/if}
