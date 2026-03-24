<script lang="ts">
	import { loginState } from '$lib/state.svelte';
	import { FlagTriangleRightIcon } from '@lucide/svelte';

	interface StationResponse {
		name: string;
		graph: string;
	}
	let trains = $derived<{ [key: string]: StationResponse }>(
		await (
			await fetch(`${loginState.baseUrl}/createmod/stations`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${loginState.apiKey}`
				}
			})
		).json()
	);
</script>

<div class="flex w-full min-w-full flex-col gap-2 overflow-y-auto">
	{#each Object.entries(trains)
		.sort((a, b) => a[1].name.localeCompare(b[1].name))
		.reduce( (acc, [k, v]) => {
				if (!acc.names.has(v.name)) {
					acc.map.set(k, v);
					acc.names.add(v.name);
				}
				return acc;
			}, { map: new Map(), names: new Set() } ).map as [id, station] (id)}
		<div class="flex flex-row rounded bg-gray-300 p-2 dark:bg-gray-600">
			<FlagTriangleRightIcon class="size-16 min-h-16 min-w-16" />
			<span class="flex flex-col justify-center">
				<span class="text-xl font-bold select-text">{station.name}</span>
				<span class="">on graph <code class="select-text">{station.graph}</code></span>
			</span>
		</div>
	{/each}
</div>
