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

  const input = { width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', outline: 'none' }
  const label = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 36, color: 'var(--gold)', marginBottom: 10 }}>✂</div>
          <h1 style={{ fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 6 }}>Área do Barbeiro</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>
            {modo === 'login' ? 'Entre com suas credenciais para acessar o painel' : 'Crie sua conta para acessar o painel'}
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
          {[['login', 'Entrar'], ['cadastro', 'Criar conta']].map(([m, label]) => (
            <button key={m} type="button" onClick={() => setModo(m)}
              style={{ flex: 1, padding: '10px', fontSize: 15, border: 'none', borderRadius: 7, cursor: 'pointer', background: modo === m ? 'var(--gold)' : 'none', color: modo === m ? 'var(--text-inverse)' : 'var(--text-secondary)', fontWeight: modo === m ? 700 : 600, transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.75rem' }}>
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
            style={{ width: '100%', padding: 14, background: 'var(--gold)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar no painel' : 'Criar conta'}
          </button>
        </form>

      </div>
    </div>
  )
}
