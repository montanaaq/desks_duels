// pages/Rules/Rules.tsx
import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import DesignCircles from '../../components/DesignCircles/DesignCircles'
import Footer from '../../components/Footer'
import Logo from '../../components/Logo'
import { useTelegram } from '../../hooks/useTelegram'
import { handleAcceptRules } from '../../services/rulesService'
import styles from './Rules.module.css'

const Rules: FC = () => {
	const [isChecked, setIsChecked] = useState(false)
	const navigate = useNavigate()
	const { tg } = useTelegram()

	const handleCheckboxChange = () => {
		setIsChecked(!isChecked)
	}

	const handleNextClick = () => {
		// const telegramId = tg.initDataUnsafe?.user.id;
		const telegramId = 12341234
		if (isChecked) {
			handleAcceptRules(telegramId, navigate)
			toast.promise(handleAcceptRules(telegramId, navigate), {
				loading: 'Loading...',
				success: 'Успешно',
				error: 'Ошибка! Попробуйте позже.',
			})
			navigate('/')
			// ждать 0.5 секунды перед перезагрузкой страницы для корректной response
			setTimeout(() => {
				window.location.reload()
			}, 1500)
		}
	}

	return (
		<DesignCircles>
			<Toaster
				position='bottom-center'
				expand={true}
				richColors
				closeButton={false}
			/>
			<div className={styles.rules_wrapper}>
				<Logo
					style={{ marginTop: '10px', width: '135px', height: '90px' }}
					textStyles={{ fontSize: '20px', marginTop: '10px' }}
				/>
				<div className={styles.container}>
					<h1>Правила игры</h1>
					<ol>
						<li>
							<b>Начало игры:</b> За 5-10 минут до урока включается "битва" за
							места.
						</li>
						<li>
							<b>Выбор места:</b> За 1 минуту до урока откроется выбор мест.
							Если место занято, игрок может вызвать владельца на дуэль.
						</li>
						<li>
							<b>Мини-игры:</b> Для получения места оба игрока соревнуются в
							быстрой мини-игре. Побеждает тот, кто набрал больше очков.
						</li>
						<li>
							<b>Результаты:</b> Победитель закрепляет за собой место до конца
							урока. Новая битва начинается на следующий урок.
						</li>
					</ol>
					<div className={styles.checkbox_container}>
						<div className={styles.checkbox_wrapper_13}>
							<input
								checked={isChecked}
								onChange={handleCheckboxChange}
								type='checkbox'
							/>
						</div>
						<p>Я прочитал и ознакомился со всеми правилами игры</p>
					</div>
					<button
						onClick={handleNextClick}
						className={isChecked ? styles.button : styles.button_disabled}
						disabled={!isChecked}
					>
						Далее
					</button>
				</div>
				<Footer />
			</div>
		</DesignCircles>
	)
}

export default Rules
