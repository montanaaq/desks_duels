export interface SeatType {
	id: number;
	rowNumber: number;
	deskNumber: number;
	variant: number;
	occupiedBy: string | null;
	status: "available" | "occupied" | "dueled";
}