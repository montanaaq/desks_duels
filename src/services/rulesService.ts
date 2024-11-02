// services/userService.ts
import { url } from "./userService";
export const handleAcceptRules = async (telegramId: string, navigate: (path: string) => void) => {
  try {
    const response = await fetch(`${url}/auth/accept-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Redirect to the home page after confirming the rules
    navigate('/');
    return response.json();
  } catch (error) {
    console.error('Error confirming rules:', error);
  }
};