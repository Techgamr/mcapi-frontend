<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { loginState, saveLoginState, loadLoginState } from '$lib/auth.svelte';
	import Login from '$lib/components/Login.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { onMount } from 'svelte';
	import LoadingPage from '$lib/components/LoadingPage.svelte';

	let { children } = $props();

	onMount(() => {
		loadLoginState().then((v) => {
			loginState.baseUrl = v.baseUrl;
			loginState.apiKey = v.apiKey;
			loginState.isLoggedIn = v.isLoggedIn;
			loginState.isLoaded = true;
		});
	});

	$effect.pre(() => {
		saveLoginState(loginState);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>mcapi-frontend</title>
</svelte:head>

{#if !loginState.isLoaded}
	<LoadingPage />
{:else if !loginState.isLoggedIn}
	<Login />
{:else}
	<Navbar />
	{@render children()}
{/if}
