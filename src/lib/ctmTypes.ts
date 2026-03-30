export interface Block {
	id: string; // UUID as string
	occupied: boolean;
	reserved: boolean;
	segments: Edge[];
}

export interface BlockStatus {
	blocks: Block[];
}

export interface CreateTrain {
	id: string; // UUID as string
	name: string;
	owner: string;
	cars: TrainCar[];
	backwards: boolean;
	stopped: boolean;
}

export interface DimensionLocation {
	dimension: string;
	location: Point;
}

export interface Edge {
	dimension: string;
	path: Point[];
}

export interface Network {
	tracks: Edge[];
	portals: Portal[];
	stations: Station[];
}

export interface Path {
	start: Point;
	firstControlPoint: Point;
	secondControlPoint: Point;
	end: Point;
}

export interface Point {
	x: number;
	y: number;
	z: number;
}

export interface Portal {
	from: DimensionLocation;
	to: DimensionLocation;
}

export interface Signal {
	id: string; // UUID as string
	dimension: string;
	location: Point;
	forward: SignalSide | null;
	reverse: SignalSide | null;
}

export interface SignalSide {
	type: SignalType;
	state: SignalState;
	angle: number;
	block: string; // UUID as string
}

/* Create types */
export enum SignalType {
	ENTRY_SIGNAL = 'entry_signal',
	CROSS_SIGNAL = 'cross_signal'
}

export enum SignalState {
	RED = 'RED',
	YELLOW = 'YELLOW',
	GREEN = 'GREEN',
	INVALID = 'INVALID'
}
/* End Create types */

export interface SignalStatus {
	signals: Signal[];
}

export interface Station {
	id: string; // UUID as string
	name: string;
	dimension: string;
	location: Point;
	angle: number;
	assembling: boolean;
}

export interface TrainCar {
	id: number;
	leading: DimensionLocation;
	trailing: DimensionLocation;
	portal: Portal;
}

export interface TrainStatus {
	trains: CreateTrain[];
}
