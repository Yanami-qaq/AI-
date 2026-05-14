import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { BrainCircuit, Settings, X, Server, Globe, Bot, History, ChevronRight, Rocket, LogOut } from 'lucide-react'
import { interviewApi, reportApi, authApi } from '../services/api'

const POSITIONS = [
  {
    key: 'java_backend',
    label: 'Java后端开发',
    icon: Server,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
    desc: 'Spring Boot、JVM、MySQL、Redis、分布式',
  },
  {
    key: 'web_frontend',
    label: 'Web前端开发',
    icon: Globe,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    desc: 'React/Vue、JavaScript、浏览器原理、工程化',
  },
  {
    key: 'python_algorithm',
    label: 'Python算法',
    icon: Bot,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-50',
    desc: '数据结构、机器学习、深度学习、模型优化',
  },
]

const POSITION_LABELS: Record<string, string> = {
  java_backend: 'Java后端开发',
  web_frontend: 'Web前端开发',
  python_algorithm: 'Python算法',
}

function ProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: any
  onClose: () => void
  onSaved: (updated: any) => void
}) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    target_position: user?.target_position || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await authApi.updateProfile(form)
      onSaved(res.data)
      onClose()
    } catch {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-gray-900 text-lg">编辑个人资料</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
            <input
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="请输入姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">目标岗位</label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              value={form.target_position}
              onChange={e => setForm({ ...form, target_position: e.target.value })}
            >
              <option value="">暂不设置</option>
              <option value="java_backend">Java后端开发</option>
              <option value="web_frontend">Web前端开发</option>
              <option value="python_algorithm">Python算法</option>
            </select>
            {form.target_position && (
              <p className="text-xs text-blue-500 mt-1.5">设置后首页将优先推荐该方向的面试</p>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UserAvatar({ name }: { name: string }) {
  const initial = (name || 'U')[0].toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initial}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [starting, setStarting] = useState('')
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    authApi.me().then(r => setUser(r.data)).catch(() => {})
    reportApi.getStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  const startInterview = async (position: string) => {
    setStarting(position)
    try {
      const res = await interviewApi.startSession(position)
      navigate(`/interview/${res.data.id}`)
    } finally {
      setStarting('')
    }
  }

  const displayName = user?.full_name || user?.username || ''

  const sortedPositions = user?.target_position
    ? [...POSITIONS].sort((a, b) =>
        a.key === user.target_position ? -1 : b.key === user.target_position ? 1 : 0
      )
    : POSITIONS

  const radarData = stats?.avg_scores
    ? [
        { subject: '技术能力', score: stats.avg_scores.technical },
        { subject: '表达能力', score: stats.avg_scores.expression },
        { subject: '逻辑思维', score: stats.avg_scores.logic },
        { subject: '岗位匹配', score: stats.avg_scores.position_match },
        { subject: '综合表现', score: stats.avg_scores.overall },
      ]
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={updated => setUser(updated)}
        />
      )}

      {/* 顶部导航 */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2.5 text-blue-600">
          <BrainCircuit size={22} />
          <span className="font-bold text-gray-900 text-base">AI模拟面试平台</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/history"
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <History size={15} />
            历史记录
          </Link>
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {user && <UserAvatar name={displayName} />}
            <span>{displayName}</span>
            <Settings size={14} className="text-gray-400" />
          </button>
          <button
            onClick={() => { localStorage.removeItem('token'); navigate('/login') }}
            className="flex items-center gap-1 text-gray-400 hover:text-red-500 text-sm px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors ml-1"
            title="退出登录"
          >
            <LogOut size={15} />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 欢迎横幅 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                你好，{displayName || '同学'} 👋
              </h1>
              <p className="text-blue-100 text-sm">
                {user?.target_position
                  ? <>目标岗位：<span className="text-white font-semibold">{POSITION_LABELS[user.target_position]}</span>，选择方向开始今天的练习</>
                  : '选择一个岗位方向，开始今天的模拟面试练习'}
              </p>
            </div>
            {stats?.total_sessions > 0 && (
              <div className="flex gap-8 md:gap-10 shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums">{stats.total_sessions}</div>
                  <div className="text-blue-200 text-xs mt-0.5">累计面试</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums text-yellow-300">
                    {stats.avg_scores?.overall ?? '--'}
                  </div>
                  <div className="text-blue-200 text-xs mt-0.5">平均得分</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 选择岗位 */}
        <h2 className="text-base font-semibold text-gray-700 mb-4">选择面试方向</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {sortedPositions.map(pos => {
            const Icon = pos.icon
            const isTarget = pos.key === user?.target_position
            return (
              <div
                key={pos.key}
                className={`bg-white rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isTarget
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${pos.iconBg} flex items-center justify-center`}>
                    <Icon size={22} className={pos.iconColor} />
                  </div>
                  {isTarget && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      目标岗位
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{pos.label}</h3>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">{pos.desc}</p>
                <button
                  onClick={() => startInterview(pos.key)}
                  disabled={!!starting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5"
                >
                  {starting === pos.key ? '准备中...' : <><span>开始面试</span><ChevronRight size={15} /></>}
                </button>
              </div>
            )
          })}
        </div>

        {/* 数据统计区 */}
        {stats && stats.total_sessions > 0 && (
          <>
            <h2 className="text-base font-semibold text-gray-700 mb-4">能力数据</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-0.5">能力画像</h3>
                <p className="text-gray-400 text-xs mb-4">共 {stats.total_sessions} 次面试的平均水平</p>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Radar name="能力" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-0.5">成长曲线</h3>
                <p className="text-gray-400 text-xs mb-4">历次综合得分趋势</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats.growth_curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: '#374151', fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="overall_score"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      name="综合得分"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {stats && stats.total_sessions === 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Rocket size={28} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">开始你的第一次模拟面试</h3>
            <p className="text-gray-500 text-sm">完成面试后，这里将展示你的能力画像和成长趋势</p>
          </div>
        )}
      </div>
    </div>
  )
}
