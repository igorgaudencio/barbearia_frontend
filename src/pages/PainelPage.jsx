import { useEffect, useMemo, useRef, useState } from 'react'
import { getAgendamentos, deletarAgendamento, atualizarStatusAgendamento, getHorarios, salvarHorarios, getServicos, criarServico, deletarServico } from '../services/api'
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
const HORARIOS_EXPANDIDOS = criarHorarios(5, 23)
const CHAVE_VISUALIZACAO_HORARIOS = 'painel_horarios_expandidos'
const FILTROS_RECEITA = [
  { key: 'dia', label: 'Dia' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'ano', label: 'Ano' },
]
const LIMITES_AGENDAMENTOS = [10, 20, 50]
const STATUS_AGENDAMENTO = {
  PENDENTE: 'PENDENTE',
  ATENDIDO: 'ATENDIDO',
  AUSENTE: 'AUSENTE',
  CONFIRMADO: 'CONFIRMADO',
}
const FILTROS_STATUS_AGENDAMENTO = [
  { key: STATUS_AGENDAMENTO.PENDENTE, label: 'Pendente' },
  { key: STATUS_AGENDAMENTO.ATENDIDO, label: 'Atendido' },
  { key: STATUS_AGENDAMENTO.AUSENTE, label: 'Ausente' },
]

function ordenarHorarios(horarios) {
  return [...horarios].sort((a, b) => HORARIOS_EXPANDIDOS.indexOf(a) - HORARIOS_EXPANDIDOS.indexOf(b))
}

function formatarDataAgendamento(data) {
  if (!data) return ''

  const apenasData = data.split('T')[0]
  const partes = apenasData.split('-')

  if (partes.length !== 3) return data

  const [ano, mes, dia] = partes
  return `${dia}-${mes}-${ano}`
}

function dataLocal(data) {
  if (!data) return null

  const apenasData = data.split('T')[0]
  const partes = apenasData.split('-').map(Number)

  if (partes.length !== 3 || partes.some(Number.isNaN)) return null

  const [ano, mes, dia] = partes
  return new Date(ano, mes - 1, dia)
}

