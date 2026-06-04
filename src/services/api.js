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

export const getAgendamentos = () =>
  api.get('/agendamentos').then(r => r.data)

export const criarAgendamento = (payload) =>
  api.post('/agendamentos', { agendamento: payload }).then(r => r.data)

export const deletarAgendamento = (id) =>
  api.delete(`/agendamentos/${id}`).then(r => r.data)

export const getHorarios = () =>
  api.get('/horarios').then(r => r.data)

export const getHorariosDisponiveis = (data) =>
  api.get('/horarios', { params: { data } }).then(r => r.data)

export const salvarHorarios = (dia_semana, horarios) =>
  api.post('/horarios', { dia_semana, horarios }).then(r => r.data)

export default api