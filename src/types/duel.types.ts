export interface duelType {
    id: number;
    player1: string;
    player2: string;
    seatId: number;
    status: "completed" | "pending" | "declined" | "accepted";
    winner: string;
    coinFlipResult: string;
    initiator: {
        telegramId: string;
        dueling: boolean
    };
    opponent: {
        telegramId: string;
        dueling: boolean
    };
    createdAt: string;
}