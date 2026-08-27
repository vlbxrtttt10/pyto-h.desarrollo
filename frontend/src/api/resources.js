import client from './client'

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
}

export const dashboardApi = {
  summary: (params) => client.get('/dashboard/summary', { params }),
  technicianRanking: (params) => client.get('/dashboard/technician-ranking', { params }),
  fleetOverview: () => client.get('/dashboard/fleet-overview'),
}

export const serviceVisitsApi = {
  list: (params) => client.get('/service-visits', { params }),
  create: (payload) => client.post('/service-visits', payload),
  show: (id) => client.get(`/service-visits/${id}`),
  remove: (id) => client.delete(`/service-visits/${id}`),
}

export const equipmentAnomaliesApi = {
  list: (params) => client.get('/equipment-anomalies', { params }),
}

export const maintenanceAlertsApi = {
  list: (params) => client.get('/maintenance-alerts', { params }),
  update: (id, payload) => client.patch(`/maintenance-alerts/${id}`, payload),
}

export const equipmentsApi = {
  list: () => client.get('/equipments'),
  create: (payload) => client.post('/equipments', payload),
  show: (id) => client.get(`/equipments/${id}`),
  update: (id, payload) => client.put(`/equipments/${id}`, payload),
  remove: (id) => client.delete(`/equipments/${id}`),
}

export const techniciansApi = {
  list: () => client.get('/technicians'),
  create: (payload) => client.post('/technicians', payload),
  show: (id) => client.get(`/technicians/${id}`),
  update: (id, payload) => client.put(`/technicians/${id}`, payload),
  remove: (id) => client.delete(`/technicians/${id}`),
}

export const componentsApi = {
  list: () => client.get('/components'),
  create: (payload) => client.post('/components', payload),
  show: (id) => client.get(`/components/${id}`),
  update: (id, payload) => client.put(`/components/${id}`, payload),
  remove: (id) => client.delete(`/components/${id}`),
}

export const usersApi = {
  list: () => client.get('/users'),
  modules: () => client.get('/users/modules'),
  create: (payload) => client.post('/users', payload),
  update: (id, payload) => client.put(`/users/${id}`, payload),
  remove: (id) => client.delete(`/users/${id}`),
}
