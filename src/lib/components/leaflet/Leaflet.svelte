<script lang="ts">
	import { run } from 'svelte/legacy';

	import { createEventDispatcher, setContext } from 'svelte';
	import L, { Map, type MapOptions } from 'leaflet';
	// Uncomment this for use outside the REPL
	import 'leaflet/dist/leaflet.css';
	import type { Action } from 'svelte/action';

	interface Props {
		class?: string;
		bounds?: any;
		view?: any;
		zoom?: any;
		map?: Map | undefined;
		mapOptions?: MapOptions;
		onCreate?: (map: Map) => void;
		onDestroy?: (map: Map) => void;
		children?: import('svelte').Snippet<[unknown]>;
	}

	let {
		class: classNames = undefined,
		bounds = undefined,
		view = undefined,
		zoom = undefined,
		map = $bindable<Map | undefined>(undefined),
		mapOptions = undefined,
		onCreate = undefined,
		onDestroy = undefined,
		children
	}: Props = $props();

	export const invalidateSize = () => map?.invalidateSize();

	const dispatch = createEventDispatcher();

	export const getMap = () => map;
	setContext('layerGroup', getMap);
	setContext('layer', getMap);
	setContext('map', getMap);

	const createLeaflet: Action<
		HTMLDivElement,
		undefined,
		{
			onswiperight: (e: CustomEvent) => void;
			onswipeleft: (e: CustomEvent) => void;
			// ...
		}
	> = (node) => {
		map = L.map(node, mapOptions).on('zoom', (e) => dispatch('zoom', e));
		if (bounds) {
			map.fitBounds(bounds);
		} else {
			map.setView(view, zoom);
		}

		if (onCreate) {
			onCreate(map);
		}

		return {
			destroy() {
				if (onDestroy && map) onDestroy(map);
				map?.remove();
				map = undefined;
			}
		};
	};

	function resizeMap() {
		if (map) {
			map.invalidateSize();
		}
	}
</script>

<svelte:window onresize={resizeMap} />

<div class={`h-full w-full ${classNames}`} use:createLeaflet>
	{#if map}
		{@render children?.({ map })}
	{/if}
</div>

<style>
	:global(.leaflet-control-container) {
		position: static;
	}
</style>
