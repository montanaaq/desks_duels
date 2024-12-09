import type { duelType } from "./duel.types";

export type SeatType = {
	id: number;
	rowNumber: number;
	deskNumber: number;
	variant: number;
	occupiedBy: string | null;
	status: "available" | "occupied" | "dueled";
	timeoutDuel?: duelType | null;
}