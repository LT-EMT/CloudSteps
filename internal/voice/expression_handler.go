package voice

import (
	"encoding/json"
	"sync"
)

// ExpressionMessage 表情数据消息
type ExpressionMessage struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

// ExpressionHandler 处理表情数据的消息处理器
type ExpressionHandler struct {
	sessionMap sync.Map // callID -> *SessionContext
}

// NewExpressionHandler 创建新的表情处理器
func NewExpressionHandler() *ExpressionHandler {
	return &ExpressionHandler{}
}

// RegisterSession 注册会话
func (eh *ExpressionHandler) RegisterSession(callID string, sessionCtx *SessionContext) {
	eh.sessionMap.Store(callID, sessionCtx)
}

// UnregisterSession 注销会话
func (eh *ExpressionHandler) UnregisterSession(callID string) {
	eh.sessionMap.Delete(callID)
}

// HandleMessage 处理消息，如果是表情消息则返回 true
func (eh *ExpressionHandler) HandleMessage(callID string, data []byte) bool {
	// 尝试解析为表情消息
	var msg ExpressionMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return false
	}
	
	// 检查是否是表情消息
	if msg.Type != "expression" {
		return false
	}
	
	// 获取会话并更新表情数据
	if v, ok := eh.sessionMap.Load(callID); ok {
		if sessionCtx, ok2 := v.(*SessionContext); ok2 {
			sessionCtx.UpdateExpressions(msg.Data)
			return true
		}
	}
	
	return false
}

// GetSessionExpressions 获取会话的表情数据
func (eh *ExpressionHandler) GetSessionExpressions(callID string) string {
	if v, ok := eh.sessionMap.Load(callID); ok {
		if sessionCtx, ok2 := v.(*SessionContext); ok2 {
			return sessionCtx.GetCurrentExpressions()
		}
	}
	return ""
}
