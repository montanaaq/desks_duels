export interface duelType {
    id: number;
    player1: string;
    player2: string;
    seatId: number;
    status: "completed" | "pending" | "declined" | "accepted" | "timeout";
    winner: string;
    coinFlipResult: 'Орёл' | 'Решка';
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