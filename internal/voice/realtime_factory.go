package voice

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/LingByte/CloudStepsGo/internal/models"
	"github.com/LingByte/CloudStepsGo/pkg/logger"
	"github.com/LingByte/CloudStepsGo/pkg/utils"
	"github.com/LingByte/lingllm/realtime"
	_ "github.com/LingByte/lingllm/realtime/aliyunomni"
	_ "github.com/LingByte/lingllm/realtime/volcdialogue"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// SessionContext holds per-connection scenario dialogue state.
type SessionContext struct {
	SessionID    uint
	UserID       uint
	SystemPrompt string
	OnTurn       func(role, content string, hasCorrection, hasPronunciation bool)
}

var pendingDeviceID atomic.Value // string, set per incoming WS before upgrade

// SetPendingDeviceID marks the next WS connection's device-id (xiaozhi calls NewAgent before OnSessionStart).
func SetPendingDeviceID(deviceID string) {
	pendingDeviceID.Store(strings.TrimSpace(deviceID))
}

// RealtimeFactory creates lingllm realtime agents for scenario dialogue.
type RealtimeFactory struct {
	db       *gorm.DB
	sessions sync.Map // sessionID(uint) -> *SessionContext
	callMap  sync.Map // callID(string) -> sessionID(uint)
}

func NewRealtimeFactory(db *gorm.DB) *RealtimeFactory {
	return &RealtimeFactory{db: db}
}

// RegisterSession stores session context for WS attach.
func (f *RealtimeFactory) RegisterSession(ctx *SessionContext) {
	f.sessions.Store(ctx.SessionID, ctx)
}

// BindCall associates a xiaozhi callID with a session.
func (f *RealtimeFactory) BindCall(callID string, sessionID uint) {
	f.callMap.Store(callID, sessionID)
}

// UnregisterSession removes session context after WS teardown.
func (f *RealtimeFactory) UnregisterSession(sessionID uint) {
	f.sessions.Delete(sessionID)
}

// UnregisterCall removes call mapping and session context.
func (f *RealtimeFactory) UnregisterCall(callID string) {
	if v, ok := f.callMap.Load(callID); ok {
		f.sessions.Delete(v.(uint))
		f.callMap.Delete(callID)
	}
}

// NewAgent implements xiaozhi.RealtimeAgentFactory.
func (f *RealtimeFactory) NewAgent(ctx context.Context, callID string, onEvent func(realtime.Event)) (realtime.Agent, int, int, error) {
	sessionCtx := f.resolveSession(callID)
	if sessionCtx == nil {
		if v := pendingDeviceID.Load(); v != nil {
			if deviceID, ok := v.(string); ok && deviceID != "" {
				if _, sessionID, ok2 := ParseDeviceSessionID(deviceID); ok2 {
					if ctxVal, ok3 := f.sessions.Load(sessionID); ok3 {
						sessionCtx = ctxVal.(*SessionContext)
						f.BindCall(callID, sessionID)
					}
				}
			}
		}
	}
	systemPrompt := defaultSystemPrompt()
	if sessionCtx != nil && sessionCtx.SystemPrompt != "" {
		systemPrompt = sessionCtx.SystemPrompt
	}

	ready := CheckReady()
	if !ready.Ready {
		setLastInitError(ready.Hint)
		return nil, 0, 0, fmt.Errorf("%s", ready.Hint)
	}

	cfg, err := LoadRealtimeConfig()
	if err != nil {
		return nil, 0, 0, err
	}

	inSR := int(utils.GetIntEnvWithDefault("REALTIME_INPUT_SR", 16000))
	outSR := int(utils.GetIntEnvWithDefault("REALTIME_OUTPUT_SR", 24000))
	voice := strings.TrimSpace(utils.GetEnv("REALTIME_VOICE"))
	if voice == "" {
		voice = "Cherry"
	}

	var turnUser strings.Builder
	var turnAssistant strings.Builder

	agent, err := realtime.NewAgentFromCredential(cfg, realtime.Options{
		SystemPrompt:     systemPrompt,
		Voice:            voice,
		InputSampleRate:  inSR,
		OutputSampleRate: outSR,
		OnEvent: func(ev realtime.Event) {
			if sessionCtx != nil {
				f.handleSessionEvent(sessionCtx, ev, &turnUser, &turnAssistant)
			}
			if onEvent != nil {
				onEvent(ev)
			}
		},
	})
	if err != nil {
		logger.Lg.Error("realtime NewAgentFromCredential failed", zap.Error(err))
		setLastInitError(err.Error())
		return nil, 0, 0, err
	}
	if err := agent.Start(ctx); err != nil {
		logger.Lg.Error("realtime agent Start failed", zap.Error(err))
		setLastInitError(err.Error())
		return nil, 0, 0, err
	}
	setLastInitError("")
	return agent, inSR, outSR, nil
}

