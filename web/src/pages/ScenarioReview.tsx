import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Target,
  Lightbulb,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { getSession, getSpeakingStats, ScenarioSession, SpeakingStats } from "@/api/scenarioDialogue";
import { ScenarioIcon } from "@/components/ScenarioIcon";

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md"
        style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #E2E8F0 0deg)` }}
      >
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
          <span style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-[#718096] mt-2">{label}</span>
    </div>
  );
}

function InsightList({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ElementType;
  color: string;
}) {
  if (!items?.length) return null;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} style={{ color }} />
        <span className="font-medium text-[#2D3748]">{title}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-[#718096] flex gap-2">
            <span className="text-[#A0AEC0] shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ScenarioReview() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ScenarioSession | null>(null);
  const [stats, setStats] = useState<SpeakingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(sessionId);
    if (!id) return;
    Promise.all([getSession(id), getSpeakingStats()])
      .then(([sRes, stRes]) => {
        if (sRes.code === 200) setSession(sRes.data);
        if (stRes.code === 200) setStats(stRes.data);
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#A0AEC0]">
        加载复盘报告...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#718096]">会话不存在</p>
        <button onClick={() => navigate("/scenario-selection")} className="text-[#4ECDC4]">
          返回选场景
        </button>
      </div>
    );
  }

  const analysis = session.analysis;
  const userTurns = session.turns?.filter((t) => t.role === "user") || [];
  const assistantTurns = session.turns?.filter((t) => t.role === "assistant") || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button onClick={() => navigate("/scenario-selection")} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-[#2D3748]" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-[#2D3748] -ml-10">
            课后复盘
          </h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center">
              <ScenarioIcon name={session.scenario?.icon} size={28} className="text-[#4ECDC4]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-[#2D3748]">{session.scenario?.name}</h2>
          <p className="text-sm text-[#718096] mt-1">
            {session.turnCount} 轮有效对话 · {Math.max(1, Math.round(session.durationSec / 60))} 分钟
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#4ECDC4]" />
            <span className="font-medium text-[#2D3748]">口语能力评分</span>
          </div>
          <div className="flex justify-around flex-wrap gap-y-4">
            <ScoreRing score={session.fluencyScore} label="流利度" color="#4ECDC4" />
            <ScoreRing score={session.accuracyScore} label="准确度" color="#55A3FF" />
            <ScoreRing score={session.pronunciationScore} label="发音" color="#66BB6A" />
            {analysis && (
              <>
                <ScoreRing score={analysis.vocabularyScore} label="词汇" color="#FF9800" />
                <ScoreRing score={analysis.participationScore} label="参与度" color="#9C27B0" />
              </>
            )}
          </div>
          <div className="mt-4 text-center">
            <span className="text-3xl font-bold text-[#2D3748]">{session.overallScore}</span>
            <span className="text-sm text-[#718096] ml-1">综合分</span>
          </div>
        </div>

        {analysis && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-[#55A3FF]" />
              <span className="font-medium text-[#2D3748]">量化指标</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCell label="语速" value={`${Math.round(analysis.wordsPerMinute)} 词/分`} />
              <MetricCell label="英语占比" value={`${Math.round(analysis.englishRatio * 100)}%`} />
              <MetricCell label="英文词数" value={String(analysis.userWordCount)} />
              <MetricCell label="独特词汇" value={String(analysis.uniqueWordCount)} />
              <MetricCell label="平均每轮" value={`${analysis.avgWordsPerTurn.toFixed(1)} 词`} />
              <MetricCell label="中文轮次" value={String(analysis.chineseTurnCount)} />
              <MetricCell label="语法纠正" value={String(analysis.explicitCorrections + analysis.implicitCorrections)} />
              <MetricCell label="短句/语气词" value={String(analysis.shortTurnCount)} />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[#2D3748] leading-relaxed">{session.reviewSummary}</p>
        </div>

        {analysis?.aiAnalysis && (
          <div className="bg-gradient-to-br from-[#4ECDC4]/10 to-[#55A3FF]/10 rounded-2xl p-5 border border-[#4ECDC4]/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-[#4ECDC4]" />
              <span className="font-medium text-[#2D3748]">AI 教练分析</span>
            </div>
            <p className="text-sm text-[#2D3748] leading-relaxed whitespace-pre-wrap">
              {analysis.aiAnalysis}
            </p>
          </div>
        )}

        <InsightList title="表现亮点" items={analysis?.highlights || []} icon={CheckCircle} color="#66BB6A" />
        <InsightList title="待改进" items={analysis?.issues || []} icon={AlertCircle} color="#FF9800" />
        <InsightList title="练习建议" items={analysis?.suggestions || []} icon={Lightbulb} color="#55A3FF" />
        <InsightList title="后续计划" items={analysis?.nextSteps || []} icon={Target} color="#9C27B0" />

        {assistantTurns.some((t) => t.hasCorrection || t.hasPronunciation) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-medium text-[#2D3748] mb-3">纠错 & 发音建议</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {assistantTurns
                .filter((t) => t.hasCorrection || t.hasPronunciation)
                .map((t) => (
                  <div key={t.id} className="text-sm text-[#718096] bg-amber-50 rounded-lg p-3">
                    {t.hasCorrection && <AlertCircle size={14} className="inline mr-1 text-amber-600" />}
                    {t.hasPronunciation && <CheckCircle size={14} className="inline mr-1 text-green-600" />}
                    <span className="line-clamp-4">{t.content}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {userTurns.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-medium text-[#2D3748] mb-3">对话记录</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {session.turns?.map((t, i) => (
                <div
                  key={t.id || i}
                  className={`text-sm rounded-lg p-3 ${
                    t.role === "user" ? "bg-[#55A3FF]/5 text-[#2D3748]" : "bg-[#66BB6A]/5 text-[#2D3748]"
                  }`}
                >
                  <span className="text-xs text-[#A0AEC0] mr-2">
                    {t.role === "user" ? "你" : "AI"}
                  </span>
                  {t.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {stats && stats.totalSessions > 0 && (
          <div className="bg-[#4ECDC4]/5 rounded-2xl p-5 border border-[#4ECDC4]/20">
            <p className="text-sm text-[#718096]">
              累计练习 <strong>{stats.totalSessions}</strong> 次，平均综合分{" "}
              <strong className="text-[#4ECDC4]">{stats.avgOverallScore}</strong>
              {stats.totalCorrections > 0 && (
                <> · 累计纠错 <strong>{stats.totalCorrections}</strong> 处</>
              )}
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/scenario-selection")}
          className="w-full py-4 bg-[#4ECDC4] text-white rounded-full font-medium hover:bg-[#3DBCB4] transition-colors"
        >
          再练一个场景
        </button>
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F7F9FC] rounded-lg p-3">
      <div className="text-xs text-[#718096]">{label}</div>
      <div className="text-base font-semibold text-[#2D3748] mt-0.5">{value}</div>
    </div>
  );
}
