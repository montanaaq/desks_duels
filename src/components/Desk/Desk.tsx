// src/components/Desk/Desk.tsx

import { FC } from 'react'
import { DeskType } from '../../types/seat.types'
import styles from './Desk.module.css'

interface DeskProps {
	desk: DeskType
}

const Desk: FC<DeskProps> = ({ desk }) => {
	let circleClass

	if (desk.dueled) {
		if (desk.occupiedBy !== null) {
			circleClass = styles.dueled // Красный цвет, если дуэль была завершена на этом месте
		}
		circleClass = styles.occupied // Жёлтый цвет, если место занято
	} else {
		circleClass = styles.free // Зеленый цвет, если место свободно
	}

	return (
		<div
			onClick={() => console.log(desk)}
			className={`${styles.desk_circle} ${circleClass}`}
		></div>
	)
}

export default Desk
