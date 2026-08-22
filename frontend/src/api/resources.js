import client from './client'

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
}

export const dashboardApi = {
  summary: (params) => client.get('/dashboard/summary', { params }),
  operatorRanking: (params) => client.get('/dashboard/operator-ranking', { params }),
  fleetOverview: () => client.get('/dashboard/fleet-overview'),
}

export const haulTripsApi = {
  list: (params) => client.get('/haul-trips', { params }),
  create: (payload) => client.post('/haul-trips', payload),
  show: (id) => client.get(`/haul-trips/${id}`),
  remove: (id) => client.delete(`/haul-trips/${id}`),
}

export const fuelAnomaliesApi = {
  list: (params) => client.get('/fuel-anomalies', { params }),
}

export const mechanicalAlertsApi = {
  list: (params) => client.get('/mechanical-alerts', { params }),
  update: (id, payload) => client.patch(`/mechanical-alerts/${id}`, payload),
}

export const trucksApi = {
  list: () => client.get('/trucks'),
  create: (payload) => client.post('/trucks', payload),
  update: (id, payload) => client.put(`/trucks/${id}`, payload),
  remove: (id) => client.delete(`/trucks/${id}`),
}

export const operatorsApi = {
  list: () => client.get('/operators'),
  create: (payload) => client.post('/operators', payload),
  update: (id, payload) => client.put(`/operators/${id}`, payload),
  remove: (id) => client.delete(`/operators/${id}`),
}

export const haulRoutesApi = {
  list: () => client.get('/haul-routes'),
  create: (payload) => client.post('/haul-routes', payload),
  update: (id, payload) => client.put(`/haul-routes/${id}`, payload),
  remove: (id) => client.delete(`/haul-routes/${id}`),
}
