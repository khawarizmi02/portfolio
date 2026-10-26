import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/nocturne.css'
import App from './App.tsx'
import { WeatherPrototype } from './prototype/weather/WeatherPrototype.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WeatherPrototype>
      <App />
    </WeatherPrototype>
  </StrictMode>,
)
