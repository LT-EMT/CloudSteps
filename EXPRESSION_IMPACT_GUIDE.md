# 微表情识别与 AI 回应影响指南

## 📊 当前微表情识别能力

### 识别的微表情类型（共 30+ 种）

#### 1. 嘴部表情 (6 种)
- `mouth_wide_open` - 嘴巴大张
- `mouth_open` - 嘴巴张开
- `mouth_tightly_closed` - 嘴巴紧闭
- `mouth_closed` - 嘴巴闭合
- `surprised` - 惊讶（嘴巴大张）

#### 2. 眉毛表情 (5 种)
- `eyebrow_highly_raised` - 眉毛高抬
- `eyebrow_raised` - 眉毛抬起
- `eyebrow_furrowed` - 眉毛皱起
- `eyebrow_slightly_furrowed` - 眉毛轻微皱起
- `eyebrow_converged` - 眉毛靠近

#### 3. 眼睛表情 (6 种)
- `eyes_wide_open` - 眼睛大睁
- `eyes_open` - 眼睛睁开
- `eyes_squinted` - 眼睛眯起
- `eyes_closed` - 眼睛闭合
- `eyes_asymmetric` - 眼睛不对称

#### 4. 笑容检测 (3 种)
- `big_smile` - 大笑
- `smiling` - 微笑
- `frowning` - 皱眉

#### 5. 头部姿态 (4 种)
- `head_tilted_significantly` - 头部明显倾斜
- `head_tilted` - 头部倾斜
- `head_turned_right` - 头转向右
- `head_turned_left` - 头转向左
- `head_looking_up` - 头向上看
- `head_looking_down` - 头向下看

#### 6. 皱眉 (2 种)
- `frowning_deeply` - 深度皱眉
- `frowning` - 皱眉

#### 7. 嘴角动作 (2 种)
- `mouth_corners_down_significantly` - 嘴角明显下垂
- `mouth_corners_down` - 嘴角下垂

#### 8. 脸部紧张度 (2 种)
- `jaw_clenched` - 下颌紧咬
- `face_tensed` - 脸部紧张

#### 9. 眼神接触 (2 种)
- `eyes_converged` - 眼睛聚焦
- `eyes_looking_away` - 眼睛看向别处

#### 10. 嘴唇颤动 (1 种)
- `lips_trembling` - 嘴唇颤动

---

## 🔄 表情数据流

### 前端流程
```
用户表情 → MediaPipe Face Mesh 检测 → 微表情识别 → WebSocket 发送
```

### 后端接收
```
WebSocket 消息: { type: 'expression', data: 'mouth_open,smiling,eyes_open' }
```

---

## 💡 如何让表情影响 AI 回应

### 方案 1: 修改系统提示（推荐）

在后端的 `realtime_factory.go` 中，修改 `defaultSystemPrompt()` 函数，根据表情数据动态调整系统提示：

```go
func (f *RealtimeFactory) buildSystemPromptWithExpression(basePrompt string, expressions string) string {
    // 解析表情数据
    expList := strings.Split(expressions, ",")
    expMap := make(map[string]bool)
    for _, exp := range expList {
        expMap[strings.TrimSpace(exp)] = true
    }
    
    // 根据表情调整提示
    var adjustments []string
    
    // 检测用户情绪
    if expMap["big_smile"] || expMap["smiling"] {
        adjustments = append(adjustments, "用户看起来很开心，请保持积极和热情的语气。")
    }
    
    if expMap["frowning"] || expMap["frowning_deeply"] {
        adjustments = append(adjustments, "用户看起来有些不满或困惑，请更耐心地解释。")
    }
    
    if expMap["eyes_wide_open"] || expMap["surprised"] {
        adjustments = append(adjustments, "用户看起来很惊讶，请确保你的回答清晰易懂。")
    }
    
    if expMap["eyes_looking_away"] {
        adjustments = append(adjustments, "用户看起来可能不太专注，请尝试吸引他们的注意力。")
    }
    
    if expMap["jaw_clenched"] || expMap["face_tensed"] {
        adjustments = append(adjustments, "用户看起来很紧张，请用更温和和放松的语气。")
    }
    
    if expMap["head_looking_down"] {
        adjustments = append(adjustments, "用户看起来可能在思考或有些害羞，请给他们更多时间。")
    }
    
    // 组合提示
    fullPrompt := basePrompt
    if len(adjustments) > 0 {
        fullPrompt += "\n\n用户当前状态：\n" + strings.Join(adjustments, "\n")
    }
    
    return fullPrompt
}
```

