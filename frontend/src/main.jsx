import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'boxicons/css/boxicons.min.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
