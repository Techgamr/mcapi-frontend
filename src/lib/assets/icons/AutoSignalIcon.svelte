<script>
	export let color = '';
	export let leftSide = false;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="10"
	height="16"
	viewBox="0 0 40 64"
	class="signal-icon {color}"
>
	<path
		class="frame"
		d="M20 0c11.046 0 20 8.954 20 20 0 10.37-7.893 18.897-17.999 19.901L22 60h18v4H0v-4h18V39.901C7.893 38.898 0 30.371 0 20 0 8.954 8.954 0 20 0Zm0 4C11.163 4 4 11.163 4 20s7.163 16 16 16 16-7.163 16-16S28.837 4 20 4Z"
	/>
	<path
		class="light"
		d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16 16-7.163 16-16S28.837 4 20 4Z"
	/>
</svg>

<style>
	:global(.signal-icon) {
		@apply h-4 w-2.5;
	}
</style>
