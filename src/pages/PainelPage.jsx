import { useEffect, useRef, useState } from 'react'
import { getAgendamentos, atualizarAgendamento, deletarAgendamento, getHorarios, salvarHorarios, getServicos, criarServico, deletarServico } from '../services/api'
import toast from 'react-hot-toast'

const DIAS = [
  { key: 'monday',    label: 'Segunda-feira' },
  { key: 'tuesday',  label: 'Terça-feira'   },
  { key: 'wednesday',label: 'Quarta-feira'  },
  { key: 'thursday', label: 'Quinta-feira'  },
  { key: 'friday',   label: 'Sexta-feira'   },
  { key: 'saturday', label: 'Sábado'        },
  { key: 'sunday',   label: 'Domingo'       },
]

function criarHorarios(horaInicial, horaFinal) {
  const quantidade = ((horaFinal - horaInicial) * 2) + 1

  return Array.from({ length: quantidade }, (_, index) => {
    const totalMinutos = (horaInicial * 60) + (index * 30)
    const horas = Math.floor(totalMinutos / 60)
    const minutos = totalMinutos % 60

    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
  })
}

const HORARIOS_PADRAO = criarHorarios(7, 18)
const HORARIOS_EXPANDIDOS = criarHorarios(5, 22)
const CHAVE_VISUALIZACAO_HORARIOS = 'painel_horarios_expandidos'
const STATUS_CONFIRMADO = 'CONFIRMADO'
const STATUS_PENDENTE = 'PENDENTE'
const FILTRO_PENDENTES = 'PENDENTES'
const FILTRO_TODOS = 'TODOS'
const FILTRO_ATENDIDOS = 'ATENDIDOS'
const FILTRO_AUSENTES = 'AUSENTES'
const AGENDAMENTOS_POR_PAGINA = 6
const FILTROS_STATUS = [
  { value: FILTRO_PENDENTES, label: 'Pendentes' },
  { value: FILTRO_TODOS, label: 'Todos' },
  { value: FILTRO_ATENDIDOS, label: 'Atendidos' },
  { value: FILTRO_AUSENTES, label: 'Ausentes' },
]
const MENSAGEM_SEM_AGENDAMENTOS = {
  [FILTRO_PENDENTES]: 'Nenhum agendamento pendente.',
  [FILTRO_TODOS]: 'Nenhum agendamento cadastrado.',
  [FILTRO_ATENDIDOS]: 'Nenhum agendamento atendido.',
  [FILTRO_AUSENTES]: 'Nenhum agendamento ausente.'
}

function ordenarHorarios(horarios) {
  return [...horarios].sort((a, b) => HORARIOS_EXPANDIDOS.indexOf(a) - HORARIOS_EXPANDIDOS.indexOf(b))
}

function normalizarStatus(status) {
  const statusNormalizado = String(status || '').toUpperCase()

  if (statusNormalizado === STATUS_CONFIRMADO) return STATUS_PENDENTE

  return statusNormalizado
}

function ordenarAgendamentos(agendamentos) {
  return [...agendamentos].sort((a, b) => {
    const dataA = new Date(`${String(a.data || '').split('T')[0]}T${a.horario || '00:00'}:00`)
    const dataB = new Date(`${String(b.data || '').split('T')[0]}T${b.horario || '00:00'}:00`)
    return dataA - dataB
  })
}

function formatarDataAgendamento(data) {
  if (!data) return ''

  const apenasData = data.split('T')[0]
  const partes = apenasData.split('-')

  if (partes.length !== 3) return data

  const [ano, mes, dia] = partes
  return `${dia}-${mes}-${ano}`
}

function obterMensagemSemAgendamentos(filtroStatus) {
  return MENSAGEM_SEM_AGENDAMENTOS[filtroStatus] || 'Nenhum agendamento encontrado.'
}

