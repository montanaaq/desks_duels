export interface SeatType {
    id: number;
    rowNumber: number;
    deskNumber: number;
    variant: number;
    occupiedBy: number | null;
    dueled: boolean;
  }