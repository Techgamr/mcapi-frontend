<script lang="ts">
	import { globalState } from '$lib/state.svelte';
</script>

<div class="flex h-full w-full flex-col items-center gap-1 select-none">
	<span>
		Players: {globalState.info.onlinePlayers.playerCount} / {globalState.info.onlinePlayers
			.maxPlayers}
	</span>

	{#each [...globalState.info.onlinePlayers.players].sort( (a, b) => a.name.localeCompare(b.name) ) as player (player.name)}
		<div class="flex w-full flex-row items-center gap-3 rounded bg-gray-200 p-2 dark:bg-gray-600">
			<code class="select-text">{player.name}</code>
		</div>
	{/each}
</div>
