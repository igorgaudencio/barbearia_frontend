import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

export const cadastrar = (email, password, password_confirmation) =>
  api.post('/auth/cadastro', { email, password, password_confirmation }).then(r => r.data)

export const getAgendamentos = async (status = 'TODOS') => {
  const statusNormalizado = String(status || 'TODOS').toUpperCase()

  try {
    const response = await api.get(`/agendamentos/status/${statusNormalizado}`)
    return response.data
  } catch (error) {
    const statusResposta = error?.response?.status

    if (statusResposta !== 404 && statusResposta !== 405) throw error

    const response = await api.get('/agendamentos', {
      params: { status: statusNormalizado }
    })

    return response.data
  }
}

export const criarAgendamento = (payload) =>
  api.post('/agendamentos', { agendamento: payload }).then(r => r.data)

export const atualizarAgendamento = (id, payload) =>
  api.patch(`/agendamentos/${id}`, { agendamento: payload }).then(r => r.data)

export const deletarAgendamento = (id) =>
  api.delete(`/agendamentos/${id}`).then(r => r.data)

export const getHorarios = () =>
  api.get('/horarios').then(r => r.data)

export const getHorariosDisponiveis = (data) =>
  api.get('/horarios', { params: { data } }).then(r => r.data)

export const salvarHorarios = (dia_semana, horarios) =>
  api.post('/horarios', { dia_semana, horarios }).then(r => r.data)

export const getServicos = () =>
  api.get('/servicos').then(r => r.data)

export const criarServico = (payload) =>
  api.post('/servicos', { servico: payload }).then(r => r.data)

export const atualizarServico = (id, payload) =>
  api.put(`/servicos/${id}`, { servico: payload }).then(r => r.data)

export const deletarServico = (id) =>
  api.delete(`/servicos/${id}`).then(r => r.data)

export default api
