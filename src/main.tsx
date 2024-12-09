import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Router from './Router/Router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<Router />
	</BrowserRouter>
)