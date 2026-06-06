import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Mic, MicOff, PhoneOff, MessageSquare } from "lucide-react";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { activateSession, completeSession, recordTurn, Scenario, VoiceReadyStatus } from "@/api/scenarioDialogue";
import { ScenarioIcon } from "@/components/ScenarioIcon";
import { getWebSocketBaseURL } from "@/config/apiConfig";

interface LocationState {
  sessionId: number;
  deviceId: string;
  wsPath: string;
  scenario: Scenario;
  voiceReady?: VoiceReadyStatus;
}

export default function ScenarioDialogue() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [corrections, setCorrections] = useState<string[]>([]);
  const [ending, setEnding] = useState(false);
  const [connectError, setConnectError] = useState("");
  const lastUserRecorded = useRef("");
  const lastAssistantRecorded = useRef("");

  const normalizeText = (s: string) => {
    const t = s.trim();
    if (t.length >= 4 && t.length % 2 === 0) {
      const half = t.length / 2;
      if (t.slice(0, half) === t.slice(half)) return t.slice(0, half);
    }
    return t;
  };

  const persistTurn = useCallback((role: "user" | "assistant", text: string) => {
    const trimmed = normalizeText(text);
    if (!state?.sessionId || !trimmed) return;
    if (role === "user" && trimmed === lastUserRecorded.current) return;
    if (role === "assistant" && trimmed === lastAssistantRecorded.current) return;
    if (role === "user") lastUserRecorded.current = trimmed;
    else lastAssistantRecorded.current = trimmed;
    void recordTurn(state.sessionId, role, trimmed);
  }, [state?.sessionId]);

  const wsUrl = useMemo(() => {
    if (!state?.wsPath) return "";
    const wsBase = getWebSocketBaseURL();
    const host = wsBase.replace(/\/$/, "");
    return `${host}${state.wsPath}`;
  }, [state?.wsPath]);

  const voice = useRealtimeVoice({
    wsUrl,
    onUserText: (text) => persistTurn("user", text),
    onAssistantText: (text) => {
      persistTurn("assistant", text);
      if (text.includes("Better:")) {
        setCorrections((prev) => [...prev.slice(-4), text]);
      }
    },
    onError: (msg) => setConnectError(msg),
    onConnected: () => {
      if (state?.sessionId) void activateSession(state.sessionId);
    },
  });

  useEffect(() => {
    if (!state?.sessionId) {
      navigate("/scenario-dialogues", { replace: true });
      return;
    }
    if (state.voiceReady && !state.voiceReady.ready) {
      setConnectError(state.voiceReady.hint || "语音服务未配置");
      return;
    }
    setConnectError("");
    voice.connect();
    return () => voice.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.sessionId]);

  const handleEnd = async () => {
    if (!state || ending) return;
    setEnding(true);
    voice.disconnect();
    try {
      const res = await completeSession(state.sessionId);
      if (res.code === 200) {
        navigate(`/scenario-review/${state.sessionId}`, { replace: true });
      }
    } finally {
      setEnding(false);
    }
  };

  if (!state) return null;

  const statusLabel: Record<string, string> = {
    idle: "准备中",
    connecting: "连接中...",
    connected: "对话中 — 请开口说话",
    disconnected: "已断开",
    error: "连接失败",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FAF9] to-[#F7F9FC] flex flex-col">
      <div className="bg-white/80 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} className="text-[#2D3748]" />
          </button>
          <div className="flex-1 text-center -ml-10">
            <h1 className="text-lg font-semibold text-[#2D3748] flex items-center justify-center gap-2">
              <ScenarioIcon name={state.scenario.icon} size={20} className="text-[#4ECDC4]" />
              {state.scenario.name}
            </h1>
            <p className="text-xs text-[#718096]">{statusLabel[voice.status]}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {(connectError || voice.status === "error") && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <p className="text-sm font-medium text-red-700 mb-2">语音连接失败</p>
            <p className="text-xs text-red-600 whitespace-pre-wrap">
              {connectError || "realtime init failed"}
            </p>
            <p className="text-xs text-red-500 mt-2">
              请在后端设置环境变量后重启服务，例如：
              <br />
              <code className="bg-red-100 px-1 rounded">export REALTIME_API_KEY=sk-你的DashScope密钥</code>
              <br />
              或 <code className="bg-red-100 px-1 rounded">REALTIME_CONFIG_JSON</code>
            </p>
            <button
              onClick={() => { setConnectError(""); voice.connect(); }}
              className="mt-3 text-sm text-red-700 underline"
            >
              重试连接
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-[#55A3FF]" />
            <span className="text-sm font-medium text-[#718096]">你说</span>
          </div>
          <p className="text-[#2D3748] min-h-[2rem]">{voice.userText || "..."}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#66BB6A]/30">
          <div className="flex items-center gap-2 mb-2">
            <Mic size={16} className="text-[#66BB6A]" />
            <span className="text-sm font-medium text-[#718096]">AI 陪练</span>
          </div>
          <p className="text-[#2D3748] min-h-[2rem] whitespace-pre-wrap">{voice.assistantText || "..."}</p>
        </div>

        {corrections.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <p className="text-sm font-medium text-amber-700 mb-2">实时纠错</p>
            {corrections.map((c, i) => (
              <p key={i} className="text-xs text-amber-800 mb-1 line-clamp-3">{c}</p>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-[#E2E8F0] px-6 py-5">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={voice.interrupt}
            disabled={!voice.isConnected}
            className="p-4 rounded-full bg-[#55A3FF]/10 text-[#55A3FF] disabled:opacity-40"
            title="打断 AI"
          >
            <MicOff size={24} />
          </button>

          <button
            onClick={handleEnd}
            disabled={ending}
            className="p-5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 disabled:opacity-60"
            title="结束对话"
          >
            <PhoneOff size={28} />
          </button>

          <div className={`p-4 rounded-full ${voice.isConnected ? "bg-[#66BB6A]/10 text-[#66BB6A] animate-pulse" : "bg-gray-100 text-gray-400"}`}>
            <Mic size={24} />
          </div>
        </div>
        <p className="text-center text-xs text-[#A0AEC0] mt-3">
          {ending ? "正在生成复盘..." : "点击红色按钮结束并查看复盘报告"}
        </p>
      </div>
    </div>
  );
}
