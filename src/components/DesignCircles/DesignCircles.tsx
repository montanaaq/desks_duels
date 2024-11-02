import { FC, ReactNode } from 'react'
import styles from './DesignCircles.module.css'

interface DesignCirclesProps {
	children: ReactNode
}

const DesignCircles: FC<DesignCirclesProps> = ({ children }) => {
	return (
		<div className={styles.container}>
			<ul className={styles.circles}>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
			</ul>
			<div className={styles.content}>{children}</div>
		</div>
	)
}

export default DesignCircles
