import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, TrendingUp, Calendar, Clock, BarChart3 } from "lucide-react";
import { getSpeakingStats, SpeakingStats, ScenarioSession } from "@/api/scenarioDialogue";
import { ScenarioIcon } from "@/components/ScenarioIcon";

export default function ScenarioHistory() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SpeakingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpeakingStats()
      .then((res) => {
        if (res.code === 200) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#A0AEC0]">
        加载历史记录...
      </div>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#718096]">暂无对话记录</p>
        <button
          onClick={() => navigate("/scenario-selection")}
          className="text-[#4ECDC4] hover:text-[#3DBCB4]"
        >
          开始练习
        </button>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors"
            aria-label="返回上一页"
          >
            <ArrowLeft size={24} className="text-[#2D3748]" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-[#2D3748] -ml-10">
            对话历史
          </h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* 统计概览 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-[#4ECDC4]" />
            <span className="font-medium text-[#2D3748]">练习统计</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#4ECDC4]/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-[#4ECDC4]">{stats.totalSessions}</div>
              <div className="text-xs text-[#718096] mt-1">总练习次数</div>
            </div>
            <div className="bg-[#55A3FF]/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-[#55A3FF]">
                {Math.round(stats.totalMinutes)}
              </div>
              <div className="text-xs text-[#718096] mt-1">总练习时长（分钟）</div>
            </div>
            <div className="bg-[#66BB6A]/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-[#66BB6A]">{stats.avgOverallScore}</div>
              <div className="text-xs text-[#718096] mt-1">平均综合分</div>
            </div>
            <div className="bg-[#FF9800]/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-[#FF9800]">{stats.totalCorrections}</div>
              <div className="text-xs text-[#718096] mt-1">累计纠错次数</div>
            </div>
          </div>
        </div>

        {/* 平均分数 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#4ECDC4]" />
            <span className="font-medium text-[#2D3748]">平均分数</span>
          </div>
          <div className="space-y-3">
            <ScoreBar label="流利度" score={stats.avgFluencyScore} color="#4ECDC4" />
            <ScoreBar label="准确度" score={stats.avgAccuracyScore} color="#55A3FF" />
            <ScoreBar label="发音" score={stats.avgPronunciationScore} color="#66BB6A" />
          </div>
        </div>

        {/* 最近会话列表 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-medium text-[#2D3748] mb-3">最近练习（最多20次）</p>
          <div className="space-y-2">
            {stats.recentSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => navigate(`/scenario-review/${session.id}`)}
                className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-[#4ECDC4]/5 transition-colors border border-transparent hover:border-[#4ECDC4]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#4ECDC4]/10 flex items-center justify-center flex-shrink-0">
                      <ScenarioIcon
                        name={session.scenario?.icon}
                        size={20}
                        className="text-[#4ECDC4]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#2D3748] truncate">
                        {session.scenario?.name || "未知场景"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#718096] mt-1">
                        <Calendar size={12} />
                        {formatDate(session.endedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-[#2D3748]">{session.overallScore}</div>
                    <div className="text-xs text-[#718096]">综合分</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#A0AEC0]">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {Math.max(1, Math.round(session.durationSec / 60))}分钟
                  </span>
                  <span>{session.turnCount}轮对话</span>
                </div>
                {session.reviewSummary && (
                  <div className="mt-2 text-xs text-[#718096] line-clamp-2">
                    {session.reviewSummary}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/scenario-selection")}
          className="w-full py-4 bg-[#4ECDC4] text-white rounded-full font-medium hover:bg-[#3DBCB4] transition-colors"
        >
          继续练习
        </button>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#718096]">{label}</span>
        <span className="text-sm font-semibold text-[#2D3748]">{score}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
