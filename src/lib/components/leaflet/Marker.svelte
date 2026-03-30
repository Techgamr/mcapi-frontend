<script lang="ts">
	import L, { Marker, type TooltipOptions } from 'leaflet';
	import { getContext, setContext } from 'svelte';

	interface Props {
		class?: string;
		marker?: Marker | undefined;
		width?: number;
		height?: number;
		tooltip?: string | HTMLElement | false | undefined;
		tooltipOptions?: TooltipOptions;
		latLng: import('leaflet').LatLngExpression;
		children?: import('svelte').Snippet;
	}

	let {
		class: classNames = undefined,
		marker = $bindable(undefined),
		width = 30,
		height = 30,
		latLng,
		tooltip,
		tooltipOptions,
		children
	}: Props = $props();

	const layerGroup = getContext('layerGroup')();
	setContext('layer', () => marker);

	function createMarker(markerElement: string | HTMLElement | false | undefined) {
		let icon = L.divIcon({
			html: markerElement,
			className: 'map-marker',
			iconSize: L.point(width, height)
		});
		let buildMarker = L.marker(latLng, { icon });
		if (tooltip) {
			buildMarker.bindTooltip(tooltip, tooltipOptions);
		}
		marker = buildMarker.addTo(layerGroup);

		return {
			destroy() {
				if (marker) {
					marker.remove();
					marker = undefined;
				}
			}
		};
	}
</script>

<div class="hidden">
	<div use:createMarker class={classNames}>
		{#if marker}
			{@render children?.()}
		{/if}
	</div>
</div>
