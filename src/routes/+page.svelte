<script>
	import ModList from '$lib/components/ModList.svelte';
	import PlayerList from '$lib/components/PlayerList.svelte';
</script>

<div
	class="flex h-full flex-col items-center gap-y-4 overflow-y-scroll p-2 select-none lg:overflow-y-hidden"
>
	<span class="flex items-center gap-x-3">
		<h1 class="text-4xl">game</h1>
	</span>
	<div
		class="grid h-full w-full auto-rows-auto grid-cols-1 gap-4 lg:grid-cols-3 lg:overflow-y-hidden"
	>
		<div
			class="flex max-h-full flex-col items-center gap-2 bg-gray-200 p-2 lg:overflow-y-hidden dark:bg-gray-700"
		>
			<h3 class="text-2xl font-bold">Mods</h3>
			<div class="h-full w-full lg:overflow-y-auto">
				<ModList />
			</div>
		</div>
		<div
			class="flex max-h-full flex-col items-center gap-2 bg-gray-200 p-2 lg:overflow-y-hidden dark:bg-gray-700"
		>
			<h3 class="text-2xl font-bold">Players</h3>
			<div class="h-full w-full lg:overflow-y-auto">
				<PlayerList />
			</div>
		</div>
		<div
			class="flex max-h-full flex-col items-center gap-2 bg-gray-200 p-2 lg:overflow-y-hidden dark:bg-gray-700"
		>
			<h3 class="text-2xl font-bold">Chat</h3>
			<div class="lg:overflow-y-auto">todo</div>
		</div>
	</div>
</div>
