// src/components/Seat/Seat.tsx
import { FC } from 'react'
import { SeatType } from '../../types/seat.types'
import styles from './Seat.module.css'

interface SeatProps {
	seat: SeatType
	isSelected: boolean
	onSelect: (seat: SeatType) => void
	isModalOpen: boolean
}

const Seat: FC<SeatProps> = ({ seat, isSelected, onSelect, isModalOpen }) => {
	let circleClass
	if (seat.dueled && seat.occupiedBy) {
		circleClass = styles.occupied // Красный цвет, если дуэль была завершена на этом месте
	  } else if (seat.occupiedBy) {
		circleClass = styles.dueled
	  } else {
		circleClass = styles.free // Зеленый цвет, если место свободно
	  }
	return (
		<div
			onClick={() => onSelect(seat)}
			className={`${styles.desk_circle} ${circleClass} ${
				isSelected && isModalOpen ? styles.active : ''
			}`}
		></div>
	)
}

export default Seat
