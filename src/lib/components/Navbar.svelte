<script lang="ts">
	import { resolve } from '$app/paths';
	import { loginState } from '$lib/auth.svelte';

	let isOpen = $state(false);

	let shownUrl = $derived.by(() => {
		let url = new URL(loginState.baseUrl);
		return url.hostname + (url.pathname !== '/' ? url.pathname : '');
	});
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

<nav class="bg-gray-50 transition-colors duration-200 select-none dark:bg-gray-900">
	<div class="relative flex h-16 items-center justify-center">
		<!-- LEFT SECTION -->
		<div class="absolute left-4 flex flex-col items-center space-x-2">
			<a class="text-2xl font-bold" href={resolve('/')}>mcapi</a>
			<code class="hidden text-sm select-text lg:block" title={loginState.baseUrl}>
				{shownUrl}
			</code>
		</div>

		<!-- CENTER SECTION -->
		<div class="hidden items-center space-x-2 lg:flex">
			{@render navLinks()}
		</div>

		<!-- RIGHT SECTION -->
		<div class="absolute right-4 hidden items-center space-x-4 lg:flex">
			<button
				onclick={() => (loginState.isLoggedIn = false)}
				class="rounded bg-red-600 px-4 py-2 font-semibold transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
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
			<svg
				class="h-6 w-6 transition-transform duration-300 {isOpen ? 'rotate-90' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
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
					onclick={() => (loginState.isLoggedIn = false)}
					class="flex-1 rounded bg-red-600 px-4 py-2 font-semibold transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
				>
					Logout
				</button>
			</div>
		</div>
	</div>
</nav>
