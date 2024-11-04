// App.tsx
import { FC, useEffect, useState } from 'react'
import { useTelegram } from './hooks/useTelegram.ts'
import Home from './pages/Home/Home.tsx'
import Rules from './pages/Rules/Rules.tsx'
import { findUserById } from './services/userService.ts'
import { userType } from './types/user.types.ts'

const App: FC = () => {
	const [user, setUser] = useState<userType | null>(null)
	const [loading, setLoading] = useState(true)

	const { tg } = useTelegram()

	const getUserByTelegramId = async (telegramId: number) => {
		try {
			const userData = await findUserById(telegramId)
			console.log('Fetched user data:', userData)
			return userData.user || null
		} catch (error) {
			console.error('Error getting user by Telegram ID:', error)
			return null
		}
	}

	useEffect(() => {
		const checkUser = async () => {
		// const telegramId = tg.initDataUnsafe?.user?.id;
		const telegramId = 12341234
			if (!telegramId) {
				console.error('Telegram ID is undefined')
				setLoading(false)
				return
			}

			const user = await getUserByTelegramId(telegramId)
			if (user) {
				setUser(user)
			}
			setLoading(false)
		}
		checkUser()
	}, [tg])

	if (loading) return <div>Loading...</div>
	return user && user.rules_seen ? <Home user={user} /> : <Rules />
}

export default App