function dataInput(date) {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function mesmoDia(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function inicioSemana(date) {
  const inicio = new Date(date)
  const diaSemana = inicio.getDay()
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana
  inicio.setDate(inicio.getDate() + deslocamento)
  inicio.setHours(0, 0, 0, 0)
  return inicio
}

function fimSemana(date) {
  const fim = inicioSemana(date)
  fim.setDate(fim.getDate() + 6)
  fim.setHours(23, 59, 59, 999)
  return fim
}

function formatarPeriodo(filtro, referencia) {
  if (filtro === 'dia') return formatarDataAgendamento(dataInput(referencia))

  if (filtro === 'semana') {
    return `${formatarDataAgendamento(dataInput(inicioSemana(referencia)))} até ${formatarDataAgendamento(dataInput(fimSemana(referencia)))}`
  }

  if (filtro === 'mes') {
    return referencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return String(referencia.getFullYear())
}

function pertenceAoFiltro(data, filtro, referencia) {
  if (!data) return false

  if (filtro === 'dia') return mesmoDia(data, referencia)

  if (filtro === 'semana') {
    return data >= inicioSemana(referencia) && data <= fimSemana(referencia)
  }

  if (filtro === 'mes') {
    return data.getFullYear() === referencia.getFullYear() && data.getMonth() === referencia.getMonth()
  }

  return data.getFullYear() === referencia.getFullYear()
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusAtendido(status) {
  return status === STATUS_AGENDAMENTO.ATENDIDO || status === STATUS_AGENDAMENTO.CONFIRMADO
}

function rotuloStatus(status) {
  if (status === STATUS_AGENDAMENTO.ATENDIDO || status === STATUS_AGENDAMENTO.CONFIRMADO) return 'Atendido'
  if (status === STATUS_AGENDAMENTO.AUSENTE) return 'Ausente'
  return 'Pendente'
}

function estiloStatus(status) {
  if (statusAtendido(status)) {
    return {
      background: 'var(--success-bg)',
      color: 'var(--success-text)',
      border: '1px solid var(--success-border)'
    }
  }

  if (status === STATUS_AGENDAMENTO.AUSENTE) {
    return {
      background: 'var(--danger-soft)',
      color: 'var(--danger)',
      border: '1px solid var(--danger-border)'
    }
  }

  return {
    background: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)'
  }
}

export default function PainelPage() {
  const [tab, setTab]           = useState('dashboard')
  const [agendamentos, setAg]   = useState([])
  const [limiteAgendamentos, setLimiteAgendamentos] = useState(10)
  const [paginaAgendamentos, setPaginaAgendamentos] = useState(1)
  const [filtroStatusAgendamento, setFiltroStatusAgendamento] = useState(STATUS_AGENDAMENTO.PENDENTE)
  const [configs, setConfigs]   = useState({})
  const [servicos, setServicos] = useState([])
  const [filtroReceita, setFiltroReceita] = useState('mes')
  const [dataReferencia, setDataReferencia] = useState(() => dataInput(new Date()))
  const [novoNome, setNome]     = useState('')
  const [novoPreco, setPreco]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(null)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [horariosExpandidos, setHorariosExpandidos] = useState(() => localStorage.getItem(CHAVE_VISUALIZACAO_HORARIOS) === 'true')
  const dragStateRef            = useRef({ active: false, day: null, shouldSelect: true, visited: new Set() })
  const email                   = localStorage.getItem('email')

  async function carregarAg(status = STATUS_AGENDAMENTO.PENDENTE) {
    setLoading(true)
    try { setAg(await getAgendamentos({ status })) }
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
    try {
      await deletarAgendamento(id)
      setAg(prev => prev.filter(a => a._id !== id))
      toast.success('Cancelado!')
    } catch { toast.error('Erro ao cancelar') }
  }

  async function atualizarStatus(id, status) {
    try {
      const atualizado = await atualizarStatusAgendamento(id, status)
      setAg(prev => (
        status === filtroStatusAgendamento
          ? prev.map(a => a._id === id ? atualizado : a)
          : prev.filter(a => a._id !== id)
      ))
      toast.success(status === STATUS_AGENDAMENTO.ATENDIDO ? 'Atendimento confirmado!' : 'Cliente marcado como ausente!')
    } catch { toast.error('Erro ao atualizar agendamento') }
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

  async function salvar(dia) {
    setSaving(dia)
    try {
      await salvarHorarios(dia, configs[dia] || [])
      toast.success('Horários salvos!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(null) }
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

  useEffect(() => {
    const status = tab === 'dashboard' ? STATUS_AGENDAMENTO.ATENDIDO : filtroStatusAgendamento
    void Promise.resolve().then(() => carregarAg(status))
  }, [tab, filtroStatusAgendamento])
  useEffect(() => { if (tab === 'horarios') void Promise.resolve().then(carregarHorarios) }, [tab])
  useEffect(() => { if (tab === 'servicos') void Promise.resolve().then(carregarServicos) }, [tab])
  useEffect(() => {
    localStorage.setItem(CHAVE_VISUALIZACAO_HORARIOS, String(horariosExpandidos))
  }, [horariosExpandidos])
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
  const metricGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem'
  }
  const receitaReferencia = useMemo(() => dataLocal(dataReferencia) || new Date(), [dataReferencia])
  const totalPaginasAgendamentos = Math.max(1, Math.ceil(agendamentos.length / limiteAgendamentos))
  const paginaAtualAgendamentos = Math.min(paginaAgendamentos, totalPaginasAgendamentos)
  const primeiroAgendamentoPagina = (paginaAtualAgendamentos - 1) * limiteAgendamentos
  const agendamentosVisiveis = useMemo(
    () => agendamentos.slice(primeiroAgendamentoPagina, primeiroAgendamentoPagina + limiteAgendamentos),
    [agendamentos, primeiroAgendamentoPagina, limiteAgendamentos]
  )
  const dashboard = useMemo(() => {
    const agendamentosFiltrados = agendamentos
      .map(agendamento => ({ ...agendamento, dataCalculada: dataLocal(agendamento.data) }))
      .filter(agendamento => statusAtendido(agendamento.status))
      .filter(agendamento => pertenceAoFiltro(agendamento.dataCalculada, filtroReceita, receitaReferencia))

    const total = agendamentosFiltrados.reduce((soma, agendamento) => soma + Number(agendamento.servico_preco || 0), 0)
    const porServicoMap = agendamentosFiltrados.reduce((map, agendamento) => {
      const nome = agendamento.servico_nome || 'Serviço sem nome'
      const atual = map.get(nome) || { nome, quantidade: 0, total: 0 }

      atual.quantidade += 1
      atual.total += Number(agendamento.servico_preco || 0)
      map.set(nome, atual)

      return map
    }, new Map())

    const porServico = [...porServicoMap.values()].sort((a, b) => b.total - a.total)
    const ticketMedio = agendamentosFiltrados.length > 0 ? total / agendamentosFiltrados.length : 0

    return { agendamentosFiltrados, total, porServico, ticketMedio }
  }, [agendamentos, filtroReceita, receitaReferencia])

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'serif', fontSize: 30, fontWeight: 700, marginBottom: 4 }}>Painel do Barbeiro</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>{email}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          <button style={tabStyle(tab === 'dashboard')} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button style={tabStyle(tab === 'agendamentos')} onClick={() => setTab('agendamentos')}>Agendamentos</button>
          <button style={tabStyle(tab === 'servicos')}     onClick={() => setTab('servicos')}>Serviços</button>
          <button style={tabStyle(tab === 'horarios')}     onClick={() => setTab('horarios')}>Horários</button>
        </div>
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...card, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: 'serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Dashboard de ganhos</h2>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Somatória dos serviços prestados em {formatarPeriodo(filtroReceita, receitaReferencia)}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Período</label>
                <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
                  {FILTROS_RECEITA.map(filtro => (
                    <button
                      key={filtro.key}
                      type="button"
                      onClick={() => setFiltroReceita(filtro.key)}
                      style={tabStyle(filtroReceita === filtro.key)}
                    >
                      {filtro.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Data base</label>
                <input style={input} type="date" value={dataReferencia} onChange={e => setDataReferencia(e.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={card}>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Carregando dashboard...</p>
            </div>
          ) : (
            <>
              <div style={metricGrid}>
                <div style={card}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Ganhos totais</p>
                  <strong style={{ display: 'block', fontSize: 30, lineHeight: 1.2, color: 'var(--gold-strong)' }}>{formatarMoeda(dashboard.total)}</strong>
                </div>
                <div style={card}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Serviços prestados</p>
                  <strong style={{ display: 'block', fontSize: 30, lineHeight: 1.2 }}>{dashboard.agendamentosFiltrados.length}</strong>
                </div>
                <div style={card}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Ticket médio</p>
                  <strong style={{ display: 'block', fontSize: 30, lineHeight: 1.2 }}>{formatarMoeda(dashboard.ticketMedio)}</strong>
                </div>
                <div style={card}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tipos de serviço</p>
                  <strong style={{ display: 'block', fontSize: 30, lineHeight: 1.2 }}>{dashboard.porServico.length}</strong>
                </div>
              </div>

              <div style={card}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem' }}>Ganhos por serviço</h3>
                {dashboard.porServico.length === 0 ? (
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>Nenhum serviço prestado nesse período</p>
                ) : dashboard.porServico.map(servico => {
                  const percentual = dashboard.total > 0 ? (servico.total / dashboard.total) * 100 : 0

                  return (
                    <div key={servico.nome} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 700 }}>{servico.nome}</p>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{servico.quantidade} atendimento(s)</p>
                        </div>
                        <strong style={{ fontSize: 17, color: 'var(--gold-strong)' }}>{formatarMoeda(servico.total)}</strong>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${percentual}%`, height: '100%', background: 'var(--gold)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={card}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem' }}>Atendimentos do período</h3>
                {dashboard.agendamentosFiltrados.length === 0 ? (
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>Nenhum atendimento encontrado</p>
                ) : dashboard.agendamentosFiltrados.map(agendamento => (
                  <div key={agendamento._id} style={{ ...appointmentGrid, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={appointmentCell}>
                      <p style={{ fontSize: 16, fontWeight: 700 }}>{agendamento.nome}</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{agendamento.servico_nome}</p>
                    </div>
                    <div style={{ ...appointmentCell, textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{formatarDataAgendamento(agendamento.data)}</p>
                      <p style={{ fontSize: 15, color: 'var(--gold-strong)', fontWeight: 700 }}>{agendamento.horario}</p>
                    </div>
                    <div style={{ ...appointmentCell, textAlign: 'right' }}>
                      <strong style={{ fontSize: 16, color: 'var(--gold-strong)' }}>{formatarMoeda(agendamento.servico_preco)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* AGENDAMENTOS */}
      {tab === 'agendamentos' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontFamily: 'serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Agendamentos</h2>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Exibindo {agendamentosVisiveis.length} de {agendamentos.length} agendamento(s). Página {paginaAtualAgendamentos} de {totalPaginasAgendamentos}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Status</label>
                <select
                  style={input}
                  value={filtroStatusAgendamento}
                  onChange={e => {
                    setPaginaAgendamentos(1)
                    setFiltroStatusAgendamento(e.target.value)
                  }}
                >
                  {FILTROS_STATUS_AGENDAMENTO.map(filtro => (
                    <option key={filtro.key} value={filtro.key}>{filtro.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Mostrar</label>
                <select
                  style={input}
                  value={limiteAgendamentos}
                  onChange={e => {
                    setPaginaAgendamentos(1)
                    setLimiteAgendamentos(Number(e.target.value))
                  }}
                >
                  {LIMITES_AGENDAMENTOS.map(limite => (
                    <option key={limite} value={limite}>{limite} agendamentos</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {loading
            ? <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
            : agendamentos.length === 0
            ? <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum agendamento ainda</p>
            : (
              <>
                {agendamentosVisiveis.map(a => (
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
                      <span style={{ fontSize: 13, fontWeight: 700, ...estiloStatus(a.status), padding: '4px 10px', borderRadius: 999, textAlign: 'center' }}>
                        {rotuloStatus(a.status)}
                      </span>
                    </div>
                    <div style={{ ...appointmentCell, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => atualizarStatus(a._id, STATUS_AGENDAMENTO.ATENDIDO)}
                        disabled={statusAtendido(a.status)}
                        style={{ padding: '8px 12px', fontSize: 14, fontWeight: 600, border: '1px solid var(--success-border)', background: statusAtendido(a.status) ? 'var(--bg-surface)' : 'var(--success-bg}', color: 'var(--success-text)', borderRadius: 6, cursor: statusAtendido(a.status) ? 'default' : 'pointer', opacity: statusAtendido(a.status) ? 0.6 : 1, whiteSpace: 'normal' }}
                      >
                        Atendido
                      </button>
                      <button
                        type="button"
                        onClick={() => atualizarStatus(a._id, STATUS_AGENDAMENTO.AUSENTE)}
                        disabled={a.status === STATUS_AGENDAMENTO.AUSENTE}
                        style={{ padding: '8px 12px', fontSize: 14, fontWeight: 600, border: '1px solid var(--danger-border)', background: 'none', color: 'var(--danger)', borderRadius: 6, cursor: a.status === STATUS_AGENDAMENTO.AUSENTE ? 'default' : 'pointer', opacity: a.status === STATUS_AGENDAMENTO.AUSENTE ? 0.6 : 1, whiteSpace: 'normal' }}
                      >
                        Ausente
                      </button>
                      <button onClick={() => cancelar(a._id)}
                        style={{ padding: '8px 14px', fontSize: 14, fontWeight: 600, border: '1px solid var(--danger-border)', background: 'none', color: 'var(--danger)', borderRadius: 6, cursor: 'pointer', whiteSpace: 'normal' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaginaAgendamentos(pagina => Math.max(1, pagina - 1))}
                    disabled={paginaAtualAgendamentos === 1}
                    style={{ padding: '9px 14px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: 6, cursor: paginaAtualAgendamentos === 1 ? 'default' : 'pointer', opacity: paginaAtualAgendamentos === 1 ? 0.5 : 1 }}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Página {paginaAtualAgendamentos} de {totalPaginasAgendamentos}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaginaAgendamentos(pagina => Math.min(totalPaginasAgendamentos, pagina + 1))}
                    disabled={paginaAtualAgendamentos === totalPaginasAgendamentos}
                    style={{ padding: '9px 14px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: 6, cursor: paginaAtualAgendamentos === totalPaginasAgendamentos ? 'default' : 'pointer', opacity: paginaAtualAgendamentos === totalPaginasAgendamentos ? 0.5 : 1 }}
                  >
                    Próxima
                  </button>
                </div>
              </>
            )
          }
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
              Exibindo por padrão 07:00 até 18:00.
            </p>
            <button
              type="button"
              onClick={toggleVisualizacaoHorarios}
              disabled={bulkSaving}
              style={{ padding: '10px 14px', background: 'none', color: 'var(--gold-strong)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: bulkSaving ? 'wait' : 'pointer', opacity: bulkSaving ? 0.6 : 1 }}
            >
              {bulkSaving ? 'Salvando grade padrão...' : horariosExpandidos ? 'Mostrar grade padrão' : 'Expandir até 05:00–22:00'}
            </button>
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
                  disabled={bulkSaving}
                  style={{ width: '100%', marginBottom: '0.75rem', padding: '10px 10px', background: 'none', color: 'var(--gold-strong)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: bulkSaving ? 'wait' : 'pointer', opacity: bulkSaving ? 0.6 : 1 }}
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
                        disabled={bulkSaving}
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
                          cursor: bulkSaving ? 'wait' : 'pointer',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          opacity: bulkSaving ? 0.6 : 1,
                          color: active ? 'var(--select-text)' : 'var(--text-secondary)',
                          ...(active ? selectedOption : null)
                        }}>
                        {h}
                      </button>
                    )
                  })}
                </div>
                <button type="button" onClick={() => salvar(key)} disabled={saving === key || bulkSaving}
                  style={{ width: '100%', padding: 11, background: 'var(--gold)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: bulkSaving ? 'wait' : 'pointer', opacity: saving === key || bulkSaving ? 0.5 : 1 }}>
                  {saving === key ? 'Salvando...' : bulkSaving ? 'Aguarde...' : 'Salvar'}
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
