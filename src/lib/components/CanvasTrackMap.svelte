<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Network, BlockStatus, SignalStatus, TrainStatus, Point } from '$lib/ctmTypes';
	import { SSEClient } from '$lib/sseClient.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let canvas = $state<HTMLCanvasElement>();
	let ctx: CanvasRenderingContext2D;
	let animationFrameId: number;

	// Data stores
	const networkClient = new SSEClient<Network>({ apiPath: 'createmod/ctm/network.rt' });
	const blockClient = new SSEClient<BlockStatus>({ apiPath: 'createmod/ctm/blocks.rt' });
	const signalClient = new SSEClient<SignalStatus>({ apiPath: 'createmod/ctm/signals.rt' });
	const trainClient = new SSEClient<TrainStatus>({ apiPath: 'createmod/ctm/trains.rt' });
	let network = $derived(networkClient.data);
	let blocks = $derived(blockClient.data);
	let signals = $derived(signalClient.data);
	let trains = $derived(trainClient.data);

	// Camera/viewport state
	let cameraX = 0;
	let cameraY = 0;
	let zoom = $state(1);
	let isDragging = false;
	let dragStartX = 0;
	let dragStartY = 0;

	// Performance settings
	const RENDER_DISTANCE = 5000; // Only render elements within this distance
	const POINT_RADIUS = 4;
	const TRAIN_WIDTH = 30;
	const TRAIN_HEIGHT = 20;

	// Cache for rendered paths to avoid recalculation
	let pathCache = new SvelteMap<string, Path2D>();

	interface CachedPath {
		path: Path2D;
		timestamp: number;
	}

	// Convert world coordinates to canvas coordinates
	function worldToCanvas(point: Point): { x: number; y: number } {
		return {
			x: (point.x - cameraX) * zoom,
			y: (point.y - cameraY) * zoom
		};
	}

	// Convert canvas coordinates to world coordinates
	function canvasToWorld(canvasX: number, canvasY: number): { x: number; y: number } {
		return {
			x: canvasX / zoom + cameraX,
			y: canvasY / zoom + cameraY
		};
	}

	// Check if a point is within render distance
	function isInRenderDistance(point: Point): boolean {
		const dist = Math.sqrt(Math.pow(point.x - cameraX, 2) + Math.pow(point.y - cameraY, 2));
		return dist < RENDER_DISTANCE;
	}

	// Render network tracks
	function renderTracks() {
		ctx.strokeStyle = '#888888';
		ctx.lineWidth = 2 / zoom;
		ctx.globalAlpha = 0.7;

		for (const edge of network.tracks) {
			if (edge.path.length < 2) continue;

			// Skip if entire edge is outside render distance
			const allPointsOutside = edge.path.every((p) => !isInRenderDistance(p));
			if (allPointsOutside) continue;

			const cacheKey = `track-${edge.dimension}-${edge.path.map((p) => `${p.x},${p.y}`).join('|')}`;

			if (!pathCache.has(cacheKey)) {
				const path = new Path2D();
				const firstPoint = worldToCanvas(edge.path[0]);
				path.moveTo(firstPoint.x, firstPoint.y);

				for (let i = 1; i < edge.path.length; i++) {
					const point = worldToCanvas(edge.path[i]);
					path.lineTo(point.x, point.y);
				}

				pathCache.set(cacheKey, path);
			}

			ctx.stroke(pathCache.get(cacheKey)!);
		}

		ctx.globalAlpha = 1;
	}

	// Render blocks
	function renderBlocks() {
		for (const block of blocks.blocks) {
			for (const segment of block.segments) {
				if (segment.path.length < 2) continue;
				if (segment.path.every((p) => !isInRenderDistance(p))) continue;

				// Color based on block state
				if (block.occupied) {
					ctx.strokeStyle = '#ff4444';
				} else if (block.reserved) {
					ctx.strokeStyle = '#ffaa00';
				} else {
					ctx.strokeStyle = '#44ff44';
				}

				ctx.lineWidth = 4 / zoom;
				ctx.globalAlpha = 0.5;

				const path = new Path2D();
				const firstPoint = worldToCanvas(segment.path[0]);
				path.moveTo(firstPoint.x, firstPoint.y);

				for (let i = 1; i < segment.path.length; i++) {
					const point = worldToCanvas(segment.path[i]);
					path.lineTo(point.x, point.y);
				}

				ctx.stroke(path);
			}
		}

		ctx.globalAlpha = 1;
	}

	// Render signals
	function renderSignals() {
		for (const signal of signals!.signals) {
			if (!isInRenderDistance(signal.location)) continue;

			const canvasPos = worldToCanvas(signal.location);

			// Draw signal circle
			ctx.beginPath();
			ctx.arc(canvasPos.x, canvasPos.y, 8 / zoom, 0, Math.PI * 2);

			// Color based on signal state
			switch (signal.forward?.state ?? 'INVALID') {
				case 'RED':
					ctx.fillStyle = '#ff0000';
					break;
				case 'YELLOW':
					ctx.fillStyle = '#ffff00';
					break;
				case 'GREEN':
					ctx.fillStyle = '#00ff00';
					break;
				default:
					ctx.fillStyle = '#888888';
			}

			ctx.fill();
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 1 / zoom;
			ctx.stroke();
		}
	}

	// Render trains
	function renderTrains() {
		for (const train of trains.trains) {
			if (train.cars.length === 0) continue;

			// Use the first car's leading position as the train position
			const firstCar = train.cars[0];
			const trainPos = firstCar.leading.location;

			if (!isInRenderDistance(trainPos)) continue;

			const canvasPos = worldToCanvas(trainPos);

			// Draw train car
			ctx.fillStyle = train.stopped ? '#ff6666' : '#0066ff';
			ctx.globalAlpha = 0.8;

			const width = TRAIN_WIDTH / zoom;
			const height = TRAIN_HEIGHT / zoom;

			// Rotate based on train direction
			ctx.save();
			ctx.translate(canvasPos.x, canvasPos.y);
			ctx.rotate(
				(train.backwards ? Math.PI : 0) +
					(firstCar.leading.dimension === 'nether' ? Math.PI / 4 : 0)
			);
			ctx.fillRect(-width / 2, -height / 2, width, height);

			// Draw train name
			ctx.restore();
			ctx.fillStyle = '#ffffff';
			ctx.font = `${12 / zoom}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.globalAlpha = 1;
			ctx.fillText(train.name, canvasPos.x, canvasPos.y - 20 / zoom);
		}

		ctx.globalAlpha = 1;
	}

	// Main render loop
	function render() {
		// Clear canvas
		ctx.fillStyle = '#1a1a1a';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Grid (optional, for reference)
		renderGrid();

		// Render in order: tracks → blocks → signals → trains
		renderTracks();
		renderBlocks();
		renderSignals();
		renderTrains();

		animationFrameId = requestAnimationFrame(render);
	}

	// Render background grid
	function renderGrid() {
		ctx.strokeStyle = '#333333';
		ctx.lineWidth = 1;
		ctx.globalAlpha = 0.3;

		const gridSize = 100;
		const startX = Math.floor(cameraX / gridSize) * gridSize;
		const startY = Math.floor(cameraY / gridSize) * gridSize;

		for (let x = startX; x < cameraX + canvas.width / zoom; x += gridSize) {
			const canvasX = (x - cameraX) * zoom;
			ctx.beginPath();
			ctx.moveTo(canvasX, 0);
			ctx.lineTo(canvasX, canvas.height);
			ctx.stroke();
		}

		for (let y = startY; y < cameraY + canvas.height / zoom; y += gridSize) {
			const canvasY = (y - cameraY) * zoom;
			ctx.beginPath();
			ctx.moveTo(0, canvasY);
			ctx.lineTo(canvas.width, canvasY);
			ctx.stroke();
		}

		ctx.globalAlpha = 1;
	}

	// Handle mouse wheel zoom
	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

		// Zoom towards mouse position
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		const worldPos = canvasToWorld(mouseX, mouseY);
		cameraX = worldPos.x - mouseX / newZoom;
		cameraY = worldPos.y - mouseY / newZoom;

		zoom = newZoom;
	}

	// Handle mouse drag
	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;

		const deltaX = event.clientX - dragStartX;
		const deltaY = event.clientY - dragStartY;

		cameraX -= deltaX / zoom;
		cameraY -= deltaY / zoom;

		dragStartX = event.clientX;
		dragStartY = event.clientY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Resize canvas to fit container
	function resizeCanvas() {
		if (!canvas.parentElement) return;

		const rect = canvas.parentElement.getBoundingClientRect();
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = rect.height * window.devicePixelRatio;

		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	}

	onDestroy(async () => {
		await Promise.all([
			networkClient.disconnect(),
			blockClient.disconnect(),
			signalClient.disconnect(),
			trainClient.disconnect()
		]);
		cancelAnimationFrame(animationFrameId);
		window.removeEventListener('resize', resizeCanvas);
		window.removeEventListener('wheel', handleWheel);
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	});

	onMount(async () => {
		await Promise.all([
			networkClient.connect(),
			blockClient.connect(),
			signalClient.connect(),
			trainClient.connect()
		]);
	});
	$effect(() => {
		if (!ctx && canvas) {
			ctx = canvas.getContext('2d')!;
			resizeCanvas();
			window.addEventListener('resize', resizeCanvas);
			window.addEventListener('wheel', handleWheel, { passive: false });
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);

			render();
		}
	});
</script>

{#if network && blocks && signals && trains}
	<div class="relative h-full w-full overflow-hidden bg-neutral-900">
		<canvas
			bind:this={canvas}
			onmousedown={handleMouseDown}
			class="absolute inset-0 cursor-grab active:cursor-grabbing"
		></canvas>

		<!-- Controls -->
		<div
			class="absolute top-4 left-4 z-10 flex flex-col gap-3 rounded-lg border border-neutral-700 bg-neutral-800/90 p-3 backdrop-blur-sm"
		>
			<div class="flex flex-col gap-2">
				<button
					class="flex items-center gap-2 rounded bg-neutral-700 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-600 active:bg-neutral-500"
					onclick={() => {
						zoom = 1;
						cameraX = 0;
						cameraY = 0;
					}}
				>
					<span class="text-lg">⊕</span>
					Reset View
				</button>
				<button
					class="flex items-center gap-2 rounded bg-neutral-700 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-600 active:bg-neutral-500"
					onclick={() => (zoom = Math.min(5, zoom * 1.2))}
				>
					<span class="text-lg">+</span>
					Zoom In
				</button>
				<button
					class="flex items-center gap-2 rounded bg-neutral-700 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-600 active:bg-neutral-500"
					onclick={() => (zoom = Math.max(0.1, zoom * 0.8))}
				>
					<span class="text-lg">−</span>
					Zoom Out
				</button>
			</div>

			<div class="flex flex-col gap-2">
				<div class="rounded bg-neutral-700/50 px-3 py-2 text-sm text-neutral-300">
					Zoom: <span class="font-mono font-semibold text-white">{(zoom * 100).toFixed(0)}%</span>
				</div>
			</div>
		</div>

		<!-- Legend -->
		<div
			class="absolute top-4 right-4 z-10 max-w-xs rounded-lg border border-neutral-700 bg-neutral-800/90 p-4 backdrop-blur-sm"
		>
			<div class="mb-3 border-b border-neutral-700 pb-2 text-lg font-bold text-white">Legend</div>

			<!-- Tracks & Blocks -->
			<div class="mb-4">
				<div class="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Tracks & Blocks
				</div>
				<div class="mb-1.5 flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded border border-neutral-600"
						style="background-color: #888888;"
					></div>
					<span>Track</span>
				</div>
				<div class="mb-1.5 flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded border border-neutral-600"
						style="background-color: #44ff44;"
					></div>
					<span>Free Block</span>
				</div>
				<div class="mb-1.5 flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded border border-neutral-600"
						style="background-color: #ffaa00;"
					></div>
					<span>Reserved Block</span>
				</div>
				<div class="flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded border border-neutral-600"
						style="background-color: #ff4444;"
					></div>
					<span>Occupied Block</span>
				</div>
			</div>

			<!-- Signals -->
			<div class="mb-4 border-t border-neutral-700 pt-3">
				<div class="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Signals
				</div>
				<div class="mb-1.5 flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded-full border border-neutral-600"
						style="background-color: #00ff00;"
					></div>
					<span>Green Signal</span>
				</div>
				<div class="mb-1.5 flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded-full border border-neutral-600"
						style="background-color: #ffff00;"
					></div>
					<span>Yellow Signal</span>
				</div>
				<div class="flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded-full border border-neutral-600"
						style="background-color: #ff0000;"
					></div>
					<span>Red Signal</span>
				</div>
			</div>

			<!-- Trains -->
			<div class="mb-4 border-t border-neutral-700 pt-3">
				<div class="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Trains
				</div>
				<div class="mb-1.5 flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded border border-neutral-600"
						style="background-color: #0066ff;"
					></div>
					<span>Moving Train</span>
				</div>
				<div class="flex items-center gap-2 text-sm text-neutral-300">
					<div
						class="h-4 w-4 rounded border border-neutral-600"
						style="background-color: #ff6666;"
					></div>
					<span>Stopped Train</span>
				</div>
			</div>

			<!-- Controls -->
			<div class="border-t border-neutral-700 pt-3">
				<div class="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Controls
				</div>
				<div class="mb-1.5 flex items-center gap-2 text-xs text-neutral-400">
					<span
						class="rounded bg-neutral-700 px-2 py-1 font-mono text-xs font-semibold text-neutral-200"
						>Scroll</span
					>
					<span>Zoom</span>
				</div>
				<div class="flex items-center gap-2 text-xs text-neutral-400">
					<span
						class="rounded bg-neutral-700 px-2 py-1 font-mono text-xs font-semibold text-neutral-200"
						>Drag</span
					>
					<span>Pan</span>
				</div>
			</div>
		</div>

		<!-- Info Panel -->
		<div
			class="absolute bottom-4 left-4 z-10 max-w-sm rounded-lg border border-neutral-700 bg-neutral-800/90 p-4 backdrop-blur-sm"
		>
			<div class="mb-3 flex items-center justify-between border-b border-neutral-700 pb-2">
				<span class="text-lg font-bold text-white">Map Info</span>
				<span class="text-sm font-semibold text-neutral-400"
					>{trains.trains.length} Train{trains.trains.length !== 1 ? 's' : ''}</span
				>
			</div>

			<div class="mb-3">
				<div class="mb-1.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Active Blocks
				</div>
				<div class="font-mono text-sm text-neutral-300">
					{blocks.blocks.filter((b) => b.occupied || b.reserved).length} / {blocks.blocks.length}
				</div>
			</div>

			<!-- <div class="mb-3">
				<div class="mb-1.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Signal Status
				</div>
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2 text-sm text-neutral-300">
						<span
							class="h-2.5 w-2.5 shrink-0 rounded-full border border-neutral-600"
							style="background-color: #00ff00;"
						></span>
						<span>{signals.signals.filter((s) => s.forward.state === 'GREEN').length} Green</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-neutral-300">
						<span
							class="h-2.5 w-2.5 shrink-0 rounded-full border border-neutral-600"
							style="background-color: #ffff00;"
						></span>
						<span>{signals.signals.filter((s) => s.forward.state === 'YELLOW').length} Yellow</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-neutral-300">
						<span
							class="h-2.5 w-2.5 shrink-0 rounded-full border border-neutral-600"
							style="background-color: #ff0000;"
						></span>
						<span>{signals.signals.filter((s) => s.forward.state === 'RED').length} Red</span>
					</div>
				</div>
			</div> -->

			<div>
				<div class="mb-1.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Trains
				</div>
				<div class="space-y-2">
					{#each trains.trains.slice(0, 5) as train (train.id)}
						<div
							class="rounded border border-neutral-600 bg-neutral-700/50 p-2 transition-colors hover:border-neutral-500"
						>
							<div class="mb-1 text-sm font-semibold text-white">{train.name}</div>
							<div class="flex items-center gap-2 text-xs">
								{#if train.stopped}
									<span class="rounded bg-red-600/70 px-1.5 py-0.5 font-semibold text-white"
										>Stopped</span
									>
								{:else}
									<span class="rounded bg-blue-600/70 px-1.5 py-0.5 font-semibold text-white"
										>Moving</span
									>
								{/if}
								<span class="text-neutral-400">{train.owner}</span>
							</div>
						</div>
					{/each}
					{#if trains.trains.length > 5}
						<div class="p-2 text-center text-xs text-neutral-400 italic">
							+{trains.trains.length - 5} more
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
