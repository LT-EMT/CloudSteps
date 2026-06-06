import { useState, useEffect, useRef } from 'react';

export default function DigitalHuman() {
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-white">
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

      {/* iframe 嵌入数字人页面 */}
      <div className="pt-16 h-screen">
        {loading && (
          <div className="absolute inset-0 pt-16 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        )}
        <iframe
          src="http://localhost:8880/sentio"
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          allow="microphone; camera"
        />
      </div>
    </div>
  );
}
