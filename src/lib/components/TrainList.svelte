<script lang="ts">
	import { globalState } from '$lib/state.svelte';
	import { TrainFrontIcon, TramFrontIcon } from '@lucide/svelte';

	interface TrainResponse {
		name: string;
		icon: string;
		graph: string;
		currentlyBackwards: boolean;
		derailed: boolean;
		owner: string;
		runtime: {
			destination: {
				distanceStartedAt: number;
				distanceToDestination: number;
				name: string;
				id: string;
			} | null;
			paused: boolean;
			schedule: unknown | null;
			state: 'PRE_TRANSIT' | 'IN_TRANSIT' | 'POST_TRANSIT';
			ticksInTransit: number;
		};
	}

	let trains = $derived<{ [id: string]: TrainResponse }>(
		(globalState.refreshTrigger,
		await (
			await fetch(`${globalState.login.baseUrl}/createmod/train`, {
				method: globalState.refreshTrigger ? 'GET' : 'GET',
				headers: {
					Authorization: `Bearer ${globalState.login.apiKey}`
				}
			})
		).json())
	);
</script>

<div class="flex w-full min-w-full flex-col gap-2 overflow-y-auto">
	{#each Object.entries(trains).sort( (a, b) => a[1].name.localeCompare(b[1].name) ) as [id, train] (id)}
		<div class="flex flex-row items-center rounded bg-gray-300 p-2 dark:bg-gray-600">
			<!-- TODO: Investigate if we can use the actual icons from Create somehow -->
			{#if train.icon === 'create:modern'}
				<TrainFrontIcon class="size-16 min-h-16 min-w-16" />
			{:else}
				<TramFrontIcon class="size-16 min-h-16 min-w-16" />
			{/if}
			<div class="flex flex-col">
				<span class="flex flex-row items-center gap-1.5">
					<span class="text-xl font-bold select-text">{train.name}</span>
					{#if train.derailed}
						<span class="rounded-full bg-red-400/50 px-2 text-sm dark:bg-red-600/50">Derailed</span>
					{/if}
					{#if train.currentlyBackwards}
						<span class="rounded-full bg-cyan-400/50 px-2 text-sm dark:bg-cyan-600/50"
							>Backwards</span
						>
					{/if}
					{#if train.runtime.schedule === null}
						<span class="rounded-full bg-orange-400/50 px-2 text-sm dark:bg-orange-600/50"
							>No Schedule</span
						>
					{:else if train.runtime.paused}
						<span class="rounded-full bg-yellow-400/50 px-2 text-sm dark:bg-yellow-600/50"
							>Paused</span
						>
					{/if}
					<span class="rounded-full bg-green-400/50 px-2 text-sm dark:bg-green-600/50">
						{#if train.runtime.state === 'IN_TRANSIT'}
							In Transit ({train.runtime.ticksInTransit / 20}s)
						{:else if train.runtime.state === 'PRE_TRANSIT'}
							Pre Transit
						{:else if train.runtime.state === 'POST_TRANSIT'}
							Post Transit
						{:else}
							Unknown State
						{/if}
					</span>
				</span>
				<span class="flex flex-col flex-wrap text-sm">
					<span>
						<span class="text-gray-700 dark:text-gray-300">UUID</span>
						<code class="select-text">{id}</code>
					</span>
					<span>
						<span class="text-gray-700 dark:text-gray-300">Graph</span>
						<code class="select-text">{train.graph}</code>
					</span>
					<span>
						<span class="text-gray-700 dark:text-gray-300">Navigating</span>
						{#if train.runtime.destination}
							<code class="select-text" title={train.runtime.destination.id}>
								{train.runtime.destination.name}
							</code>
							<span>
								({Math.round(
									train.runtime.destination.distanceStartedAt -
										train.runtime.destination.distanceToDestination
								)}m/{Math.round(train.runtime.destination.distanceStartedAt)}m)
							</span>
						{:else}
							<span>Not navigating</span>
						{/if}
					</span>
				</span>
			</div>
		</div>
	{/each}
</div>
