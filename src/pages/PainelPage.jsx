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

  const card     = { background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 14, padding: '1.25rem' }
  const input    = { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#f0ede6', outline: 'none', fontFamily: 'inherit' }
  const tabStyle = (active) => ({ padding: '7px 16px', fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', background: active ? '#D4A853' : 'none', color: active ? '#111' : '#888', fontWeight: active ? 500 : 400 })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'serif', fontSize: 26, marginBottom: 4 }}>Painel do Barbeiro</h1>
          <p style={{ fontSize: 14, color: '#888' }}>{email}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, padding: 4 }}>
          <button style={tabStyle(tab === 'agendamentos')} onClick={() => setTab('agendamentos')}>Agendamentos</button>
          <button style={tabStyle(tab === 'servicos')}     onClick={() => setTab('servicos')}>Serviços</button>
          <button style={tabStyle(tab === 'horarios')}     onClick={() => setTab('horarios')}>Horários</button>
        </div>
      </div>

      {/* AGENDAMENTOS */}
      {tab === 'agendamentos' && (
        <div style={card}>
          {loading
            ? <p style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
            : agendamentos.length === 0
            ? <p style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>Nenhum agendamento ainda</p>
            : agendamentos.map(a => (
              <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #2a2a2a', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p style={{ fontWeight: 500, marginBottom: 2 }}>{a.nome}</p>
                  <p style={{ fontSize: 13, color: '#888' }}>{a.email}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#888' }}>{a.servico_nome}</p>
                  <p style={{ fontSize: 13, color: '#D4A853' }}>R$ {Number(a.servico_preco).toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#888' }}>{formatarDataAgendamento(a.data)}</p>
                  <p style={{ color: '#D4A853', fontWeight: 500 }}>{a.horario}</p>
                </div>
                <span style={{ fontSize: 12, background: '#162116', color: '#5a9e5a', border: '1px solid #2a4a2a', padding: '3px 10px', borderRadius: 999 }}>
                  {a.status}
                </span>
                <button onClick={() => cancelar(a._id)}
                  style={{ padding: '6px 14px', fontSize: 12, border: '1px solid #3a1f1f', background: 'none', color: '#8b4a4a', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
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
              <label style={{ display: 'block', fontSize: 11, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Nome do serviço</label>
              <input style={{ ...input, width: '100%' }} type="text" placeholder="Ex: Corte simples" value={novoNome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Preço (R$)</label>
              <input style={{ ...input, width: '100%' }} type="number" min="0" step="0.01" placeholder="35.00" value={novoPreco} onChange={e => setPreco(e.target.value)} required />
            </div>
            <button type="submit"
              style={{ padding: '9px 20px', background: '#D4A853', color: '#111', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              + Adicionar
            </button>
          </form>

          <div style={card}>
            {servicos.length === 0
              ? <p style={{ color: '#555', textAlign: 'center', padding: '1.5rem' }}>Nenhum serviço cadastrado ainda</p>
              : servicos.map(s => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2a2a2a' }}>
                  <span style={{ fontSize: 15, color: '#f0ede6' }}>{s.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ color: '#D4A853', fontWeight: 500 }}>R$ {Number(s.preco).toFixed(2)}</span>
                    <button onClick={() => handleDeletarServico(s._id)}
                      style={{ padding: '5px 12px', fontSize: 12, border: '1px solid #3a1f1f', background: 'none', color: '#8b4a4a', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
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
          <p style={{ fontSize: 13, color: '#555', marginBottom: '1.5rem' }}>Selecione os horários que você atende em cada dia</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
            {DIAS.map(({ key, label }) => (
              <div key={key} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#D4A853' }}>{(configs[key] || []).length} horário(s)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: '1rem' }}>
                  {TODOS_HORARIOS.map(h => {
                    const active = (configs[key] || []).includes(h)
                    return (
                      <button key={h} onClick={() => toggleHorario(key, h)}
                        style={{ padding: '7px 4px', fontSize: 12, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (active ? '#D4A853' : '#2a2a2a'), background: active ? '#1a1508' : '#161616', color: active ? '#D4A853' : '#888' }}>
                        {h}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => salvar(key)} disabled={saving === key}
                  style={{ width: '100%', padding: 9, background: '#D4A853', color: '#111', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: saving === key ? 0.5 : 1 }}>
                  {saving === key ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
