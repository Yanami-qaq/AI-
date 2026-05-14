import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import { CheckCircle2, AlertTriangle, Lightbulb, ClipboardList, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { interviewApi } from '../services/api'

const POSITION_LABELS: Record<string, string> = {
  java_backend: 'Java后端开发工程师',
  web_frontend: 'Web前端开发工程师',
  python_algorithm: 'Python算法工程师',
}

function scoreGrade(score: number): { label: string; gradient: string; text: string } {
  if (score >= 90) return { label: '表现优秀 · 建议录用', gradient: 'from-green-500 to-emerald-600', text: 'text-green-100' }
  if (score >= 75) return { label: '表现良好 · 小有瑕疵', gradient: 'from-blue-500 to-blue-600', text: 'text-blue-100' }
  if (score >= 60) return { label: '基础合格 · 继续提升', gradient: 'from-yellow-500 to-orange-500', text: 'text-yellow-100' }
  return { label: '仍需努力 · 继续加油', gradient: 'from-red-500 to-red-600', text: 'text-red-100' }
}

function barColor(score: number) {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-blue-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    interviewApi.getSession(sessionId!).then(r => {
      setData(r.data)
    }).finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">加载报告中...</p>
        </div>
      </div>
    )
  }

  if (!data?.evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-3">报告生成中，请稍候...</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 text-sm border border-blue-200 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  const { evaluation, session } = data
  const grade = scoreGrade(evaluation.overall_score)

  const radarData = [
    { subject: '技术能力', score: evaluation.technical_score },
    { subject: '表达能力', score: evaluation.expression_score },
    { subject: '逻辑思维', score: evaluation.logic_score },
    { subject: '岗位匹配', score: evaluation.position_match_score },
  ]

  const dimensions = [
    { label: '技术能力', score: evaluation.technical_score },
    { label: '表达能力', score: evaluation.expression_score },
    { label: '逻辑思维', score: evaluation.logic_score },
    { label: '岗位匹配', score: evaluation.position_match_score },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-10">
        <span className="font-bold text-gray-900">面试评估报告</span>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/interview/${sessionId}`)}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            查看对话
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            返回首页
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* 总分横幅 */}
        <div className={`bg-gradient-to-r ${grade.gradient} rounded-2xl p-8 text-center text-white`}>
          <p className={`text-sm mb-3 ${grade.text}`}>
            {POSITION_LABELS[session.position]} · 综合评分
          </p>
          <div className="text-8xl font-bold tabular-nums mb-3">
            {Math.round(evaluation.overall_score)}
          </div>
          <div className="text-white/70 text-sm mb-2">/ 100</div>
          <div className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-medium">
            {grade.label}
          </div>
        </div>

        {/* 各维度分数 + 雷达图 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">各维度得分</h2>
            <div className="space-y-4">
              {dimensions.map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-bold text-gray-900 tabular-nums">{Math.round(item.score)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${barColor(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-2">能力雷达图</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 亮点与不足 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              表现亮点
            </h2>
            <ul className="space-y-2.5">
              {evaluation.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 bg-green-50 rounded-lg px-3 py-2.5 text-sm text-gray-700">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              待改进点
            </h2>
            <ul className="space-y-2.5">
              {evaluation.weaknesses.map((w: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 bg-yellow-50 rounded-lg px-3 py-2.5 text-sm text-gray-700">
                  <span className="text-yellow-500 flex-shrink-0 mt-0.5">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 改进建议 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-blue-500" />
            提升建议
          </h2>
          <ol className="space-y-2.5">
            {evaluation.suggestions.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* 详细报告 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-gray-500" />
            详细评估报告
          </h2>
          <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed prose-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                code: ({ children }) => <code className="bg-gray-200 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
              }}
            >
              {evaluation.detailed_report}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
