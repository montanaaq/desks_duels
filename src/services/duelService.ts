// services/duelService.ts
import type { duelType } from "../types/duel.types";
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

        const duelResponse = await response.json();

        // Set up a timeout to check duel status after 60 seconds
        setTimeout(async () => {
            try {
                const timedOutDuels = await checkTimedOutDuels(player1);
                
                if (timedOutDuels && timedOutDuels.length > 0) {
                    const duel = timedOutDuels[0];
                    
                    // Get all duels for the current seat to clear previous occupation
                    const currentSeatDuels = await getDuelsBySeat(seatId);
                    const previousDuel = currentSeatDuels.find(d => 
                        (d.player1 === player1 || d.player2 === player1) && 
                        d.id !== duel.id && 
                        (d.status === 'accepted' || d.status === 'completed')
                    );

                    // If there's a previous duel, decline it and clean up
                    if (previousDuel) {
                        await declineDuel(previousDuel.id, true);
                        
                        // Dispatch a cleanup event for the UI
                        const cleanupEvent = new CustomEvent('duelCleanup', {
                            detail: {
                                duelId: previousDuel.id,
                                seatId: previousDuel.seatId
                            }
                        });
                        window.dispatchEvent(cleanupEvent);
                    }
                    
                    // Dispatch a custom event to handle duel timeout
                    const event = new CustomEvent('duelTimeout', { 
                        detail: { 
                            duel, 
                            isWinner: duel.player1 === player1,
                            clearedDuelId: previousDuel?.id
                        } 
                    });
                    window.dispatchEvent(event);
                }
            } catch (error) {
                console.error('Error checking timed-out duels:', error);
            }
        }, 60000); // 60 seconds

        return duelResponse;
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

export const declineDuel = async (duelId: number, isTimeout: boolean = false) => {
  try {
    console.log(`Attempting to decline duel: duelId=${duelId}, isTimeout=${isTimeout}`);
    
    const response = await fetch(`${url}/duels/${duelId}/decline`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isTimeout }),
    });

    console.log(`Decline response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text(); // Используем text() вместо json()
      console.error(`Decline error response: ${errorData}`);
      throw new Error(errorData || 'Внутренняя ошибка сервера.');
    }
    
    const result = await response.json();
    console.log('Decline duel response:', result);
    return result;
  } catch (error: any) {
    console.error('Full error declining duel:', error);
    throw error;
  }
};

export const checkTimedOutDuels = async (telegramId: string): Promise<duelType[]> => {
    try {
        const response = await fetch(`${url}/duels/timed-out?telegramId=${telegramId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`${errorData.error}`);
        }

        const timedOutDuels = await response.json();
        return timedOutDuels;
    } catch (error: any) {
        console.error('Error checking timed-out duels:', error);
        return []; // Return empty array instead of throwing error
    }
};

export const getDuelsBySeat = async (seatId: number): Promise<duelType[]> => {
  try {
    const response = await fetch(`${url}/duels/seat/${seatId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при получении дуэлей');
    }
    const data = await response.json();
    // Return the duels array, or empty array if no duels
    return Array.isArray(data.duels) ? data.duels : [];
  } catch (error: any) {
    console.error('Error getting duels by seat:', error);
    return []; // Return empty array on error to prevent UI crashes
  }
};
