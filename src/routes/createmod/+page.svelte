<script lang="ts">
	import StationList from '$lib/components/StationList.svelte';
	import TrainList from '$lib/components/TrainList.svelte';
</script>

<div
	class="flex h-full flex-col items-center gap-y-4 overflow-y-scroll p-2 select-none lg:overflow-y-hidden"
>
	<span class="flex items-center gap-x-3">
		<h1 class="text-4xl font-bold">Create mod</h1>
	</span>
	<div
		class="grid h-full w-full auto-rows-auto grid-cols-1 gap-4 lg:grid-cols-2 lg:overflow-y-hidden"
	>
		<div
			class="flex max-h-full flex-col items-center gap-2 bg-gray-200 p-2 lg:overflow-y-hidden dark:bg-gray-700"
		>
			<h3 class="text-2xl font-bold">Trains</h3>
			<div class="h-full w-full lg:overflow-y-auto">
				<TrainList />
			</div>
		</div>
		<div
			class="flex max-h-full flex-col items-center gap-2 bg-gray-200 p-2 lg:overflow-y-hidden dark:bg-gray-700"
		>
			<h3 class="text-2xl font-bold">Stations</h3>
			<div class="h-full w-full lg:overflow-y-auto">
				<StationList />
			</div>
		</div>
	</div>
</div>
