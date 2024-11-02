import { DeskType } from "../types/seat.types";
import { url } from "./userService";

export const getDesks = async (): Promise<DeskType[]> => {
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
  