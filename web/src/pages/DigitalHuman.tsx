import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentGetDefault, agentCreateConversation, agentStream, ttsInfer, asrInfer } from '@/api/digitalHuman';

export default function DigitalHuman() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputText, setInputText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationIdRef = useRef<string>('');

  useEffect(() => {
    // 初始化数字人服务
    initializeDigitalHuman();
  }, []);

  const initializeDigitalHuman = async () => {
    try {
      // 获取默认 Agent 配置
      const defaultAgent = await agentGetDefault();
      if (defaultAgent.engine) {
        // 创建对话会话
        const conversationId = await agentCreateConversation(defaultAgent.engine, {});
        conversationIdRef.current = conversationId;
        setLoading(false);
      }
    } catch (error) {
      console.error('初始化数字人失败:', error);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      setIsSpeaking(true);
      // 调用 Agent 获取回复
      await agentStream(
        'default',
        {},
        userMessage,
        conversationIdRef.current,
        (event, data) => {
          if (event === 'message') {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                return [...prev.slice(0, -1), { role: 'assistant', content: lastMessage.content + data }];
              }
              return [...prev, { role: 'assistant', content: data }];
            });
          }
        },
        (error) => {
          console.error('Agent stream error:', error);
          setIsSpeaking(false);
        }
      );
      setIsSpeaking(false);
    } catch (error) {
      console.error('发送消息失败:', error);
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // 调用 ASR 进行语音识别
        const text = await asrInfer('default', {}, audioBlob, 'wav', 16000, 2);
        if (text) {
          setInputText(text);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('录音失败:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 顶部导航 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>返回</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">AI 数字人</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="pt-16 h-screen flex flex-col">
        {/* Live2D 渲染区 */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-gradient-to-b from-purple-100 to-blue-100"
          />

          {/* 消息显示 */}
          <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto space-y-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white ml-auto max-w-[80%]'
                    : 'bg-white text-gray-900 mr-auto max-w-[80%]'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
        </div>

        {/* 底部控制区 */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入消息..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={isSpeaking}
              />
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-lg transition-colors ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isSpeaking}
                className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
