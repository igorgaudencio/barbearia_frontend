import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, cadastrar } from '../services/api'
import toast from 'react-hot-toast'

export default function BarbeiroPage() {
  const [modo, setModo]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirmacao, setConf]  = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let data
      if (modo === 'login') {
        data = await login(email, password)
        toast.success('Bem-vindo!')
      } else {
        data = await cadastrar(email, password, confirmacao)
        toast.success('Cadastro realizado!')
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('email', data.email)
      navigate('/painel')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro, tente novamente')
    } finally {
      setLoading(false)
    }
  }

  const input = { width: '100%', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#f0ede6', outline: 'none', fontFamily: 'inherit' }
  const label = { display: 'block', fontSize: 11, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 36, color: '#D4A853', marginBottom: 10 }}>✂</div>
          <h1 style={{ fontFamily: 'serif', fontSize: 26, marginBottom: 6 }}>Área do Barbeiro</h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {modo === 'login' ? 'Entre com suas credenciais para acessar o painel' : 'Crie sua conta para acessar o painel'}
          </p>
        </div>

        <div style={{ display: 'flex', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
          {[['login', 'Entrar'], ['cadastro', 'Criar conta']].map(([m, label]) => (
            <button key={m} type="button" onClick={() => setModo(m)}
              style={{ flex: 1, padding: '8px', fontSize: 13, border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', background: modo === m ? '#D4A853' : 'none', color: modo === m ? '#111' : '#888', fontWeight: modo === m ? 500 : 400, transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 14, padding: '1.75rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={label}>E-mail</label>
            <input style={input} type="email" placeholder="barbeiro@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={{ marginBottom: modo === 'cadastro' ? '1rem' : '1.5rem' }}>
            <label style={label}>Senha</label>
            <input style={input} type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {modo === 'cadastro' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={label}>Confirmar senha</label>
              <input style={input} type="password" placeholder="••••••" value={confirmacao} onChange={e => setConf(e.target.value)} required />
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 13, background: '#D4A853', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar no painel' : 'Criar conta'}
          </button>
        </form>

      </div>
    </div>
  )
}
