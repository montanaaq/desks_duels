import { SeatType } from "../types/seat.types";
import { url } from "./userService";

export const getSeatById = async (seatId: number): Promise<SeatType> => {
    try {
        const response = await fetch(`${url}/seats/${seatId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка при получении места: ${errorData.error || response.statusText}`);
        }

        return response.json();
    } catch (error: any) {
        throw new Error(error.message || 'Unknown error');
    }
};

export const getDesks = async (): Promise<SeatType[]> => {
	try {
		const response = await fetch(`${url}/seats`);
		if (!response.ok) {
			new Error(`Ошибка при получении данных: ${response.statusText}`);
		}
		return response.json();
	} catch (error) {
		console.error('Ошибка при получении данных о местах:', error);
		return [];
	}
};

export const takeSeat = async (telegramId: string, seatId: number): Promise<SeatType> => {
	try {
		const response = await fetch(`${url}/seats/${seatId}/take`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({telegramId}),
		});

		if (!response.ok) {
			new Error(`HTTP error! Status: ${response.status}`);
		}

		// Возвращаем обновлённые данные о месте
		return response.json();
	} catch (error) {
		console.error('Error taking seat:', error);
		throw error;
	}
};
  