export interface duelType {
    id: number; // Now using 'id' as primary key
    player1: string;
    player2: string;
    seatId: number;
    status: string;
    winner?: string;
    createdAt: string;
}