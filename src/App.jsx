import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AgendamentoPage from './pages/AgendamentoPage'
import BarbeiroPage from './pages/BarbeiroPage'
import PainelPage from './pages/PainelPage'
import Layout from './components/Layout'
import { barbershopConfig } from './config/barbershop'

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/barbeiro" />
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme

    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.title = barbershopConfig.name
  }, [])

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        reverseOrder={true}
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1c1c1c' : '#ffffff',
            color: theme === 'dark' ? '#f0ede6' : '#1f1a14',
            border: `1px solid ${theme === 'dark' ? '#D4A853' : '#d9ccb8'}`,
            fontSize: '15px',
            fontWeight: 600
          }
        }}
      />
      <Routes>
        <Route path="/" element={<Layout theme={theme} toggleTheme={toggleTheme} />}>
          <Route index element={<AgendamentoPage />} />
          <Route path="barbeiro" element={<BarbeiroPage />} />
          <Route path="painel" element={<RotaProtegida><PainelPage /></RotaProtegida>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
