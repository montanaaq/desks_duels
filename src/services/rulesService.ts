// services/userService.ts
import { url } from "./userService";

export const handleAcceptRules = async (telegramId: number, navigate: (path: string) => void) => {
	try {
		const response = await fetch(`${url}/auth/accept-rules`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({telegramId: telegramId.toString()}),
		});

		if (!response.ok) {
			new Error(`HTTP error! Status: ${response.status}`);
		}
		if (response.status === 404) {
			return 'Пользователь не найден! Попробуйте зарегистрироваться с помощью /start';
		}

		// Redirect to the home page after confirming the rules
		navigate('/');
		return response.json();
	} catch (error) {
		console.error('Error confirming rules:', error);
	}
};