// src/components/Modal/Modal.tsx

import { FC } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	children: React.ReactNode
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, children }) => {
	if (!isOpen) return null
	return (
		<div className={styles.modal} onClick={onClose}>
			<div
				className={styles.modal_content}
				onClick={(e) => e.stopPropagation()}
			>
				<button className={styles.closeButton} onClick={onClose}>
					✕
				</button>
				{children}
			</div>
		</div>
	)
}

export default Modal
