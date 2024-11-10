
import App from '../App'
import { ReactElement } from 'react'
import CoinFlip from '../components/CoinFlip/CoinFlip'

interface IRoute {
  path: string
  element: ReactElement
}

export const routes: IRoute[] = [
    {path: '/', element: <App />},
    {path: '/coinflip/:duelId/:challengerId/:challengedId', element: <CoinFlip />}
]
