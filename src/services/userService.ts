export const url = "https://desks-duels-backend.onrender.com"

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
      return response.json();
    } catch (error) {
      console.error('Error finding user by Telegram ID:', error);
      throw error;
    }
  };