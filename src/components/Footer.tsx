import { Swords } from 'lucide-react'
import { FC } from 'react'

const Footer: FC = () => {
	return (
		<span
			style={{
				textAlign: 'center',
				color: 'var(--color-text)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				fontSize: '12px',
				opacity: '50%',
				marginTop: 'auto',
			}}
		>
			<Swords size={18} />
			&nbsp; Made by&nbsp; <b>Amir.</b>
		</span>
	)
}

export default Footer
