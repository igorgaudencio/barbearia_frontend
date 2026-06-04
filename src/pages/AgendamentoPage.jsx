import { useState } from 'react'
import { criarAgendamento, getHorariosDisponiveis } from '../services/api'
import toast from 'react-hot-toast'

export default function AgendamentoPage() {
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [data, setData]           = useState('')
  const [horario, setHorario]     = useState('')
  const [slots, setSlots]         = useState(null)
  const [loadingSlots, setLS]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [sucesso, setSucesso]     = useState(false)

  const hoje = new Date().toISOString().split('T')[0]

  async function handleDataChange(e) {
    const d = e.target.value
    setData(d)
    setHorario('')
    setSlots(null)
    if (!d) return

    setLS(true)
    try {
      const info = await getHorariosDisponiveis(d)
      setSlots(info)
    } catch {
      toast.error('Erro ao buscar horários')
    } finally {
      setLS(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await criarAgendamento({ nome, email, data, horario })
      setSucesso(true)
      setNome(''); setEmail(''); setData(''); setHorario(''); setSlots(null)
      toast.success('Agendamento confirmado!')
      setTimeout(() => setSucesso(false), 4000)
    } catch (err) {
      const msg = err.response?.data?.errors?.join(', ') || 'Erro ao agendar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const input = { width: '100%', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#f0ede6', outline: 'none', fontFamily: 'inherit' }
  const label = { display: 'block', fontSize: 11, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }
  const card  = { background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 14, padding: '1.75rem' }

  return (
    <div>
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', textAlign: 'center', padding: '3rem 2rem' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#D4A853', textTransform: 'uppercase', marginBottom: 12 }}>Agende seu horário</p>
        <h1 style={{ fontFamily: 'serif', fontSize: 36, fontWeight: 500, marginBottom: 10 }}>Seu estilo, na hora certa</h1>
        <p style={{ color: '#888', fontSize: 15 }}>Escolha um dia e horário disponível</p>
      </div>

      <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
        {sucesso ? (
          <div style={{ ...card, textAlign: 'center', padding: '2.5rem', border: '1px solid #2e2518' }}>
            <div style={{ fontSize: 48, color: '#D4A853', marginBottom: 12 }}>✓</div>
            <h2 style={{ fontFamily: 'serif', fontSize: 22, marginBottom: 8 }}>Agendado com sucesso!</h2>
            <p style={{ color: '#888', fontSize: 14 }}>Confirmação enviada para <strong style={{ color: '#D4A853' }}>{email}</strong></p>
          </div>
        ) : (
          <form style={card} onSubmit={handleSubmit}>
            <h2 style={{ fontFamily: 'serif', fontSize: 20, marginBottom: 4 }}>Seus dados</h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: '1.5rem' }}>Preencha para confirmar o agendamento</p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Nome completo</label>
              <input style={input} type="text" placeholder="Ex: João Silva" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>E-mail</label>
              <input style={input} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Data</label>
              <input style={input} type="date" min={hoje} value={data} onChange={handleDataChange} required />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={label}>Horário disponível</label>

              {!data && (
                <p style={{ fontSize: 13, color: '#555', padding: '10px 0' }}>← Selecione uma data primeiro</p>
              )}

              {loadingSlots && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ height: 38, background: '#161616', borderRadius: 8, opacity: 0.5 }} />
                  ))}
                </div>
              )}

              {slots && !loadingSlots && slots.disponiveis?.length === 0 && (
                <p style={{ fontSize: 13, color: '#555', padding: '10px 0' }}>Nenhum horário disponível neste dia</p>
              )}

              {slots && !loadingSlots && slots.disponiveis?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {slots.disponiveis.map(h => (
                    <button key={h} type="button" onClick={() => setHorario(h)}
                      style={{ padding: '9px 4px', fontSize: 13, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (horario === h ? '#D4A853' : '#2a2a2a'), background: horario === h ? '#1a1508' : '#161616', color: horario === h ? '#D4A853' : '#888' }}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {data && slots && (
              <div style={{ background: '#161616', borderRadius: 8, padding: '12px 14px', marginBottom: '1.25rem', border: '1px solid #2a2a2a' }}>
                {[['Data', data], ['Horário', horario || '—'], ['Cliente', nome || '—']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                    <span style={{ color: '#888' }}>{k}</span>
                    <span style={{ color: k === 'Horário' ? '#D4A853' : '#f0ede6', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={!horario || loading}
              style={{ width: '100%', padding: 13, background: '#D4A853', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: (!horario || loading) ? 0.4 : 1 }}>
              {loading ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}