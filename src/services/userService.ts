// services/userService.ts

const isLocal = false;
export const url = isLocal
  ? import.meta.env.VITE_LOCAL_URL 
  : import.meta.env.VITE_PROD_URL;

export const getUsers = async () => {
    try {
        const response = await fetch(`${url}/users`, {
            method: 'GET',
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

export const findUserById = async (telegramId: string) => {
    try {
        const response = await fetch(`${url}/auth/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ telegramId: telegramId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        if (response.status === 404) {
            return 'Пользователь не найден! Попробуйте зарегистрироваться с помощью /start';
        }

        return response.json();
    } catch (error) {
        console.error('Error finding user by Telegram ID:', error);
        throw error;
    }
};

export const findOccupiedByUser = async (occupiedById: string) => {
    try {
        const response = await fetch(`${url}/users/get-occupiedBy-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ occupiedById: occupiedById }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Error finding occupiedBy user:', error);
        throw error;
    }
};

// Добавляем функцию для установки флага dueling
export const setDuelingFlag = async (telegramId: string, dueling: boolean) => {
    try {
        const response = await fetch(`${url}/users/set-dueling`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ telegramId, dueling }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`${errorData.error}`);
        }

        return response.json();
    } catch (error: any) {
        console.error('Error setting dueling flag:', error);
        throw new Error(error.message || 'Unknown error');
    }
};