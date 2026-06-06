# 端到端实时延迟监测

## 📊 功能概述

在场景对话页面中添加了实时延迟监测功能，可以直观地显示语音交互的各个环节的延迟情况。

## 🎯 监测指标

### 1. **用户→AI 延迟** (User to AI Latency)
- **定义**：用户说话到 AI 开始回应的时间差
- **测量方式**：
  - 用户说话时（STT 消息到达）记录时间戳
  - AI 开始回应时（LLM_RESPONSE 消息到达）记录时间戳
  - 计算两者的差值
- **典型范围**：500-2000ms
- **影响因素**：
  - 语音识别延迟
  - AI 推理延迟
  - 网络延迟

### 2. **网络延迟** (Network Latency)
- **定义**：WebSocket 消息从服务器发送到客户端的往返延迟
- **测量方式**：
  - 每条消息都包含服务器时间戳
  - 客户端记录接收时间
  - 计算差值（接收时间 - 服务器时间戳）
  - 保留最近 20 个样本，计算平均值
- **典型范围**：10-100ms
- **影响因素**：
  - 网络质量
  - 地理距离
  - ISP 性能

### 3. **音频播放延迟** (Audio Playback Latency)
- **定义**：TTS 开始播放到实际播放的延迟
- **测量方式**：
  - TTS 开始时（tts state=start）记录时间戳
  - 计算当前时间与该时间戳的差值
- **典型范围**：0-500ms
- **影响因素**：
  - 音频缓冲
  - 浏览器处理速度
  - 系统负载

### 4. **总延迟** (Total Latency)
- **定义**：用户说话到 AI 音频开始播放的总延迟
- **计算方式**：`总延迟 = 用户→AI延迟 + 网络延迟 + 音频播放延迟`
- **典型范围**：1000-3000ms
- **用户体验**：
  - < 1000ms：非常流畅
  - 1000-2000ms：流畅
  - 2000-3000ms：可接受
  - > 3000ms：明显延迟

## 🔧 技术实现

### 前端实现

#### 1. Hook 中的延迟跟踪

**文件**：`web/src/hooks/useRealtimeVoice.ts`

```typescript
// 延迟监测引用
const latencyMetricsRef = useRef<LatencyMetrics>({})
const userSpeechStartTimeRef = useRef<number>(0)
const aiResponseStartTimeRef = useRef<number>(0)
const audioPlaybackStartTimeRef = useRef<number>(0)
const networkLatencySamplesRef = useRef<number[]>([])
```

#### 2. 延迟计算函数

```typescript
const updateLatencyMetrics = useCallback(() => {
  const now = Date.now()
  const metrics: LatencyMetrics = {}
  
  // 计算用户→AI延迟
  if (userSpeechStartTimeRef.current > 0 && aiResponseStartTimeRef.current > 0) {
    metrics.userToAILatency = aiResponseStartTimeRef.current - userSpeechStartTimeRef.current
  }
  
  // 计算网络延迟（平均值）
  if (networkLatencySamplesRef.current.length > 0) {
    const sum = networkLatencySamplesRef.current.reduce((a, b) => a + b, 0)
    metrics.networkLatency = Math.round(sum / networkLatencySamplesRef.current.length)
  }
  
  // 计算音频播放延迟
  if (audioPlaybackStartTimeRef.current > 0) {
    metrics.audioPlaybackLatency = now - audioPlaybackStartTimeRef.current
  }
  
  // 计算总延迟
  if (userSpeechStartTimeRef.current > 0 && audioPlaybackStartTimeRef.current > 0) {
    metrics.totalLatency = audioPlaybackStartTimeRef.current - userSpeechStartTimeRef.current
  }
  
  latencyMetricsRef.current = metrics
  onLatencyUpdate?.(metrics)
}, [onLatencyUpdate])
```

#### 3. 消息处理中的时间戳记录

```typescript
case 'stt': {
  const text = String(msg.text || '')
  if (text && userSpeechStartTimeRef.current === 0) {
    // 记录用户开始说话的时间
    userSpeechStartTimeRef.current = Date.now()
  }
  // ...
}

case 'llm_response': {
  const text = String(msg.text || '')
  if (text && aiResponseStartTimeRef.current === 0) {
    // 记录 AI 开始回应的时间
    aiResponseStartTimeRef.current = Date.now()
    updateLatencyMetrics()
  }
  // ...
}

case 'tts':
  if (msg.state === 'start') {
    audioPlaybackStartTimeRef.current = Date.now()
    updateLatencyMetrics()
  }
  break
```

#### 4. 网络延迟测量

