import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/nocturne.css'
import App from './App.tsx'
import { WeatherProvider } from './weather/WeatherProvider.tsx'
import { Options3D } from './prototype/Options3D.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WeatherProvider>
      <Options3D>
        <App />
      </Options3D>
    </WeatherProvider>
  </StrictMode>,
)
