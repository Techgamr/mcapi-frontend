<script lang="ts">
	import { resolve } from '$app/paths';
	import { navigating } from '$app/state';
	import { globalState } from '$lib/state.svelte';
	import { MenuIcon } from '@lucide/svelte';

	let isOpen = $state(false);

	let shownUrl = $derived.by(() => {
		let url = new URL(globalState.login.baseUrl);
		return url.hostname + (url.pathname !== '/' ? url.pathname : '');
	});

	let isRefreshDisabled = $state(false);

	function handleRefreshClick() {
		isRefreshDisabled = true;
		setTimeout(() => {
			globalState.refreshTrigger++;
			isRefreshDisabled = false;
		}, 5);
	}
</script>

{#snippet navLinks()}
	<a
		href={resolve('/')}
		class="block rounded px-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
	>
		Home
	</a>
	<a
		href={resolve('/chat')}
		class="block rounded px-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
	>
		Chat
	</a>
	<a
		href={resolve('/createmod')}
		class="block rounded px-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
	>
		Create Mod
	</a>
{/snippet}

<nav class="bg-gray-50 duration-200 select-none dark:bg-gray-900">
	<div class="relative flex h-16 items-center justify-center">
		<!-- LEFT SECTION -->
		<div class="absolute left-4 flex flex-col items-center space-x-2">
			<a class="text-2xl font-bold" href={resolve('/')}>mcapi</a>
			<code class="hidden text-sm select-text lg:block" title={globalState.login.baseUrl}>
				{shownUrl}
			</code>
		</div>

		<!-- CENTER SECTION -->
		<div class="hidden items-center space-x-2 lg:flex">
			{@render navLinks()}
		</div>

		<!-- RIGHT SECTION -->
		<div class="absolute right-4 hidden h-12 items-center space-x-4 lg:flex">
			{#if navigating.to}
				<div class="flex flex-col items-center gap-4">
					<!-- Spinner Icon -->
					<div class="relative h-12 w-12">
						<div
							class="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"
						></div>
						<div
							class="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400"
						></div>
					</div>
				</div>
			{/if}
			<button
				onclick={handleRefreshClick}
				disabled={isRefreshDisabled}
				class="h-full w-full rounded px-4 font-semibold transition-colors {isRefreshDisabled
					? 'cursor-not-allowed bg-gray-400 text-gray-600 opacity-60 dark:bg-gray-600 dark:text-gray-400'
					: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'}"
			>
				Refresh
			</button>
			<button
				onclick={() => (globalState.login.isLoggedIn = false)}
				class="h-full w-full rounded bg-red-600 px-4 font-semibold transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
			>
				Logout
			</button>
		</div>

		<!-- MOBILE MENU BUTTON -->
		<button
			onclick={() => (isOpen = !isOpen)}
			class="absolute right-4 rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
			title="open menu"
		>
			<MenuIcon class="h-6 w-6 transition-transform duration-300 {isOpen ? 'rotate-90' : ''}" />
		</button>
	</div>

	<!-- MOBILE MENU -->
	<div
		class="overflow-hidden transition-all duration-300 ease-in-out lg:hidden {isOpen
			? 'max-h-96'
			: 'max-h-0'}"
	>
		<div
			class="space-y-2 bg-gray-50 px-2 py-2 transition-colors duration-200 lg:hidden dark:bg-gray-800"
		>
			{@render navLinks()}
			<div class="mx-2 flex">
				<button
					onclick={() => (globalState.login.isLoggedIn = false)}
					class="flex-1 rounded bg-red-600 px-4 py-2 font-semibold transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
				>
					Logout
				</button>
			</div>
		</div>
	</div>
</nav>