```typescript
ws.onmessage = (ev) => {
  const receiveTime = Date.now()
  if (typeof ev.data === 'string') {
    try {
      const msg = JSON.parse(ev.data)
      if (msg.timestamp) {
        const latency = receiveTime - msg.timestamp
        networkLatencySamplesRef.current.push(latency)
        // 保留最近 20 个样本
        if (networkLatencySamplesRef.current.length > 20) {
          networkLatencySamplesRef.current.shift()
        }
      }
    } catch {
      // 忽略解析错误
    }
    handleText(ev.data)
  }
}
```

### UI 显示

**文件**：`web/src/pages/ScenarioDialogue.tsx`

```typescript
{voice.isConnected && (latency.userToAILatency || latency.networkLatency || latency.totalLatency) && (
  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
    <div className="flex items-center gap-2 mb-3">
      <Activity size={16} className="text-blue-600" />
      <p className="text-sm font-medium text-blue-700">端到端延迟监测</p>
    </div>
    <div className="grid grid-cols-2 gap-3 text-xs">
      {latency.userToAILatency !== undefined && (
        <div className="bg-white rounded p-2">
          <p className="text-blue-600 font-medium">用户→AI</p>
          <p className="text-blue-800 font-semibold">{latency.userToAILatency}ms</p>
        </div>
      )}
      {/* 其他指标... */}
    </div>
  </div>
)}
```

## 📈 性能分析

### 延迟分解

典型的对话延迟分解：

```
总延迟 (2000ms)
├── 用户→AI延迟 (1200ms)
│   ├── 语音识别 (400ms)
│   ├── AI推理 (600ms)
│   └── 网络传输 (200ms)
├── 网络延迟 (50ms)
└── 音频播放延迟 (750ms)
    ├── TTS生成 (500ms)
    └── 音频缓冲 (250ms)
```

### 优化建议

#### 1. 降低用户→AI延迟
- ✅ 使用流式语音识别（减少等待完整句子）
- ✅ 优化 AI 模型推理速度
- ✅ 使用 CDN 加速网络传输

#### 2. 降低网络延迟
- ✅ 使用更近的服务器节点
- ✅ 启用 WebSocket 压缩
- ✅ 优化消息大小

#### 3. 降低音频播放延迟
- ✅ 预加载音频缓冲
- ✅ 优化 TTS 生成速度
- ✅ 使用硬件加速

## 🎯 使用场景

### 1. 性能监控
- 实时监控系统性能
- 识别性能瓶颈
- 优化用户体验

### 2. 网络诊断
- 检测网络质量
- 识别网络问题
- 调整连接参数

### 3. 用户体验评估
- 评估对话流畅度
- 比较不同网络环境
- 收集用户反馈

## 📊 数据收集

### 可选的数据收集

可以在会话完成时收集延迟数据用于分析：

```typescript
// 在会话完成时
const latencyStats = {
  avgUserToAILatency: calculateAverage(userToAILatencies),
  avgNetworkLatency: calculateAverage(networkLatencies),
  avgAudioPlaybackLatency: calculateAverage(audioPlaybackLatencies),
  avgTotalLatency: calculateAverage(totalLatencies),
  maxLatency: Math.max(...totalLatencies),
  minLatency: Math.min(...totalLatencies),
}

// 发送到后端用于分析
await fetch('/api/scenario-dialogue/sessions/{id}/latency-stats', {
  method: 'POST',
  body: JSON.stringify(latencyStats)
})
```

## 🔍 调试技巧

### 1. 查看浏览器控制台

```javascript
// 在浏览器控制台中查看延迟指标
console.log(voice.latencyMetrics)
```

### 2. 监控网络延迟

```javascript
// 查看网络延迟样本
console.log('Network latency samples:', networkLatencySamplesRef.current)
```

### 3. 分析延迟趋势

```javascript
// 记录每次对话的延迟
const latencyHistory = []
onLatencyUpdate = (metrics) => {
  latencyHistory.push(metrics)
  console.log('Latency history:', latencyHistory)
}
```

## 📝 总结

**端到端延迟监测功能提供了：**

✅ **实时监测** - 对话过程中实时显示延迟  
✅ **多维度指标** - 用户→AI、网络、音频播放、总延迟  
✅ **网络采样** - 基于多个样本的平均网络延迟  
✅ **可视化展示** - 在对话页面直观显示延迟信息  
✅ **性能分析** - 帮助识别性能瓶颈  

**这个功能对于：**
- 🎯 优化系统性能
- 🎯 诊断网络问题
- 🎯 评估用户体验
- 🎯 收集性能数据

都非常有价值！
