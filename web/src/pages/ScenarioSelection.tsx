import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Mic, BarChart3 } from "lucide-react";
import { ScenarioIcon } from "@/components/ScenarioIcon";
import { listScenarios, startSession, getSpeakingStats, getVoiceReady, Scenario, SpeakingStats, VoiceReadyStatus } from "@/api/scenarioDialogue";

const difficultyLabel: Record<string, string> = {
  easy: "入门",
  medium: "进阶",
  hard: "挑战",
};

export default function ScenarioSelection() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [stats, setStats] = useState<SpeakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [voiceReady, setVoiceReady] = useState<VoiceReadyStatus | null>(null);

  useEffect(() => {
    Promise.all([listScenarios(), getSpeakingStats(), getVoiceReady()])
      .then(([scRes, stRes, vrRes]) => {
        if (scRes.code === 200) setScenarios(scRes.data || []);
        if (stRes.code === 200) setStats(stRes.data);
        if (vrRes.code === 200) setVoiceReady(vrRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (scenario: Scenario) => {
    setStarting(scenario.id);
    try {
      const res = await startSession(scenario.id);
      if (res.code === 200 && res.data) {
        navigate("/scenario-dialogue", {
          state: {
            sessionId: res.data.sessionId,
            deviceId: res.data.deviceId,
            wsPath: res.data.wsPath,
            scenario: res.data.scenario,
            voiceReady: res.data.voiceReady,
          },
        });
      }
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-[#2D3748]" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-[#2D3748] -ml-10">
            场景对话
          </h1>
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-center text-[#718096] mb-4 text-sm">
          选择场景 → 语音对话 → 实时纠错 → 发音测评 → 课后复盘
        </p>

        {voiceReady && !voiceReady.ready && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
            <p className="font-medium mb-1">语音服务未就绪</p>
            <p className="text-xs">{voiceReady.hint}</p>
            <p className="text-xs mt-2 text-amber-700">
              启动后端前设置：<code className="bg-amber-100 px-1">export REALTIME_API_KEY=sk-xxx</code>
            </p>
          </div>
        )}

        {stats && stats.totalSessions > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#4ECDC4]" />
                <span className="font-medium text-[#2D3748]">口语能力概览</span>
              </div>
              <button
                onClick={() => navigate("/scenario-history")}
                className="text-xs text-[#4ECDC4] hover:text-[#3DBCB4] font-medium"
              >
                查看历史
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-[#4ECDC4]">{stats.avgOverallScore}</div>
                <div className="text-xs text-[#718096]">综合分</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#55A3FF]">{stats.totalSessions}</div>
                <div className="text-xs text-[#718096]">练习次数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#66BB6A]">{Math.round(stats.totalMinutes)}</div>
                <div className="text-xs text-[#718096]">累计分钟</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[#A0AEC0]">加载场景中...</div>
        ) : (
          <div className="space-y-3">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                disabled={starting === s.id}
                className="w-full text-left bg-white border-2 border-[#66BB6A] rounded-xl p-4 hover:shadow-md transition-all disabled:opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center shrink-0">
                    <ScenarioIcon name={s.icon} size={20} className="text-[#4ECDC4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#2D3748]">{s.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#4ECDC4]/10 text-[#4ECDC4]">
                        {difficultyLabel[s.difficulty] || s.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-[#718096] mt-1 line-clamp-2">{s.description}</p>
                  </div>
                  <Mic size={20} className="text-[#66BB6A] shrink-0 mt-1" />
                </div>
                {starting === s.id && (
                  <p className="text-xs text-[#4ECDC4] mt-2 text-center">正在准备对话...</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
