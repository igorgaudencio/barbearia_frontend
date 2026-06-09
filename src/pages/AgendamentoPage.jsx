import { useState, useEffect } from 'react'
import { criarAgendamento, getHorariosDisponiveis, getServicos } from '../services/api'
import toast from 'react-hot-toast'
import { barbershopConfig } from '../config/barbershop'

function getLocalDateInputValue() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - timezoneOffset).toISOString().split('T')[0]
}

function createLocalDateTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hours, minutes] = timeValue.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function isFutureSlot(dateValue, timeValue) {
  if (!dateValue || !timeValue) return false
  return createLocalDateTime(dateValue, timeValue) > new Date()
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return ''
  const [year, month, day] = dateValue.split('-')
  if (!year || !month || !day) return dateValue
  return `${day}/${month}/${year}`
}

export default function AgendamentoPage() {
  const { slogan } = barbershopConfig
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [data, setData]           = useState('')
  const [horario, setHorario]     = useState('')
  const [servicoId, setServico]   = useState('')
  const [servicos, setServicos]   = useState([])
  const [slots, setSlots]         = useState(null)
  const [promocao, setPromocao]   = useState(null)
  const [loadingSlots, setLS]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [sucesso, setSucesso]     = useState(false)

  const hoje = getLocalDateInputValue()

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
    setPromocao(null)
    if (!d) return
    setLS(true)
    try {
      const info = await getHorariosDisponiveis(d)
      setSlots(info)
      setPromocao(info.promocao?.ativo ? info.promocao : null)
    } catch {
      toast.error('Erro ao buscar horários')
    } finally {
      setLS(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isFutureSlot(data, horario)) {
      toast.error('Selecione um horário que ainda não tenha passado')
      setHorario('')
      return
    }
    setLoading(true)
    try {
      await criarAgendamento({ nome, email, data, horario, servico_id: servicoId })
      setSucesso(true)
      setNome(''); setEmail(''); setData(''); setHorario(''); setServico(''); setSlots(null); setPromocao(null)
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
  const horariosDisponiveis = slots?.disponiveis?.filter(h => isFutureSlot(data, h)) ?? []
  const input = { width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', outline: 'none' }
  const label = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }
  const card  = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '2rem' }
  const selectedOption = {
    border: '1px solid var(--select-border)',
    background: 'var(--select-bg)',
    boxShadow: 'var(--select-shadow)'
  }
  const descontoPromocional = Number(promocao?.desconto || 0)
  const temPromocao = Boolean(promocao?.ativo && descontoPromocional > 0)
  const precoComDesconto = (preco) => Number(preco || 0) * (1 - descontoPromocional / 100)

  return (
    <div>
      <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border-soft)', textAlign: 'center', padding: '3rem 2rem' }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--gold-strong)', textTransform: 'uppercase', marginBottom: 12 }}>Agende seu horário</p>
        <h1 style={{ fontFamily: 'serif', fontSize: 42, fontWeight: 700, marginBottom: 10 }}>{slogan}</h1>
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
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        ...(servicoId === s._id ? selectedOption : null)
                      }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 16, fontWeight: 700, color: servicoId === s._id ? 'var(--select-text)' : 'var(--text-primary)' }}>
                        {s.nome}
                        {temPromocao && (
                          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 999, padding: '2px 8px' }}>
                            Promoção -{descontoPromocional}%
                          </span>
                        )}
                      </span>
                      {temPromocao ? (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textDecoration: 'line-through' }}>R$ {Number(s.preco).toFixed(2)}</span>
                          <span style={{ fontSize: 16, color: servicoId === s._id ? 'var(--select-text)' : 'var(--gold-strong)', fontWeight: 800 }}>R$ {precoComDesconto(s.preco).toFixed(2)}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 16, color: servicoId === s._id ? 'var(--select-text)' : 'var(--gold-strong)', fontWeight: 700 }}>
                          R$ {Number(s.preco).toFixed(2)}
                        </span>
                      )}
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
              {temPromocao && (
                <div style={{ marginTop: 8, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontWeight: 700 }}>
                  Este dia está com {descontoPromocional}% de desconto em todos os serviços.
                </div>
              )}
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
              {slots && !loadingSlots && horariosDisponiveis.length === 0 && (
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', padding: '10px 0' }}>Nenhum horário disponível neste dia</p>
              )}
              {slots && !loadingSlots && horariosDisponiveis.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {horariosDisponiveis.map(h => (
                    <button key={h} type="button" onClick={() => setHorario(h)}
                      style={{
                        padding: '10px 4px',
                        fontSize: 15,
                        fontWeight: 700,
                        borderRadius: 8,
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        color: horario === h ? 'var(--select-text)' : 'var(--text-secondary)',
                        ...(horario === h ? selectedOption : null)
                      }}>
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
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {servicoSelecionado.nome} — R$ {(temPromocao ? precoComDesconto(servicoSelecionado.preco) : Number(servicoSelecionado.preco)).toFixed(2)}
                    </span>
                  </div>
                )}
                {temPromocao && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Promoção</span>
                    <span style={{ color: 'var(--success-text)', fontWeight: 800 }}>-{descontoPromocional}%</span>
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
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatDisplayDate(data)}</span>
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
