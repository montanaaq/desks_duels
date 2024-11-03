import { FC, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { Toaster, toast } from 'sonner'
import DesignCircles from '../../components/DesignCircles/DesignCircles'
import Footer from '../../components/Footer'
import Logo from '../../components/Logo'
import Modal from '../../components/Modal/Modal'
import useSchoolTimer from '../../hooks/useSchoolTimer'
import { getDesks, takeSeat } from '../../services/seatService'
import { findOccupiedByUser, url } from '../../services/userService'
import { SeatType } from '../../types/seat.types'
import { userType } from '../../types/user.types'
import DeskContainer from './DeskContainer/DeskContainer'
import styles from './Home.module.css'

const socket = io(url)

interface HomeProps {
	user: userType
}

const Home: FC<HomeProps> = ({ user }) => {
	const { minutes, seconds, isGameActive } = useSchoolTimer()
	const [desks, setDesks] = useState<SeatType[]>([])
	const [selectedSeat, setSelectedSeat] = useState<SeatType | null>(null)
	const [occupiedByUser, setOccupiedByUser] = useState<userType | null>(null)

	useEffect(() => {
		const fetchInitialDesks = async () => {
			const data = await getDesks()
			setDesks(data)
		}
		fetchInitialDesks()

		socket.on('seatUpdated', (updatedSeat: SeatType) => {
			setDesks((prevDesks) =>
				prevDesks.map((seat) =>
					seat.id === updatedSeat.id ? updatedSeat : seat
				)
			)
		})

		// Поддержание стабильного соединения
		const pingInterval = setInterval(() => socket.emit('ping'), 5000)
		socket.on('pong', () => console.log('Received pong from server'))

		// Логирование подключения и отключения
		socket.on('connect', () => console.log('Connected to server:', socket.id))
		socket.on('disconnect', () =>
			console.log('Disconnected from server:', socket.id)
		)

		return () => {
			clearInterval(pingInterval)
			socket.off('seatUpdated')
			socket.off('pong')
			socket.off('connect')
			socket.off('disconnect')
		}
	}, [])

	// Проверяем, занят ли стол пользователем и обновляем occupant
	useEffect(() => {
		const fetchOccupiedByUser = async () => {
			if (selectedSeat && selectedSeat.occupiedBy) {
				const occupiedByUser = await findOccupiedByUser(selectedSeat.occupiedBy)
				setOccupiedByUser(occupiedByUser)
			} else {
				setOccupiedByUser(null)
			}
		}
		fetchOccupiedByUser()
	}, [selectedSeat])

	const handleSelectSeat = (seat: SeatType) => {
		setSelectedSeat(seat)
	}

	const handleCloseModal = () => {
		setSelectedSeat(null)
	}

	const handleOccupySeat = async () => {
		if (selectedSeat) {
			try {
				const updatedSeat = toast.promise(
					takeSeat(user.telegramId as string, selectedSeat.id),
					{
						loading: 'Loading...',
						success: 'Успешно занято!',
						error: 'Ошибка! Попробуйте позже.',
					}
				)
				socket.emit('seatOccupied', updatedSeat)
				setSelectedSeat(null)
				setTimeout(() => {
					window.location.reload()
				}, 1500)
			} catch (error) {
				console.error('Error occupying seat:', error)
			}
		}
	}

	const handleChallengeToDuel = () => {
		if (selectedSeat && selectedSeat.occupiedBy) {
			console.log(
				`Challenging ${selectedSeat.occupiedBy} to a duel on seat ${selectedSeat.id}`
			)
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
			<div className={styles.home_wrapper}>
				<Logo
					style={{
						width: '82.5px',
						height: '55px',
						position: 'absolute',
						top: '25px',
						left: '10px',
					}}
					textStyles={{
						position: 'absolute',
						top: '10px',
						left: '10px',
						fontSize: '12px',
					}}
				/>
				<div className={styles.container}>
					<p className={styles.title}>
						Привет, <b>{user.name}</b>!
					</p>
					<p className={styles.subtitle}>До начала</p>
					<div
						className={`${styles.timer} ${isGameActive ? styles.active : ''}`}
					>
						{minutes}:{seconds}
					</div>
					{isGameActive && (
						<p className={styles.gameStatus}>
							Игра активна!
							<br />
							Быстрее займи своё место!
						</p>
					)}
				</div>
				<DeskContainer
					desks={desks}
					onSelect={handleSelectSeat}
					isModalOpen={!!selectedSeat}
				/>
				<Footer />
			</div>

			<Modal isOpen={!!selectedSeat} onClose={handleCloseModal}>
				{selectedSeat && (
					<div>
						<h2>Место {selectedSeat.rowNumber} ряда</h2>
						<h2>Парта: {selectedSeat.deskNumber}</h2>
						<h2 style={{ marginBottom: '10px' }}>
							Вариант: № {selectedSeat.variant}
						</h2>
						<div className={styles.status_info}>
							<p>Статус:</p>
							<p
								style={
									selectedSeat.dueled
										? { color: 'var(--color-error)' }
										: { color: 'var(--color-success)' }
								}
							>
								{selectedSeat.dueled ? 'Дуэль завершена' : 'Доступно для дуэли'}
							</p>
						</div>
						<p className={styles.occupied_info}>
							Занято:{' '}
							{selectedSeat.occupiedBy
								? occupiedByUser?.name ?? 'Loading...'
								: 'Нет'}
						</p>
						{!selectedSeat.dueled &&
							(selectedSeat.occupiedBy ? (
								<button
									className={styles.modal_button}
									onClick={handleChallengeToDuel}
								>
									Предложить дуэль
								</button>
							) : (
								<button
									className={styles.modal_button}
									onClick={handleOccupySeat}
								>
									Занять место
								</button>
							))}
					</div>
				)}
			</Modal>
		</DesignCircles>
	)
}

export default Home
