import { SeatType } from "../types/seat.types";
import { url } from "./userService";

export const getDesks = async (): Promise<SeatType[]> => {
    try {
      const response = await fetch(`${url}/seats`);
      if (!response.ok) {
        throw new Error(`Ошибка при получении данных: ${response.statusText}`);
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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Возвращаем обновлённые данные о месте
      return await response.json();
    } catch (error) {
      console.error('Error taking seat:', error);
      throw error;
    }
  };
  