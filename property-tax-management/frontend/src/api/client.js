import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
export const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('tax_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(r => r, error => {
  const status = error.response?.status
  if (status === 401) {
    localStorage.removeItem('tax_token'); localStorage.removeItem('tax_user')
    if (location.pathname !== '/login' && location.pathname !== '/register') location.assign('/login?expired=1')
  }
  return Promise.reject(error)
})
export function errorMessage(error) {
  return error.response?.data?.message || (error.response?.status ? `${error.response.status} request failed` : 'Unable to reach the backend')
}
