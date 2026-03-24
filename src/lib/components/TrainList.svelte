<script lang="ts">
	import { loginState } from '$lib/state.svelte';
	import { TrainFrontIcon, TramFrontIcon } from '@lucide/svelte';

	interface TrainResponse {
		name: string;
		icon: string;
		graph: string;
		currentlyBackwards: boolean;
		derailed: boolean;
		owner: string;
	}
	let trains = $derived<{ [id: string]: TrainResponse }>(
		await (
			await fetch(`${loginState.baseUrl}/createmod/train`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${loginState.apiKey}`
				}
			})
		).json()
	);
</script>

<div class="flex w-full min-w-full flex-col gap-2 overflow-y-auto">
	{#each Object.entries(trains).sort( (a, b) => a[1].name.localeCompare(b[1].name) ) as [id, train] (id)}
		<div class="flex flex-row rounded bg-gray-300 p-2 dark:bg-gray-600">
			<!-- TODO: Investigate if we can use the actual icons from Create somehow -->
			{#if train.icon === 'create:modern'}
				<TrainFrontIcon size="64" />
			{:else}
				<TramFrontIcon size="64" />
			{/if}
			<div class="flex flex-col">
				<span class="text-xl font-bold select-text">{train.name}</span>
			</div>
		</div>
	{/each}
</div>
