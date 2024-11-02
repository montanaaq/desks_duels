
import App from '../App'
import { ReactElement } from 'react'

interface IRoute {
  path: string
  element: ReactElement
}

export const routes: IRoute[] = [
    {path: '/', element: <App />},
]
