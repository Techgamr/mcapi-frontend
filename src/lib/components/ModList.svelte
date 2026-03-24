<script lang="ts">
	import { globalState } from '$lib/state.svelte';

	import { BoxIcon, ExternalLinkIcon } from '@lucide/svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let images = new SvelteMap<string, string>();

	$effect(() => {
		for (const mod of globalState.info.mods) {
			try {
				fetch(`${globalState.login.baseUrl}/info/mod-logo/${mod.modid}`, {
					headers: {
						Authorization: `Bearer ${globalState.login.apiKey}`
					}
				})
					.then((x) => {
						if (!x.ok) throw new Error('Could not fetch');
						return x.blob();
					})
					.then((blob) => images.set(mod.modid, URL.createObjectURL(blob)));
			} catch {
				// do nothing
			}
		}
	});
</script>

<div class="flex flex-col gap-1 select-none">
	{#each [...globalState.info.mods].sort( (a, b) => a.displayName.localeCompare(b.displayName) ) as mod (mod.modid)}
		<div class="flex flex-row items-center gap-3 rounded bg-gray-200 p-2 dark:bg-gray-600">
			{#if images.has(mod.modid)}
				<img src={images.get(mod.modid)} alt="mod logo" class="size-16 min-h-16 min-w-16" />
			{:else}
				<BoxIcon class="size-16 min-h-16 min-w-16" />
			{/if}
			<span class="flex flex-col">
				<span class="flex flex-row items-center gap-2">
					<span class="font-bold">
						<span class="select-text">{mod.displayName}</span> (<code class="select-text">
							{mod.modid}
						</code>)
					</span>
					{#if mod.url}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a class="" href={mod.url} target="_blank" rel="noreferrer">
							<ExternalLinkIcon size="20" />
						</a>
					{:else}{/if}
				</span>
				<span class="select-text">{mod.description}</span>
			</span>
		</div>
	{/each}
</div>
