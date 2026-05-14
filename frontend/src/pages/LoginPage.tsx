import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BrainCircuit, AlertCircle, Loader2, ArrowRight, CheckCircle } from 'lucide-react'
import { authApi } from '../services/api'

const FEATURES = [
  '三大热门岗位方向：Java后端、Web前端、Python算法',
  'AI面试官实时对话，模拟真实面试氛围',
  '多维度能力评估，生成详细提升报告',
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(form.username, form.password)
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch {
      setError('用户名或密码错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <BrainCircuit size={28} />
          <span className="font-bold text-xl">AI模拟面试平台</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-6">
            练好面试，<br />拿下理想 offer
          </h2>
          <ul className="space-y-4">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-blue-100">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5 text-blue-300" />
                <span className="text-sm leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-blue-300 text-xs">© 2025 AI模拟面试平台</p>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* 移动端 logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8 text-blue-600">
            <BrainCircuit size={24} />
            <span className="font-bold text-lg text-gray-900">AI模拟面试平台</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">欢迎回来</h1>
            <p className="text-gray-500 mt-1 text-sm">登录账号，继续你的面试练习</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" />登录中...</>
              ) : (
                <>登录<ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            还没有账号？
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium ml-1">立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
