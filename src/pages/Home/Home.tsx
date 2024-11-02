// src/pages/Home/Home.tsx

import { FC, useEffect, useState } from 'react'
import DesignCircles from '../../components/DesignCircles/DesignCircles'
import Desk from '../../components/Desk/Desk'
import Footer from '../../components/Footer'
import Logo from '../../components/Logo'
import useSchoolTimer from '../../hooks/useSchoolTimer'
import { getDesks } from '../../services/seatService'
import { DeskType } from '../../types/seat.types'
import { userType } from '../../types/user.types'
import styles from './Home.module.css'

interface HomeProps {
	user: userType
}

const Home: FC<HomeProps> = ({ user }) => {
	const { minutes, seconds, isGameActive } = useSchoolTimer()
	const [desks, setDesks] = useState<DeskType[]>([])
	useEffect(() => {
		const fetchDesks = async () => {
			const data = await getDesks()
			setDesks(data)
		}
		fetchDesks()
	}, [])

	return (
		<DesignCircles>
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
				<div className={styles.desks_container}>
					<div className={styles.desks}>
						{desks.length > 0 ? (
							[...Array(18)].map((_, deskIndex) => (
								<div className={styles.desk}>
									{[...Array(2)].map((_, varIndex) => (
										<Desk
											key={desks[deskIndex * 2 + varIndex].id}
											desk={desks[deskIndex * 2 + varIndex]}
										/>
									))}
								</div>
							))
						) : (
							<p>Loading...</p>
						)}
					</div>
				</div>
				<Footer />
			</div>
		</DesignCircles>
	)
}

export default Home
