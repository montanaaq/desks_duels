import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'
import { routes } from './Routes'

const Router: FC = () => {
  return (
    <Routes>
      {routes.map((route, index) => {
        return <Route key={index} path={route.path} element={route.element} />
      })}
    </Routes>
  )
}
export default Router
