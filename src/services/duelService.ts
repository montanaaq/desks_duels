// services/duelService.ts

import { duelType } from "../types/duel.types";
import { url } from "./userService";

type DuelResponse = {
    message: string;
    duel: duelType;
};

export const requestDuel = async (player1: string, player2: string, seatId: number): Promise<DuelResponse> => {
    try {
        const response = await fetch(`${url}/duels/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player1, player2, seatId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`${errorData.error}`);
        }
        return response.json();
    } catch (error: any) {
        throw new Error(error.message || 'Unknown error');
    }
}

export const sendAcceptDuel = async (duelId: number): Promise<DuelResponse> => {
    try {
        const response = await fetch(`${url}/duels/${duelId}/accept`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`${errorData.error}`);
        }
        return response.json();
    } catch (error: any) {
        throw new Error(error.message || 'Unknown error');
    }
}

export const completeDuel = async (duelId: number, winnerId: string): Promise<DuelResponse> => {
    try {
        const response = await fetch(`${url}/duels/${duelId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ winnerId: winnerId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`${errorData.error}`);
        }
        return response.json();
    } catch (error: any) {
        throw new Error(error.message || 'Unknown error');
    }
}
