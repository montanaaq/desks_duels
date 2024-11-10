// src/components/Seat/Seat.tsx
import {FC} from 'react';
import {SeatType} from '../../types/seat.types';
import styles from './Seat.module.css';
import useSchoolTimer from '../../hooks/useSchoolTimer';
import {toast} from 'sonner'; // Импортируем sonner для отображения уведомлений

interface SeatProps {
	seat: SeatType;
	isSelected: boolean;
	onSelect: (seat: SeatType) => void;
	isModalOpen: boolean;
}

const Seat: FC<SeatProps> = ({seat, isSelected, onSelect, isModalOpen}) => {
	const {isGameActive} = useSchoolTimer();
	// const isGameActive = true

	let circleClass;
	if (seat.dueled && seat.occupiedBy) {
		circleClass = styles.occupied;
	} else if (seat.occupiedBy) {
		circleClass = styles.dueled;
	} else {
		circleClass = styles.free;
	}

	const handleSeatClick = () => {
		if (!isGameActive) {
			setTimeout(() => {
				toast.error('Места можно занимать только когда игра активна!');
			}, 250)
			return
		}
		onSelect(seat);
	};

	return (
		<div
			onClick={handleSeatClick}
			className={`${styles.desk_circle} ${circleClass} ${
				isSelected && isModalOpen ? styles.active : ''
			}`}
		></div>
	);
};

export default Seat;
