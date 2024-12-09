import App from '../App'
import type { ReactElement } from 'react'
import CoinFlip from '../components/CoinFlip/CoinFlip'
import Info from '@/pages/Info/Info'

interface IRoute {
  path: string
  element: ReactElement
}

export const routes: IRoute[] = [
    {path: '/', element: <App />},
    {path: '/coinflip/:duelId/:challengerId/:challengedId', element: <CoinFlip />},
    {path: '/info', element: <Info />}
]
