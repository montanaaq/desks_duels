// services/duelService.ts

import { duelType } from "../types/duel.types";
import { url } from "./userService";

type DuelResponse = {
    message: string;
    duel: duelType | null;
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

export const completeDuel = async (duelId: number): Promise<DuelResponse> => {
    try {
        console.log(`Attempting to complete duel: duelId=${duelId}`);
        
        const response = await fetch(`${url}/duels/${duelId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            if (response.status === 404) {
                console.warn(`Duel ${duelId} not found`);
                throw new Error('Duel not found');
            }
            
            if (response.status === 409) {
                console.warn(`Duel ${duelId} cannot be completed due to current status`);
                return { message: 'Duel cannot be completed', duel: null };
            }

            console.error(`Unexpected error completing duel: ${errorData.error}`);
            throw new Error(errorData.error || 'Unknown error completing duel');
        }
        
        const result = await response.json();
        console.log(`Duel ${duelId} completed successfully`, result);
        return result;
        
    } catch (error: any) {
        console.error('Error completing duel:', error);
        throw new Error(error.message || 'Unknown error');
    }
}

export const declineDuel = async (duelId: number): Promise<DuelResponse> => {
    try {
        const response = await fetch(`${url}/duels/${duelId}/decline`, {
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
