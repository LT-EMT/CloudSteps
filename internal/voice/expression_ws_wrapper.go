package voice

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/LingByte/lingllm/protocol/voice/xiaozhi"
	"go.uber.org/zap"

	"github.com/LingByte/CloudStepsGo/pkg/logger"
)

// ExpressionWSWrapper 包装 xiaozhi 服务器以处理表情消息
type ExpressionWSWrapper struct {
	xiaozhiServer *xiaozhi.Server
	factory       *RealtimeFactory
	mu            sync.RWMutex
}

// NewExpressionWSWrapper 创建新的 WebSocket 包装器
func NewExpressionWSWrapper(xiaozhiServer *xiaozhi.Server, factory *RealtimeFactory) *ExpressionWSWrapper {
	return &ExpressionWSWrapper{
		xiaozhiServer: xiaozhiServer,
		factory:       factory,
	}
}

// Handle 处理 WebSocket 连接，拦截表情消息
func (w *ExpressionWSWrapper) Handle(rw http.ResponseWriter, r *http.Request) {
	// 获取当前的 callID（如果有的话）
	// 注意：这里我们需要在 xiaozhi 处理之前获取 callID
	// 由于 xiaozhi 内部处理 WebSocket 升级，我们需要另一种方式
	
	// 直接调用 xiaozhi 的 Handle 方法
	// 表情消息会通过 WebSocket 发送，但 xiaozhi 不知道如何处理
	// 我们需要在消息层面拦截
	w.xiaozhiServer.Handle(rw, r)
}

// InterceptMessage 拦截并处理消息
// 这个方法需要在 xiaozhi 的消息处理流程中调用
func (w *ExpressionWSWrapper) InterceptMessage(callID string, data []byte) bool {
	// 尝试解析为表情消息
	var msg map[string]interface{}
	if err := json.Unmarshal(data, &msg); err != nil {
		// 不是 JSON 消息，可能是二进制音频数据
		return false
	}
	
	// 检查是否是表情消息
	msgType, ok := msg["type"].(string)
	if !ok || msgType != "expression" {
		return false
	}
	
	// 这是一个表情消息，处理它
	if dataStr, ok := msg["data"].(string); ok {
		// 获取会话并更新表情数据
		if v, ok := w.factory.callMap.Load(callID); ok {
			if sessionID, ok2 := v.(uint); ok2 {
				if sessionCtx, ok3 := w.factory.sessions.Load(sessionID); ok3 {
					if ctx, ok4 := sessionCtx.(*SessionContext); ok4 {
						ctx.UpdateExpressions(dataStr)
						logger.Lg.Info("expression updated",
							zap.String("callID", callID),
											zap.Uint("sessionID", sessionID),
											zap.String("expressions", dataStr))
						return true
					}
				}
			}
		}
	}
	
	return false
}