### 方案 2: 创建表情上下文消息

在 WebSocket 消息处理中，将表情数据作为上下文发送给 LLM：

```go
// 在 handleSessionEvent 中处理表情消息
case "expression":
    if sessionCtx != nil {
        expressions := msg["data"].(string)
        // 将表情信息添加到对话上下文
        contextMsg := fmt.Sprintf("[用户表情: %s]", expressions)
        // 可以将此信息传递给 LLM 作为额外上下文
    }
```

### 方案 3: 实时调整 AI 行为

根据表情动态调整：
- **语速**: 用户困惑时放慢语速
- **音调**: 用户开心时提高音调
- **内容深度**: 用户专注时增加复杂度
- **重复**: 用户看起来不理解时重复关键点

---

## 🎯 表情影响的具体场景

### 场景 1: 学习面试
```
用户表情: eyes_wide_open, surprised
AI 调整: 
  - 降低难度
  - 提供更多解释
  - 放慢语速
```

### 场景 2: 日常对话
```
用户表情: big_smile, smiling
AI 调整:
  - 保持热情
  - 增加互动
  - 使用更多表情词汇
```

### 场景 3: 困难问题
```
用户表情: frowning, jaw_clenched, face_tensed
AI 调整:
  - 更温和的语气
  - 提供更多帮助
  - 建议休息或换个话题
```

### 场景 4: 注意力不集中
```
用户表情: eyes_looking_away, head_looking_down
AI 调整:
  - 提出问题吸引注意
  - 增加互动性
  - 简化内容
```

---

## 🔧 实现步骤

### 1. 后端修改

在 `internal/voice/realtime_factory.go` 中：

```go
// 添加表情处理
type SessionContext struct {
    SessionID       uint
    UserID          uint
    SystemPrompt    string
    CurrentExpressions string  // 新增
    OnTurn          func(role, content string, hasCorrection, hasPronunciation bool)
}

// 修改 NewAgent 函数，根据表情调整 SystemPrompt
func (f *RealtimeFactory) NewAgent(ctx context.Context, callID string, onEvent func(realtime.Event)) (realtime.Agent, int, int, error) {
    // ... 现有代码 ...
    
    systemPrompt := defaultSystemPrompt()
    if sessionCtx != nil && sessionCtx.SystemPrompt != "" {
        systemPrompt = sessionCtx.SystemPrompt
    }
    
    // 如果有表情数据，调整提示
    if sessionCtx != nil && sessionCtx.CurrentExpressions != "" {
        systemPrompt = f.buildSystemPromptWithExpression(systemPrompt, sessionCtx.CurrentExpressions)
    }
    
    // ... 继续 ...
}
```

### 2. 处理表情消息

在 WebSocket 消息处理中添加表情处理逻辑。

### 3. 测试

使用不同的表情测试 AI 是否做出相应调整。

---

## 📈 未来增强

### 可以添加的功能
1. **表情历史追踪** - 记录用户表情变化趋势
2. **情绪评分** - 计算用户的整体情绪评分
3. **表情一致性检测** - 检测表情与语言的一致性
4. **疲劳检测** - 识别用户是否疲劳
5. **信心评估** - 根据表情评估用户的信心水平
6. **个性化调整** - 根据用户的表情习惯进行个性化调整

---

## 🎓 示例：完整的表情影响流程

```
1. 用户开始对话
   ↓
2. 前端检测用户表情：mouth_open, eyes_wide_open, surprised
   ↓
3. WebSocket 发送: { type: 'expression', data: 'mouth_open,eyes_wide_open,surprised' }
   ↓
4. 后端接收表情数据
   ↓
5. 后端调整系统提示：
   "用户看起来很惊讶，请确保你的回答清晰易懂。"
   ↓
6. AI 生成回应时考虑用户的惊讶情绪
   ↓
7. AI 回应：
   "我理解你可能对这个概念感到惊讶。让我用更简单的方式解释..."
   ↓
8. 用户看到 AI 的理解和调整，体验更好
```

---

## 📝 总结

- ✅ 前端已实现 30+ 种微表情识别
- ✅ 表情数据通过 WebSocket 实时发送
- ⏳ 后端需要实现表情数据处理和 AI 调整逻辑
- 🎯 目标：让 AI 根据用户表情做出更自然、更有同理心的回应