var lastInitError atomic.Value

func setLastInitError(msg string) {
	lastInitError.Store(msg)
}

// GetLastInitError returns the latest realtime init failure message.
func GetLastInitError() string {
	if v := lastInitError.Load(); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func (f *RealtimeFactory) resolveSession(callID string) *SessionContext {
	if v, ok := f.callMap.Load(callID); ok {
		if ctx, ok2 := f.sessions.Load(v.(uint)); ok2 {
			return ctx.(*SessionContext)
		}
	}
	return nil
}

func (f *RealtimeFactory) handleSessionEvent(ctx *SessionContext, ev realtime.Event, turnUser, turnAssistant *strings.Builder) {
	switch ev.Type {
	case realtime.EventUserTranscript:
		if ev.Final {
			text := strings.TrimSpace(ev.Text)
			if text != "" {
				turnUser.Reset()
				turnUser.WriteString(text)
				if ctx.OnTurn != nil {
					ctx.OnTurn("user", text, false, false)
				}
			}
		}
	case realtime.EventAssistantText:
		if ev.Text != "" {
			turnAssistant.WriteString(ev.Text)
		}
		if ev.Final {
			turnAssistant.Reset()
		}
	case realtime.EventAssistantTurnEnd:
		turnAssistant.Reset()
	case realtime.EventSessionOpen:
		if ctx.SessionID > 0 {
			now := time.Now().UTC()
			_ = f.db.Model(&models.ScenarioDialogueSession{}).
				Where("id = ? AND status = ?", ctx.SessionID, models.ScenarioSessionStatusPending).
				Updates(map[string]any{
					"status":     models.ScenarioSessionStatusActive,
					"started_at": now,
				}).Error
			_ = f.db.Model(&models.ScenarioDialogueSession{}).
				Where("id = ? AND status = ? AND started_at IS NULL", ctx.SessionID, models.ScenarioSessionStatusActive).
				Update("started_at", now).Error
		}
	}
}

func defaultSystemPrompt() string {
	prompt := strings.TrimSpace(utils.GetEnv("REALTIME_SYSTEM_PROMPT"))
	if prompt != "" {
		return prompt
	}
	return "You are a helpful English conversation partner for Chinese learners. " +
		"Correct grammar inline with '✓ Better: ...' and pronunciation with '🔊 Pronunciation: ...'. " +
		"Keep replies short for voice conversation."
}

// ParseDeviceSessionID extracts session ID from device-id query: cs-{userId}-{sessionId}
func ParseDeviceSessionID(deviceID string) (userID, sessionID uint, ok bool) {
	deviceID = strings.TrimSpace(deviceID)
	if !strings.HasPrefix(deviceID, "cs-") {
		return 0, 0, false
	}
	parts := strings.Split(deviceID, "-")
	if len(parts) < 3 {
		return 0, 0, false
	}
	uid, err1 := strconv.ParseUint(parts[1], 10, 64)
	sid, err2 := strconv.ParseUint(parts[len(parts)-1], 10, 64)
	if err1 != nil || err2 != nil {
		return 0, 0, false
	}
	return uint(uid), uint(sid), true
}

// LogRealtimeConfig logs warnings if realtime is not configured.
func LogRealtimeConfig(lg *zap.Logger) {
	ready := CheckReady()
	if !ready.Ready {
		lg.Warn("realtime voice not configured — scenario dialogue will fail",
			zap.String("hint", ready.Hint),
			zap.String("example", `export REALTIME_API_KEY=sk-xxx  # 或 REALTIME_CONFIG_JSON='{"provider":"aliyun_omni","api_key":"sk-..."}'`))
	} else {
		lg.Info("realtime voice ready", zap.String("provider", ready.Provider))
	}
}
