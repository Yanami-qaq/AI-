import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewApi } from '../services/api'
import { Mic, MicOff, Send, LogOut, X, Bot, Clock, CheckCircle, Loader2 } from 'lucide-react'

const POSITION_LABELS: Record<string, string> = {
  java_backend: 'Java后端开发工程师',
  web_frontend: 'Web前端开发工程师',
  python_algorithm: 'Python算法工程师',
}

interface Message {
  role: 'interviewer' | 'candidate'
  content: string
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function FinishConfirmDialog({
  onConfirm,
  onCancel,
  finishing,
}: {
  onConfirm: () => void
  onCancel: () => void
  finishing: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-bold text-gray-900 text-lg">结束面试</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 rounded-lg p-0.5 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-600 text-sm mb-1">确认要提前结束本次面试吗？</p>
        <p className="text-gray-400 text-xs mb-6">已有的对话记录将用于生成评估报告。</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            继续面试
          </button>
          <button
            onClick={onConfirm}
            disabled={finishing}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {finishing ? <><Loader2 size={14} className="animate-spin" />结束中...</> : '确认结束'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [position, setPosition] = useState('')
  const [ended, setEnded] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startedAtRef = useRef<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    loadSession()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startTimer = (startedAt: Date) => {
    startedAtRef.current = startedAt
    const tick = () => {
      const diff = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      setElapsedSeconds(diff)
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }

  const loadSession = async () => {
    if (!sessionId) return
    try {
      const res = await interviewApi.getSession(sessionId)
      const { session, messages: msgs } = res.data
      setPosition(session.position)

      const isActive = session.status === 'in_progress'
      if (!isActive) setEnded(true)

      if (msgs.length > 0) {
        const sorted = [...msgs].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        setMessages(sorted.map((m: any) => ({ role: m.role, content: m.content })))
        if (isActive) startTimer(new Date(session.started_at))
      } else {
        setLoading(true)
        const startRes = await interviewApi.startInterview(sessionId)
        setMessages([{ role: 'interviewer', content: startRes.data.reply }])
        setLoading(false)
        if (isActive) startTimer(new Date(session.started_at))
      }
    } finally {
      setInitializing(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!sessionId || !content.trim() || loading) return
    setLoading(true)
    setMessages(prev => [...prev, { role: 'candidate', content }])
    setInput('')
    try {
      const res = await interviewApi.sendMessage(sessionId, content)
      setMessages(prev => [...prev, { role: 'interviewer', content: res.data.reply }])
      if (res.data.is_end) {
        handleInterviewEnd()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInterviewEnd = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setEnded(true)
    if (sessionId) await interviewApi.evaluate(sessionId).catch(() => {})
  }

  const handleFinishConfirm = async () => {
    if (!sessionId) return
    setFinishing(true)
    try {
      await interviewApi.finishInterview(sessionId)
      await handleInterviewEnd()
    } finally {
      setFinishing(false)
      setShowFinishDialog(false)
    }
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setLoading(true)
      try {
        const res = await interviewApi.sendVoice(sessionId!, blob)
        setMessages(prev => [
          ...prev,
          { role: 'candidate', content: res.data.transcribed_text },
          { role: 'interviewer', content: res.data.reply },
        ])
        if (res.data.is_end) handleInterviewEnd()
      } finally {
        setLoading(false)
      }
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">正在准备面试环境...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showFinishDialog && (
        <FinishConfirmDialog
          onConfirm={handleFinishConfirm}
          onCancel={() => setShowFinishDialog(false)}
          finishing={finishing}
        />
      )}

      {/* 顶栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-sm">
              {POSITION_LABELS[position] || position} 模拟面试
            </span>
            {ended ? (
              <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                <CheckCircle size={12} />
                面试已结束
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-400 text-sm tabular-nums">
                <Clock size={13} />
                {formatTime(elapsedSeconds)}
              </span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {ended && (
              <button
                onClick={() => navigate(`/report/${sessionId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition-colors font-medium"
              >
                查看报告
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto">
        <div className="space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'interviewer' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-loose whitespace-pre-wrap ${
                  msg.role === 'candidate'
                    ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'candidate' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold ml-3 flex-shrink-0 mt-1">
                  我
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区 */}
      {!ended && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <button
              onClick={() => setShowFinishDialog(true)}
              disabled={loading}
              className="text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors p-2 flex-shrink-0 rounded-lg hover:bg-red-50"
              title="结束面试"
            >
              <LogOut size={19} />
            </button>

            <textarea
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all max-h-32 min-h-[52px] leading-relaxed"
              rows={2}
              placeholder="输入你的回答，按 Enter 发送（Shift+Enter 换行）..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${
                recording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={recording ? '停止录音' : '语音输入'}
            >
              {recording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl flex-shrink-0 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">点击左侧图标可随时结束面试并生成报告</p>
        </div>
      )}
    </div>
  )
}
