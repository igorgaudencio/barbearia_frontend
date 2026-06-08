import { useState, useEffect } from 'react'
import { getAgendamentos, deletarAgendamento, getHorarios, salvarHorarios, getServicos, criarServico, deletarServico } from '../services/api'
import toast from 'react-hot-toast'

const DIAS = [
  { key: 'monday',    label: 'Segunda-feira' },
  { key: 'tuesday',  label: 'Terça-feira'   },
  { key: 'wednesday',label: 'Quarta-feira'  },
  { key: 'thursday', label: 'Quinta-feira'  },
  { key: 'friday',   label: 'Sexta-feira'   },
  { key: 'saturday', label: 'Sábado'        },
]

const TODOS_HORARIOS = [
  '07:00','07:30','08:00','08:30','09:00','09:30',
  '10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00'
]

function formatarDataAgendamento(data) {
  if (!data) return ''

  const apenasData = data.split('T')[0]
  const partes = apenasData.split('-')

  if (partes.length !== 3) return data

  const [ano, mes, dia] = partes
  return `${dia}-${mes}-${ano}`
}

export default function PainelPage() {
  const [tab, setTab]           = useState('agendamentos')
  const [agendamentos, setAg]   = useState([])
  const [configs, setConfigs]   = useState({})
  const [servicos, setServicos] = useState([])
  const [novoNome, setNome]     = useState('')
  const [novoPreco, setPreco]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(null)
  const email                   = localStorage.getItem('email')

  useEffect(() => { carregarAg() }, [])
  useEffect(() => { if (tab === 'horarios') carregarHorarios() }, [tab])
  useEffect(() => { if (tab === 'servicos') carregarServicos() }, [tab])

  async function carregarAg() {
    setLoading(true)
    try { setAg(await getAgendamentos()) }
    catch { toast.error('Erro ao carregar agendamentos') }
    finally { setLoading(false) }
  }

  async function carregarHorarios() {
    try {
      const data = await getHorarios()
      const map = {}
      data.forEach(c => { map[c.dia_semana] = c.horarios })
      setConfigs(map)
    } catch { toast.error('Erro ao carregar horários') }
  }

  async function carregarServicos() {
    try { setServicos(await getServicos()) }
    catch { toast.error('Erro ao carregar serviços') }
  }

  async function cancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return
    try {
      await deletarAgendamento(id)
      setAg(prev => prev.filter(a => a._id !== id))
      toast.success('Cancelado!')
    } catch { toast.error('Erro ao cancelar') }
  }

  function toggleHorario(dia, h) {
    setConfigs(prev => {
      const atual = prev[dia] || []
      return { ...prev, [dia]: atual.includes(h) ? atual.filter(x => x !== h) : [...atual, h].sort() }
    })
  }

  function toggleTodosHorarios(dia) {
    setConfigs(prev => {
      const atual = prev[dia] || []
      const todosSelecionados = atual.length === TODOS_HORARIOS.length

      return {
        ...prev,
        [dia]: todosSelecionados ? [] : [...TODOS_HORARIOS]
      }
    })
  }

  async function salvar(dia) {
    setSaving(dia)
    try {
      await salvarHorarios(dia, configs[dia] || [])
      toast.success('Horários salvos!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(null) }
  }

  async function handleCriarServico(e) {
    e.preventDefault()
    try {
      const s = await criarServico({ nome: novoNome, preco: parseFloat(novoPreco) })
      setServicos(prev => [...prev, s])
      setNome(''); setPreco('')
      toast.success('Serviço cadastrado!')
    } catch { toast.error('Erro ao cadastrar serviço') }
  }

  async function handleDeletarServico(id) {
    if (!confirm('Remover este serviço?')) return
    try {
      await deletarServico(id)
      setServicos(prev => prev.filter(s => s._id !== id))
      toast.success('Serviço removido!')
    } catch { toast.error('Erro ao remover') }
  }

  const card     = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }
  const input    = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }
  const tabStyle = (active) => ({ padding: '7px 16px', fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer', background: active ? 'var(--gold)' : 'none', color: active ? 'var(--text-inverse)' : 'var(--text-secondary)', fontWeight: active ? 500 : 400 })
  const appointmentGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    alignItems: 'center'
  }
  const appointmentCell = {
    minWidth: 0,
    overflowWrap: 'anywhere',
    wordBreak: 'break-word'
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'serif', fontSize: 26, marginBottom: 4 }}>Painel do Barbeiro</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{email}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          <button style={tabStyle(tab === 'agendamentos')} onClick={() => setTab('agendamentos')}>Agendamentos</button>
          <button style={tabStyle(tab === 'servicos')}     onClick={() => setTab('servicos')}>Serviços</button>
          <button style={tabStyle(tab === 'horarios')}     onClick={() => setTab('horarios')}>Horários</button>
        </div>
      </div>

      {/* AGENDAMENTOS */}
      {tab === 'agendamentos' && (
        <div style={card}>
          {loading
            ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
            : agendamentos.length === 0
            ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum agendamento ainda</p>
            : agendamentos.map(a => (
              <div key={a._id} style={{ ...appointmentGrid, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={appointmentCell}>
                  <p style={{ fontWeight: 500, marginBottom: 2 }}>{a.nome}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.email}</p>
                </div>
                <div style={{ ...appointmentCell, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.servico_nome}</p>
                  <p style={{ fontSize: 13, color: 'var(--gold)' }}>R$ {Number(a.servico_preco).toFixed(2)}</p>
                </div>
                <div style={{ ...appointmentCell, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatarDataAgendamento(a.data)}</p>
                  <p style={{ color: 'var(--gold)', fontWeight: 500 }}>{a.horario}</p>
                </div>
                <div style={{ ...appointmentCell, display: 'flex', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', padding: '3px 10px', borderRadius: 999, textAlign: 'center' }}>
                    {a.status}
                  </span>
                </div>
                <div style={{ ...appointmentCell, display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => cancelar(a._id)}
                    style={{ padding: '6px 14px', fontSize: 12, border: '1px solid var(--danger-border)', background: 'none', color: 'var(--danger)', borderRadius: 6, cursor: 'pointer', whiteSpace: 'normal' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* SERVIÇOS */}
      {tab === 'servicos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleCriarServico} style={{ ...card, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Nome do serviço</label>
              <input style={{ ...input, width: '100%' }} type="text" placeholder="Ex: Corte simples" value={novoNome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Preço (R$)</label>
              <input style={{ ...input, width: '100%' }} type="number" min="0" step="0.01" placeholder="35.00" value={novoPreco} onChange={e => setPreco(e.target.value)} required />
            </div>
            <button type="submit"
              style={{ padding: '9px 20px', background: 'var(--gold)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Adicionar
            </button>
          </form>

          <div style={card}>
            {servicos.length === 0
              ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>Nenhum serviço cadastrado ainda</p>
              : servicos.map(s => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>{s.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 500 }}>R$ {Number(s.preco).toFixed(2)}</span>
                    <button onClick={() => handleDeletarServico(s._id)}
                      style={{ padding: '5px 12px', fontSize: 12, border: '1px solid var(--danger-border)', background: 'none', color: 'var(--danger)', borderRadius: 6, cursor: 'pointer' }}>
                      Remover
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* HORÁRIOS */}
      {tab === 'horarios' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Selecione os horários que você atende em cada dia</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
            {DIAS.map(({ key, label }) => (
              <div key={key} style={card}>
                {(() => {
                  const horariosSelecionados = configs[key] || []
                  const todosSelecionados = horariosSelecionados.length === TODOS_HORARIOS.length

                  return (
                    <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--gold)' }}>{horariosSelecionados.length} horário(s)</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTodosHorarios(key)}
                  style={{ width: '100%', marginBottom: '0.75rem', padding: '8px 10px', background: 'none', color: 'var(--gold)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >
                  {todosSelecionados ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: '1rem' }}>
                  {TODOS_HORARIOS.map(h => {
                    const active = horariosSelecionados.includes(h)
                    return (
                      <button key={h} type="button" onClick={() => toggleHorario(key, h)}
                        style={{ padding: '7px 4px', fontSize: 12, borderRadius: 6, cursor: 'pointer', border: '1px solid ' + (active ? 'var(--gold)' : 'var(--border)'), background: active ? 'var(--bg-accent-soft)' : 'var(--bg-surface)', color: active ? 'var(--gold)' : 'var(--text-secondary)' }}>
                        {h}
                      </button>
                    )
                  })}
                </div>
                <button type="button" onClick={() => salvar(key)} disabled={saving === key}
                  style={{ width: '100%', padding: 9, background: 'var(--gold)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: saving === key ? 0.5 : 1 }}>
                  {saving === key ? 'Salvando...' : 'Salvar'}
                </button>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
