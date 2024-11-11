// services/userService.ts

export const url = 'http://localhost:3000'; // Убедитесь, что URL правильный
// export const url = 'https://desks-duels-backend.onrender.com';

export const getUsers = async () => {
    try {
        const response = await fetch(`${url}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const findUserById = async (telegramId: number) => {
    try {
        const response = await fetch(`${url}/auth/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ telegramId: telegramId.toString() }),
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

export const findOccupiedByUser = async (occupiedById: number) => {
    try {
        const response = await fetch(`${url}/users/get-occupiedBy-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ occupiedById: occupiedById.toString() }),
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
 