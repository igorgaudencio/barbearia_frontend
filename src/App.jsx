import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AgendamentoPage from './pages/AgendamentoPage'
import BarbeiroPage from './pages/BarbeiroPage'
import PainelPage from './pages/PainelPage'
import Layout from './components/Layout'

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/barbeiro" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1c1c1c', color: '#f0ede6', border: '1px solid #D4A853', fontSize: '14px' }
      }} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AgendamentoPage />} />
          <Route path="barbeiro" element={<BarbeiroPage />} />
          <Route path="painel" element={<RotaProtegida><PainelPage /></RotaProtegida>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}