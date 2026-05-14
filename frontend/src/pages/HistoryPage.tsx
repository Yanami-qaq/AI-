import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BrainCircuit, Server, Globe, Bot, ClipboardX, History, Loader2, Trash2, X } from 'lucide-react'
import { interviewApi } from '../services/api'

const POSITIONS: Record<string, { label: string; icon: typeof Server; color: string; bg: string }> = {
  java_backend: { label: 'Java后端', icon: Server, color: 'text-orange-500', bg: 'bg-orange-50' },
  web_frontend: { label: 'Web前端', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50' },
  python_algorithm: { label: 'Python算法', icon: Bot, color: 'text-purple-500', bg: 'bg-purple-50' },
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  in_progress: { label: '进行中', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  abandoned: { label: '已放弃', className: 'bg-gray-100 text-gray-500' },
}

function DeleteConfirmDialog({
  session,
  onConfirm,
  onCancel,
  deleting,
}: {
  session: any
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}) {
  const pos = POSITIONS[session.position]
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-bold text-gray-900 text-lg">删除记录</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 rounded-lg p-0.5 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-600 text-sm mb-1">
          确认删除这条 <span className="font-medium text-gray-900">{pos?.label || session.position}</span> 面试记录吗？
        </p>
        <p className="text-gray-400 text-xs mb-6">对话内容和评估报告将一并删除，无法恢复。</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {deleting ? <><Loader2 size={14} className="animate-spin" />删除中...</> : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    interviewApi.listSessions().then(r => setSessions(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await interviewApi.deleteSession(deleteTarget.id)
      setSessions(prev => prev.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {deleteTarget && (
        <DeleteConfirmDialog
          session={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      <nav className="bg-white border-b border-gray-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2.5 text-blue-600">
          <BrainCircuit size={22} />
          <span className="font-bold text-gray-900 text-base">AI模拟面试平台</span>
        </div>
        <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          返回首页
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2.5 mb-6">
          <History size={20} className="text-gray-500" />
          <h1 className="text-xl font-bold text-gray-900">面试历史记录</h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl py-16 px-6 text-center">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardX size={26} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium mb-1">还没有面试记录</p>
            <p className="text-gray-400 text-sm mb-5">完成第一次面试后，记录将显示在这里</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              去开始第一次面试
            </Link>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map(session => {
              const pos = POSITIONS[session.position]
              const status = STATUS_MAP[session.status] || { label: session.status, className: 'bg-gray-100 text-gray-500' }
              const Icon = pos?.icon || Server
              const isInProgress = session.status === 'in_progress'

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex justify-between items-center hover:border-blue-200 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${pos?.bg || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={pos?.color || 'text-gray-500'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{pos?.label || session.position}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${status.className}`}>
                          {isInProgress && (
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
                          )}
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{new Date(session.started_at).toLocaleString('zh-CN')}</span>
                        {session.total_questions > 0 && (
                          <span>共 {session.total_questions} 题</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0 items-center">
                    {isInProgress && (
                      <button
                        onClick={() => navigate(`/interview/${session.id}`)}
                        className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                      >
                        继续面试
                      </button>
                    )}
                    {session.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/report/${session.id}`)}
                        className="text-xs text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors font-medium"
                      >
                        查看报告
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(session)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除记录"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
