<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { infoData, loadInfo, loginState, saveLoginState } from '$lib/state.svelte';
	import Login from '$lib/components/Login.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import LoadingPage from '$lib/components/LoadingPage.svelte';

	let { children } = $props();

	// @ts-expect-error no typings for this?
	$effect(async () => {
		if (infoData.info === null && loginState.isLoggedIn) {
			await loadInfo();
		}
	});

	$effect.pre(() => {
		saveLoginState(loginState);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>mcapi-frontend</title>
</svelte:head>

{#if !loginState.isLoggedIn}
	<Login />
{:else if infoData.info === null}
	<LoadingPage />
{:else}
	<Navbar />
	{@render children()}
{/if}
