import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

export const getAgendamentos = () =>
  api.get('/agendamentos').then(r => r.data)

export const criarAgendamento = (payload) =>
  api.post('/agendamentos', { agendamento: payload }).then(r => r.data)

export const deletarAgendamento = (id) =>
  api.delete(`/agendamentos/${id}`).then(r => r.data)

export const getHorarios = () =>
  api.get('/horarios').then(r => r.data)

export const salvarHorarios = (dia_semana, horarios) =>
  api.post('/horarios', { dia_semana, horarios }).then(r => r.data)

export default api

