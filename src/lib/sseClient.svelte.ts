import { SvelteURL } from 'svelte/reactivity';
import { globalState } from './state.svelte';

/**
 * RFC 6902 JSON Patch Operation
 */
export type JsonPatchOperationType = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

export interface JsonPatchOperation {
	op: JsonPatchOperationType;
	path: string;
	value?: unknown;
}

export interface SSEMessage<T> {
	data: T;
	deltas?: JsonPatchOperation[];
}

/**
 * Simple JSON Pointer path parser and applier
 * Handles basic RFC 6901 paths like "/foo/bar/0"
 */
function parsePath(path: string): (string | number)[] {
	return path
		.split('/')
		.slice(1) // Remove leading empty string
		.map((segment) => {
			// Try to parse as array index
			const num = parseInt(segment, 10);
			return isNaN(num) ? segment : num;
		});
}

/**
 * Get a value from an object using a JSON Pointer path
 */
function getAtPath(obj: unknown, path: (string | number)[]): unknown {
	let current = obj;
	for (const segment of path) {
		if (current === null || current === undefined) return undefined;
		current = (current as Record<string | number, unknown>)[segment];
	}
	return current;
}

/**
 * Set a value in an object using a JSON Pointer path
 */
function setAtPath(obj: unknown, path: (string | number)[], value: unknown): void {
	if (path.length === 0) return;

	let current = obj as Record<string | number, unknown>;
	for (let i = 0; i < path.length - 1; i++) {
		const segment = path[i];
		if (!(segment in current) || typeof current[segment] !== 'object') {
			current[segment] = typeof path[i + 1] === 'number' ? [] : {};
		}
		current = current[segment] as Record<string | number, unknown>;
	}

	const lastSegment = path[path.length - 1];
	current[lastSegment] = value;
}

/**
 * Delete a value from an object using a JSON Pointer path
 */
function deleteAtPath(obj: unknown, path: (string | number)[]): void {
	if (path.length === 0) return;

	let current = obj as Record<string | number, unknown>;
	for (let i = 0; i < path.length - 1; i++) {
		const segment = path[i];
		if (!(segment in current)) return;
		current = current[segment] as Record<string | number, unknown>;
	}

	const lastSegment = path[path.length - 1];
	if (lastSegment in current) {
		if (Array.isArray(current)) {
			(current as unknown[]).splice(lastSegment as number, 1);
		} else {
			delete current[lastSegment];
		}
	}
}

/**
 * Apply a JSON Patch operation to an object
 */
function applyPatchOperation<T>(obj: T, operation: JsonPatchOperation): void {
	const path = parsePath(operation.path);

	switch (operation.op) {
		case 'replace':
		case 'add':
			setAtPath(obj, path, operation.value);
			break;
		case 'remove':
			deleteAtPath(obj, path);
			break;
		case 'move': {
			const value = getAtPath(obj, path);
			deleteAtPath(obj, path);
			const toPath = parsePath(operation.value as string);
			setAtPath(obj, toPath, value);
			break;
		}
		case 'copy': {
			const value = getAtPath(obj, path);
			const toPath = parsePath(operation.value as string);
			setAtPath(obj, toPath, structuredClone(value));
			break;
		}
		case 'test': {
			const value = getAtPath(obj, path);
			if (value !== operation.value) {
				throw new Error(`Test operation failed at path ${operation.path}`);
			}
			break;
		}
	}
}

export interface SSEClientOptions {
	apiPath: string;
	useDelta?: boolean;
}

export interface SSEClientState<T> {
	data: T | null;
	isConnected: boolean;
	isLoading: boolean;
	error: string | null;
}

interface ParsedSSEEvent {
	event: string | null;
	data: string;
}

export class SSEClient<T> {
	private state = $state<SSEClientState<T>>({
		data: null,
		isConnected: false,
		isLoading: false,
		error: null
	});

	private abortController: AbortController | null = null;
	private options: SSEClientOptions;

	constructor(options: SSEClientOptions) {
		this.options = options;
	}

	get data(): T | null {
		return this.state.data;
	}

	get isConnected(): boolean {
		return this.state.isConnected;
	}

	get isLoading(): boolean {
		return this.state.isLoading;
	}

	get error(): string | null {
		return this.state.error;
	}

	get _state(): SSEClientState<T> {
		return this.state;
	}

	/**
	 * Parse SSE stream according to spec:
	 * - Messages separated by double newline (\n\n)
	 * - Multiple data: lines are concatenated with \n
	 * - event: and id: are optional fields
	 */
	private static parseSSEStream(buffer: string): { events: ParsedSSEEvent[]; remaining: string } {
		const events: Array<ParsedSSEEvent> = [];
		let remainder = buffer;

		// Split by double newline to find complete messages
		const messages = remainder.split('\n\n');

		// Process all complete messages (all but the last element)
		for (let i = 0; i < messages.length - 1; i++) {
			const message = messages[i];
			const lines = message.split('\n');

			let type: string | null = null;
			let data: string | null = null;

			for (const line of lines) {
				if (line.startsWith('event: ')) {
					type = line.slice(7); // Remove 'event: ' prefix
				} else if (line.startsWith('data: ')) {
					data = line.slice(6); // Remove 'data: ' prefix
				}
			}

			if (type && data) {
				try {
					events.push({
						event: type,
						data: data
					});
				} catch (error) {
					// Handle JSON parse errors if needed
					console.error(`Failed to parse data for event type ${type}:`, error);
				}
			}
		}

		// The remainder is the last incomplete message (if any)
		remainder = messages[messages.length - 1];

		return { events, remaining: remainder };
	}

	async connect(): Promise<void> {
		if (this.abortController) {
			console.warn('Already connected to SSE endpoint');
			return;
		}

		this.state.isLoading = true;
		this.state.error = null;
		this.abortController = new AbortController();

		const url = new SvelteURL(`${globalState.login.baseUrl}/${this.options.apiPath}`);
		if (this.options.useDelta ?? true) {
			url.searchParams.set('delta', '1');
		}

		try {
			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${globalState.login.apiKey}`,
					Accept: 'text/event-stream'
				},
				signal: this.abortController.signal
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			this.state.isConnected = true;
			this.state.isLoading = false;

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('Response body is not readable');
			}

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const { events, remaining } = SSEClient.parseSSEStream(buffer);
				buffer = remaining;

				for (const event of events) {
					if (!event.data) continue;

					try {
						const jsonData = JSON.parse(event.data);

						if (event.event === 'message') {
							this.state.data = jsonData;
						} else if (event.event === 'delta') {
							if (this.state.data) {
								const deltas: JsonPatchOperation[] = jsonData;
								for (const delta of deltas) {
									applyPatchOperation(this.state.data, delta);
								}
							}
						} else {
							throw new Error(`unknown event type ${event.event}`);
						}

						this.state.error = null;
					} catch (err) {
						this.state.error = `Failed to parse ${event.event || 'message'} event: ${err instanceof Error ? err.message : String(err)}`;
						console.error(this.state.error, event.data);
					}
				}
			}
		} catch (err) {
			if (err instanceof Error && err.name !== 'AbortError') {
				this.state.error = err.message;
				console.error('SSE Connection error:', err);
			}
			this.state.isConnected = false;
		} finally {
			this.state.isLoading = false;
			this.abortController = null;
		}
	}

	disconnect(): void {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
		this.state.isConnected = false;
	}

	reset(): void {
		this.state.data = null;
		this.state.error = null;
		this.state.isConnected = false;
		this.state.isLoading = false;
	}
}