export default function PainelPage() {
  const [tab, setTab]           = useState('agendamentos')
  const [agendamentos, setAg]   = useState([])
  const [configs, setConfigs]   = useState({})
  const [servicos, setServicos] = useState([])
  const [novoNome, setNome]     = useState('')
  const [novoPreco, setPreco]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState(FILTRO_PENDENTES)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [acaoAgendamentoId, setAcaoAgendamentoId] = useState(null)
  const [horariosExpandidos, setHorariosExpandidos] = useState(() => localStorage.getItem(CHAVE_VISUALIZACAO_HORARIOS) === 'true')
  const dragStateRef            = useRef({ active: false, day: null, shouldSelect: true, visited: new Set() })
  const email                   = localStorage.getItem('email')

  async function carregarAg() {
    setLoading(true)
    try {
      const data = await getAgendamentos(filtroStatus)
      setAg(ordenarAgendamentos(data).map(agendamento => ({
        ...agendamento,
        status: normalizarStatus(agendamento.status)
      })))
    }
    catch { toast.error('Erro ao carregar agendamentos') }
    finally { setLoading(false) }
  }

  async function carregarHorarios() {
    try {
      const data = await getHorarios()
      const map = {}
      data.forEach(c => { map[c.dia_semana] = ordenarHorarios(c.horarios) })
      setConfigs(map)
    } catch { toast.error('Erro ao carregar horários') }
  }

  async function carregarServicos() {
    try { setServicos(await getServicos()) }
    catch { toast.error('Erro ao carregar serviços') }
  }

  async function cancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return
    setAcaoAgendamentoId(id)
    try {
      await deletarAgendamento(id)
      await carregarAg()
      toast.success('Cancelado!')
    } catch { toast.error('Erro ao cancelar') }
    finally { setAcaoAgendamentoId(null) }
  }

  async function atualizarStatusAgendamento(id, status) {
    setAcaoAgendamentoId(id)
    try {
      await atualizarAgendamento(id, { status })
      await carregarAg()
      toast.success(`Status atualizado para ${status}`)
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setAcaoAgendamentoId(null)
    }
  }

  function toggleHorario(dia, h) {
    setConfigs(prev => {
      const atual = prev[dia] || []
      return {
        ...prev,
        [dia]: atual.includes(h) ? atual.filter(x => x !== h) : ordenarHorarios([...atual, h])
      }
    })
  }

  function setHorarioSelecionado(dia, horario, selecionado) {
    setConfigs(prev => {
      const atual = prev[dia] || []
      const jaSelecionado = atual.includes(horario)

      if (selecionado === jaSelecionado) return prev

      return {
        ...prev,
        [dia]: selecionado ? ordenarHorarios([...atual, horario]) : atual.filter(h => h !== horario)
      }
    })
  }

  function iniciarArrasteHorario(dia, horario, ativo, event) {
    if (event.button !== 0) return

    const visited = new Set([`${dia}:${horario}`])
    const shouldSelect = !ativo

    dragStateRef.current = { active: true, day: dia, shouldSelect, visited }
    setHorarioSelecionado(dia, horario, shouldSelect)
  }

  function continuarArrasteHorario(dia, horario) {
    const dragState = dragStateRef.current

    if (!dragState.active || dragState.day !== dia) return

    const slotId = `${dia}:${horario}`
    if (dragState.visited.has(slotId)) return

    dragState.visited.add(slotId)
    setHorarioSelecionado(dia, horario, dragState.shouldSelect)
  }

  function toggleTodosHorarios(dia, horariosVisiveis) {
    setConfigs(prev => {
      const atual = prev[dia] || []
      const todosSelecionados = horariosVisiveis.every(horario => atual.includes(horario))

      return {
        ...prev,
        [dia]: todosSelecionados
          ? atual.filter(horario => !horariosVisiveis.includes(horario))
          : ordenarHorarios([...new Set([...atual, ...horariosVisiveis])])
      }
    })
  }

  async function salvarHorariosGlobalmente() {
    setSaving(true)

    const resultados = await Promise.allSettled(
      DIAS.map(({ key }) => salvarHorarios(key, configs[key] || []))
    )

    const houveErro = resultados.some(resultado => resultado.status === 'rejected')

    if (houveErro) {
      toast.error('Erro ao salvar horários')
      await carregarHorarios()
    } else {
      toast.success('Horários salvos!')
    }

    setSaving(false)
  }

  async function toggleVisualizacaoHorarios() {
    if (!horariosExpandidos) {
      setHorariosExpandidos(true)
      return
    }

    const proximosConfigs = DIAS.reduce((acc, { key }) => {
      acc[key] = ordenarHorarios((configs[key] || []).filter(horario => HORARIOS_PADRAO.includes(horario)))
      return acc
    }, {})

    setConfigs(prev => ({ ...prev, ...proximosConfigs }))
    setHorariosExpandidos(false)
    setBulkSaving(true)

    const resultados = await Promise.allSettled(
      DIAS.map(({ key }) => salvarHorarios(key, proximosConfigs[key] || []))
    )

    const houveErro = resultados.some(resultado => resultado.status === 'rejected')

    if (houveErro) {
      toast.error('Erro ao salvar a grade padrão em todos os dias')
      await carregarHorarios()
      setHorariosExpandidos(true)
    } else {
      toast.success('Grade padrão aplicada e salva em todos os dias')
    }

    setBulkSaving(false)
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

  useEffect(() => { if (tab === 'agendamentos') carregarAg() }, [tab, filtroStatus])
  useEffect(() => { if (tab === 'horarios') carregarHorarios() }, [tab])
  useEffect(() => { if (tab === 'servicos') carregarServicos() }, [tab])
  useEffect(() => {
    localStorage.setItem(CHAVE_VISUALIZACAO_HORARIOS, String(horariosExpandidos))
  }, [horariosExpandidos])
  useEffect(() => { setPaginaAtual(1) }, [filtroStatus])
  useEffect(() => {
    function finalizarArraste() {
      dragStateRef.current = { active: false, day: null, shouldSelect: true, visited: new Set() }
    }

    window.addEventListener('pointerup', finalizarArraste)
    window.addEventListener('pointercancel', finalizarArraste)

    return () => {
      window.removeEventListener('pointerup', finalizarArraste)
      window.removeEventListener('pointercancel', finalizarArraste)
    }
  }, [])

  const card     = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }
  const input    = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 12px', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', outline: 'none' }
  const tabStyle = (active) => ({ padding: '9px 18px', fontSize: 15, border: 'none', borderRadius: 6, cursor: 'pointer', background: active ? 'var(--gold)' : 'none', color: active ? 'var(--text-inverse)' : 'var(--text-secondary)', fontWeight: active ? 700 : 600 })
  const selectedOption = {
    border: '1px solid var(--select-border)',
    background: 'var(--select-bg)',
    boxShadow: 'var(--select-shadow)'
  }
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
  const totalPaginasAgendamentos = Math.max(1, Math.ceil(agendamentos.length / AGENDAMENTOS_POR_PAGINA))
  const paginaAjustada = Math.min(paginaAtual, totalPaginasAgendamentos)
  const inicioPagina = (paginaAjustada - 1) * AGENDAMENTOS_POR_PAGINA
  const agendamentosPaginados = agendamentos.slice(inicioPagina, inicioPagina + AGENDAMENTOS_POR_PAGINA)
  const existemAgendamentos = agendamentos.length > 0

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 4 }}>Painel do Barbeiro</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>{email}</p>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Status exibido</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FILTROS_STATUS.map(filtro => (
                  <button
                    key={filtro.value}
                    type="button"
                    onClick={() => setFiltroStatus(filtro.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 999,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: filtroStatus === filtro.value ? 'var(--gold)' : 'var(--bg-surface)',
                      color: filtroStatus === filtro.value ? 'var(--text-inverse)' : 'var(--text-secondary)'
                    }}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {agendamentos.length} agendamento(s)
            </p>
          </div>
          {loading
            ? <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
            : !existemAgendamentos
            ? <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{obterMensagemSemAgendamentos(filtroStatus)}</p>
            : agendamentosPaginados.map(a => (
              <div key={a._id} style={{ ...appointmentGrid, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={appointmentCell}>
                  <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{a.nome}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{a.email}</p>
                </div>
                <div style={{ ...appointmentCell, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{a.servico_nome}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-strong)' }}>R$ {Number(a.servico_preco).toFixed(2)}</p>
                </div>
                <div style={{ ...appointmentCell, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{formatarDataAgendamento(a.data)}</p>
                  <p style={{ fontSize: 15, color: 'var(--gold-strong)', fontWeight: 700 }}>{a.horario}</p>
                </div>
                <div style={{ ...appointmentCell, display: 'flex', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, background: normalizarStatus(a.status) === STATUS_PENDENTE ? 'var(--success-bg)' : 'var(--bg-surface)', color: normalizarStatus(a.status) === STATUS_PENDENTE ? 'var(--success-text)' : 'var(--text-secondary)', border: normalizarStatus(a.status) === STATUS_PENDENTE ? '1px solid var(--success-border)' : '1px solid var(--border)', padding: '4px 10px', borderRadius: 999, textAlign: 'center' }}>
                    {normalizarStatus(a.status)}
                  </span>
                </div>
                <div style={{ ...appointmentCell, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 140 }}>
                    <button
                      type="button"
                      disabled={acaoAgendamentoId === a._id}
                      onClick={() => atualizarStatusAgendamento(a._id, 'ATENDIDO')}
                      style={{ padding: '8px 14px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--gold)', color: 'var(--text-inverse)', borderRadius: 6, cursor: acaoAgendamentoId === a._id ? 'wait' : 'pointer', opacity: acaoAgendamentoId === a._id ? 0.6 : 1 }}
                    >
                      Atendido
                    </button>
                    <button
                      type="button"
                      disabled={acaoAgendamentoId === a._id}
                      onClick={() => atualizarStatusAgendamento(a._id, 'AUSENTE')}
                      style={{ padding: '8px 14px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: 6, cursor: acaoAgendamentoId === a._id ? 'wait' : 'pointer', opacity: acaoAgendamentoId === a._id ? 0.6 : 1 }}
                    >
                      Ausente
                    </button>
                    <button
                      type="button"
                      disabled={acaoAgendamentoId === a._id}
                      onClick={() => cancelar(a._id)}
                      style={{ padding: '8px 14px', fontSize: 14, fontWeight: 600, border: '1px solid var(--danger-border)', background: 'none', color: 'var(--danger)', borderRadius: 6, cursor: acaoAgendamentoId === a._id ? 'wait' : 'pointer', whiteSpace: 'normal', opacity: acaoAgendamentoId === a._id ? 0.6 : 1 }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
          {!loading && existemAgendamentos && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1.25rem' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Página {paginaAjustada} de {totalPaginasAgendamentos}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={paginaAjustada === 1}
                  onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                  style={{ padding: '8px 12px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: 6, cursor: paginaAjustada === 1 ? 'not-allowed' : 'pointer', opacity: paginaAjustada === 1 ? 0.5 : 1 }}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaAjustada === totalPaginasAgendamentos}
                  onClick={() => setPaginaAtual(prev => Math.min(totalPaginasAgendamentos, prev + 1))}
                  style={{ padding: '8px 12px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: 6, cursor: paginaAjustada === totalPaginasAgendamentos ? 'not-allowed' : 'pointer', opacity: paginaAjustada === totalPaginasAgendamentos ? 0.5 : 1 }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SERVIÇOS */}
      {tab === 'servicos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleCriarServico} style={{ ...card, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Nome do serviço</label>
              <input style={{ ...input, width: '100%' }} type="text" placeholder="Ex: Corte simples" value={novoNome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Preço (R$)</label>
              <input style={{ ...input, width: '100%' }} type="number" min="0" step="0.01" placeholder="35.00" value={novoPreco} onChange={e => setPreco(e.target.value)} required />
            </div>
            <button type="submit"
              style={{ padding: '11px 20px', background: 'var(--gold)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Adicionar
            </button>
          </form>

          <div style={card}>
            {servicos.length === 0
              ? <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>Nenhum serviço cadastrado ainda</p>
              : servicos.map(s => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{s.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 15, color: 'var(--gold-strong)', fontWeight: 700 }}>R$ {Number(s.preco).toFixed(2)}</span>
                    <button onClick={() => handleDeletarServico(s._id)}
                      style={{ padding: '7px 12px', fontSize: 14, fontWeight: 600, border: '1px solid var(--danger-border)', background: 'none', color: 'var(--danger)', borderRadius: 6, cursor: 'pointer' }}>
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
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Selecione os horários que você atende em cada dia</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Clique e arraste sobre os horários para marcar ou desmarcar vários de uma vez.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
              
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={toggleVisualizacaoHorarios}
                disabled={saving || bulkSaving}
                style={{ padding: '10px 14px', background: 'none', color: 'var(--gold-strong)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: saving || bulkSaving ? 'wait' : 'pointer', opacity: saving || bulkSaving ? 0.6 : 1 }}
              >
                {bulkSaving ? 'Salvando grade padrão...' : horariosExpandidos ? 'Mostrar grade padrão' : 'Expandir até 05:00–22:00'}
              </button>
              <button
                type="button"
                onClick={salvarHorariosGlobalmente}
                disabled={saving || bulkSaving}
                style={{ padding: '10px 16px', background: 'var(--gold)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: saving || bulkSaving ? 'wait' : 'pointer', opacity: saving || bulkSaving ? 0.6 : 1 }}
              >
                {saving ? 'Salvando horários...' : bulkSaving ? 'Aguarde...' : 'Salvar horários'}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
            {DIAS.map(({ key, label }) => (
              <div key={key} style={card}>
                {(() => {
                  const horariosSelecionados = configs[key] || []
                  const horariosVisiveis = horariosExpandidos ? HORARIOS_EXPANDIDOS : HORARIOS_PADRAO
                  const todosSelecionados = horariosVisiveis.every(horario => horariosSelecionados.includes(horario))

                  return (
                    <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold-strong)' }}>{horariosSelecionados.length} horário(s)</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTodosHorarios(key, horariosVisiveis)}
                  disabled={saving || bulkSaving}
                  style={{ width: '100%', marginBottom: '0.75rem', padding: '10px 10px', background: 'none', color: 'var(--gold-strong)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: saving || bulkSaving ? 'wait' : 'pointer', opacity: saving || bulkSaving ? 0.6 : 1 }}
                >
                  {todosSelecionados ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: '1rem', userSelect: 'none' }}>
                  {horariosVisiveis.map(h => {
                    const active = horariosSelecionados.includes(h)
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={saving || bulkSaving}
                        onPointerDown={event => iniciarArrasteHorario(key, h, active, event)}
                        onPointerEnter={() => continuarArrasteHorario(key, h)}
                        onKeyDown={event => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          toggleHorario(key, h)
                        }}
                        style={{
                          padding: '8px 4px',
                          fontSize: 13,
                          fontWeight: 700,
                          borderRadius: 6,
                          cursor: saving || bulkSaving ? 'wait' : 'pointer',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          opacity: saving || bulkSaving ? 0.6 : 1,
                          color: active ? 'var(--select-text)' : 'var(--text-secondary)',
                          ...(active ? selectedOption : null)
                        }}>
                        {h}
                      </button>
                    )
                  })}
                </div>
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
