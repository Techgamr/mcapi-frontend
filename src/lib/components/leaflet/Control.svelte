<script module>
	import L from 'leaflet';

	class Control extends L.Control {
		constructor(el, position) {
			super({ position });
			this.el = el;
		}
		onAdd() {
			return this.el;
		}
		onRemove() {}
	}
</script>

<script>
	import { getContext } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} [class]
	 * @property {'topleft' | 'topright' | 'bottomleft' | 'bottomright'} position
	 * @property {any} [control] - The control instance created by this component
	 * @property {import('svelte').Snippet<[any]>} [children]
	 */

	/** @type {Props} */
	let {
		class: classNames = undefined,
		position,
		control = $bindable(undefined),
		children
	} = $props();
	const map = getContext('map')();

	function createControl(container) {
		control = new Control(container, position).addTo(map);
		return {
			destroy() {
				control.remove();
				control = undefined;
			}
		};
	}
</script>

<div style="display:hidden">
	<div use:createControl class={classNames}>
		{#if control}
			{@render children?.({ control })}
		{/if}
	</div>
</div>
