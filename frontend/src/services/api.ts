import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// 认证
export const authApi = {
  register: (data: { username: string; email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { full_name?: string; target_position?: string }) =>
    api.put('/auth/profile', data),
}

// 面试会话
export const interviewApi = {
  startSession: (position: string) =>
    api.post('/interview/sessions', { position }),
  startInterview: (sessionId: string) =>
    api.post(`/interview/sessions/${sessionId}/start`),
  listSessions: () =>
    api.get('/interview/sessions'),
  getSession: (id: string) =>
    api.get(`/interview/sessions/${id}`),
  sendMessage: (sessionId: string, content: string) =>
    api.post(`/interview/sessions/${sessionId}/chat`, { content }),
  sendVoice: (sessionId: string, audioBlob: Blob) => {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.webm')
    return api.post(`/interview/sessions/${sessionId}/voice`, form)
  },
  finishInterview: (sessionId: string) =>
    api.post(`/interview/sessions/${sessionId}/finish`),
  evaluate: (sessionId: string) =>
    api.post(`/interview/sessions/${sessionId}/evaluate`),
  deleteSession: (sessionId: string) =>
    api.delete(`/interview/sessions/${sessionId}`),
}

export async function* streamSendMessage(sessionId: string, content: string) {
  const token = localStorage.getItem('token') || ''
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/interview/sessions/${sessionId}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ') && line.length > 6) {
        yield JSON.parse(line.slice(6)) as { delta?: string; done?: boolean; is_end?: boolean; full_content?: string }
      }
    }
  }
}

// 报告统计
export const reportApi = {
  getStats: () => api.get('/report/stats'),
}

export default api
