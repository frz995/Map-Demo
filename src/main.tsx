import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './css/main.css'

// Explicitly set Cesium base URL before any Cesium code runs
(window as Window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = `${import.meta.env.BASE_URL}cesium`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
