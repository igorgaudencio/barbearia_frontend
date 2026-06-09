import { useState, useEffect } from 'react'
import { criarAgendamento, getHorariosDisponiveis, getServicos } from '../services/api'
import toast from 'react-hot-toast'

export default function AgendamentoPage() {
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [data, setData]           = useState('')
  const [horario, setHorario]     = useState('')
  const [servicoId, setServico]   = useState('')
  const [servicos, setServicos]   = useState([])
  const [slots, setSlots]         = useState(null)
  const [loadingSlots, setLS]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [sucesso, setSucesso]     = useState(false)

  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => {
    getServicos()
      .then(setServicos)
      .catch(() => toast.error('Erro ao carregar serviços'))
  }, [])

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
      await criarAgendamento({ nome, email, data, horario, servico_id: servicoId })
      setSucesso(true)
      setNome(''); setEmail(''); setData(''); setHorario(''); setServico(''); setSlots(null)
      toast.success('Agendamento confirmado!')
      setTimeout(() => setSucesso(false), 4000)
    } catch (err) {
      const msg = err.response?.data?.errors?.join(', ') || 'Erro ao agendar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const servicoSelecionado = servicos.find(s => s._id === servicoId)
  const input = { width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', outline: 'none' }
  const label = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }
  const card  = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '2rem' }

  return (
    <div>
      <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border-soft)', textAlign: 'center', padding: '3rem 2rem' }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--gold-strong)', textTransform: 'uppercase', marginBottom: 12 }}>Agende seu horário</p>
        <h1 style={{ fontFamily: 'serif', fontSize: 42, fontWeight: 700, marginBottom: 10 }}>Seu estilo, na hora certa</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18, fontWeight: 500 }}>Escolha o serviço, dia e horário disponível</p>
      </div>

      <div style={{ maxWidth: 520, margin: '2rem auto', padding: '0 1rem' }}>
        {sucesso ? (
          <div style={{ ...card, textAlign: 'center', padding: '2.5rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 48, color: 'var(--gold)', marginBottom: 12 }}>✓</div>
            <h2 style={{ fontFamily: 'serif', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Agendado com sucesso!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500 }}>Confirmação enviada para <strong style={{ color: 'var(--gold-strong)' }}>{email}</strong></p>
          </div>
        ) : (
          <form style={card} onSubmit={handleSubmit}>
            <h2 style={{ fontFamily: 'serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Novo agendamento</h2>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Preencha os dados para confirmar</p>

            {/* Serviços */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={label}>Serviço</label>
              {servicos.length === 0 ? (
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', padding: '10px 0' }}>Nenhum serviço disponível no momento</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {servicos.map(s => (
                    <button key={s._id} type="button" onClick={() => setServico(s._id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + (servicoId === s._id ? 'var(--gold)' : 'var(--border)'), background: servicoId === s._id ? 'var(--bg-accent-soft)' : 'var(--bg-surface)' }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: servicoId === s._id ? 'var(--gold-strong)' : 'var(--text-primary)' }}>{s.nome}</span>
                      <span style={{ fontSize: 16, color: 'var(--gold-strong)', fontWeight: 700 }}>
                        R$ {Number(s.preco).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dados pessoais */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Nome completo</label>
              <input style={input} type="text" placeholder="Ex: João Silva" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>E-mail</label>
              <input style={input} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Data */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Data</label>
              <input style={input} type="date" min={hoje} value={data} onChange={handleDataChange} required />
            </div>

            {/* Horários */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={label}>Horário disponível</label>
              {!data && <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', padding: '10px 0' }}>← Selecione uma data primeiro</p>}
              {loadingSlots && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ height: 38, background: 'var(--bg-surface)', borderRadius: 8, opacity: 0.5 }} />
                  ))}
                </div>
              )}
              {slots && !loadingSlots && slots.disponiveis?.length === 0 && (
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', padding: '10px 0' }}>Nenhum horário disponível neste dia</p>
              )}
              {slots && !loadingSlots && slots.disponiveis?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {slots.disponiveis.map(h => (
                    <button key={h} type="button" onClick={() => setHorario(h)}
                      style={{ padding: '10px 4px', fontSize: 15, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid ' + (horario === h ? 'var(--gold)' : 'var(--border)'), background: horario === h ? 'var(--bg-accent-soft)' : 'var(--bg-surface)', color: horario === h ? 'var(--gold-strong)' : 'var(--text-secondary)' }}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo */}
            {(servicoSelecionado || data || horario || nome) && (
              <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '14px 16px', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
                {servicoSelecionado && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Serviço</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{servicoSelecionado.nome} — R$ {Number(servicoSelecionado.preco).toFixed(2)}</span>
                  </div>
                )}
                {nome && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cliente</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{nome}</span>
                  </div>
                )}
                {data && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Data</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{data}</span>
                  </div>
                )}
                {horario && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Horário</span>
                    <span style={{ color: 'var(--gold-strong)', fontWeight: 700 }}>{horario}</span>
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={!servicoId || !horario || loading}
              style={{ width: '100%', padding: 14, background: 'var(--gold)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: (!servicoId || !horario || loading) ? 0.4 : 1 }}>
              {loading ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
