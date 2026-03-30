<script lang="ts">
	import Leaflet from '$lib/components/leaflet/Leaflet.svelte';
	import Control from '$lib/components/leaflet/Control.svelte';
	import {
		CRS,
		Map,
		Transformation,
		Util,
		type LatLngTuple,
		type LeafletMouseEvent,
		type MapOptions
	} from 'leaflet';
	import { ArrowUpToLineIcon, ExpandIcon, LocateIcon, MousePointer2Icon } from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';
	import { SSEClient } from '$lib/sseClient.svelte';
	import type { BlockStatus, Network, SignalStatus, TrainStatus } from '$lib/ctmTypes';
	import Marker from './leaflet/Marker.svelte';
	import DOMPurify from 'dompurify';

	const networkClient = new SSEClient<Network>({ apiPath: 'createmod/ctm/network.rt' });
	const blockClient = new SSEClient<BlockStatus>({ apiPath: 'createmod/ctm/blocks.rt' });
	const signalClient = new SSEClient<SignalStatus>({ apiPath: 'createmod/ctm/signals.rt' });
	const trainClient = new SSEClient<TrainStatus>({ apiPath: 'createmod/ctm/trains.rt' });

	onMount(() => {
		networkClient.connect();
		blockClient.connect();
		signalClient.connect();
		trainClient.connect();
	});

	onDestroy(async () => {
		networkClient.disconnect();
		blockClient.disconnect();
		signalClient.disconnect();
		trainClient.disconnect();
	});

	let map = $state<Map | undefined>();

	let selectedDimension = $state('minecraft:overworld');

	const initialView: LatLngTuple = [0, 0];

	let centerX = $state<number | null>(null);
	let centerZ = $state<number | null>(null);
	let cursorX = $state<number | null>(null);
	let cursorZ = $state<number | null>(null);
	let cursorCoords = $state(false);

	function resetMapView() {
		map?.setView(initialView, 5);
	}

	function initMap(map: Map) {
		map.on('zoom', updateCenterCoords);
		map.on('move', updateCenterCoords);
		map.on('mouseover', showCursorCoords);
		map.on('mousemove', updateCursorCoords);
		map.on('mouseout', clearCursorCoords);
		updateCenterCoords();
	}

	function destroyMap(map: Map) {
		map.off('zoom', updateCenterCoords);
		map.off('move', updateCenterCoords);
		map.off('mouseover', showCursorCoords);
		map.off('mousemove', updateCursorCoords);
		map.off('mouseout', clearCursorCoords);
	}

	function showCursorCoords() {
		cursorCoords = true;
	}

	function clearCursorCoords() {
		cursorCoords = false;
	}

	function updateCenterCoords() {
		const coords = map?.getCenter();
		centerX = coords ? Math.round(coords.lng) : null;
		centerZ = coords ? Math.round(coords.lat) : null;
	}

	function updateCursorCoords(event: LeafletMouseEvent) {
		const coords = event.latlng;
		cursorX = Math.round(coords.lng);
		cursorZ = Math.round(coords.lat);
	}

	const options: MapOptions = {
		crs: Util.extend(CRS.Simple, {
			transformation: new Transformation(1, 0, 1, 0)
		}),
		attributionControl: false,
		zoomControl: true,
		zoom: 0,
		minZoom: -5,
		maxZoom: 5
	};
</script>

<Leaflet
	bind:map
	class="text-black"
	mapOptions={options}
	onDestroy={destroyMap}
	onCreate={initMap}
	view={initialView}
	zoom={4}
>
	<Control position="topright">
		<button type="button" onclick={resetMapView} title="Reset View">
			<ExpandIcon />
		</button>
	</Control>
	<Control position="bottomright">
		<!-- Coords -->
		<div class="rounded-xl bg-white px-2 py-1 text-black select-none">
			{#if cursorCoords}
				<span class="flex flex-row items-center gap-2">
					<MousePointer2Icon />
					<code>
						{cursorX ?? '--'}
						{cursorZ ?? '--'}
					</code>
				</span>
			{/if}
			<span class="flex flex-row items-center gap-2">
				<LocateIcon />
				<code>
					{centerX ?? '--'}
					{centerZ ?? '--'}
				</code>
			</span>
		</div>
	</Control>
	<!-- Station markers -->
	{#each networkClient.data?.stations.filter((s) => s.dimension === selectedDimension) as station (station.id)}
		{@const coordString = `${Math.round(station.location.x)}, ${Math.round(station.location.y)}, ${Math.round(station.location.z)}`}
		<Marker
			latLng={[station.location.z, station.location.x]}
			tooltip={`<div class="flex flex-col items-center justify-center"><span class="font-bold">${DOMPurify.sanitize(station.name)}</span><span>${DOMPurify.sanitize(coordString)}</div>`}
		>
			<ArrowUpToLineIcon style="transform: rotate({station.angle}deg);" />
		</Marker>
	{/each}
</Leaflet>
