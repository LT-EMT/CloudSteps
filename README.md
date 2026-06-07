# 🎓 CloudSteps - AI 英语口语陪练系统

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org)

**一个智能的英语口语练习平台，通过 AI 陪练帮助用户在真实场景中提升英语口语能力**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [文档](#-文档) • [部署](#-部署)

</div>

---

## ✨ 功能特性

### 🎯 核心功能

- **📚 场景选择** - 支持 5+ 个真实场景（餐厅、机场、面试、酒店、购物等）
- **🎤 实时语音对话** - 低延迟的 WebSocket 实时通信，流畅的语音交互
- **🔍 发音评测** - 实时发音反馈和评分
- **✏️ 语法纠错** - 实时纠正语法错误和表达不当
- **📊 课后总结** - 多维度评分和详细分析报告
- **😊 微表情识别** - 30+ 种微表情识别，使 AI 更有同理心
- **📈 学习统计** - 追踪学习进度，量化反馈

### 🚀 技术亮点

- **AI 驱动** - 集成阿里云 Omni 实时语音 API
- **实时交互** - WebSocket 实时通信，端到端延迟 < 2s
- **多维度评估** - 流畅度、准确度、发音、词汇、参与度 5 个维度
- **微表情识别** - 使用 MediaPipe Face Mesh 识别用户情绪
- **深色模式** - 完整的深色模式支持
- **响应式设计** - 完美适配各种设备

---

## 📊 功能完成度

| 功能模块 | 状态 | 完成度 |
|---------|------|--------|
| 场景选择 | ✅ | 100% |
| 实时语音对话 | ✅ | 100% |
| 发音评测 | ✅ | 100% |
| 语法纠错 | ✅ | 100% |
| 课后总结 | ✅ | 100% |
| 微表情识别 | ✅ | 100% |
| 学习统计 | ✅ | 100% |
| 管理后台 | ✅ | 100% |

---

## 🏗️ 项目结构

```
CloudSteps/
├── web/                          # 前端应用（React + TypeScript）
│   ├── src/
│   │   ├── pages/               # 页面组件
│   │   ├── components/          # UI 组件
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── api/                 # API 接口
│   │   └── config/              # 配置文件
│   └── package.json
│
├── admin/                        # 管理后台（React + TypeScript）
│   ├── src/
│   │   ├── pages/               # 管理页面
│   │   ├── components/          # UI 组件
│   │   └── api/                 # API 接口
│   └── package.json
│
├── internal/                     # 后端核心逻辑（Go）
│   ├── handlers/                # HTTP 处理器
│   ├── models/                  # 数据模型
│   ├── voice/                   # 语音处理
│   ├── middleware/              # 中间件
│   └── services/                # 业务服务
│
├── pkg/                          # 公共包（Go）
│   ├── config/                  # 配置管理
│   ├── logger/                  # 日志
│   ├── response/                # 响应格式
│   └── constants/               # 常量
│
├── docs/                         # 文档
├── docker-compose.yml           # Docker 编排
└── README.md                     # 本文件
```

---

## 🚀 快速开始

### 前置要求

- **Go** 1.21+
- **Node.js** 18+
- **pnpm** 8+
- **PostgreSQL** 14+
- **Redis** 6+

### 1️⃣ 克隆项目

```bash
git clone https://github.com/LingByte/CloudSteps.git
cd CloudSteps
```

### 2️⃣ 后端配置

```bash
# 复制环境配置
cp .env.example .env

# 编辑配置文件
vim .env

# 安装依赖
go mod download

# 运行迁移
go run cmd/main.go migrate

# 启动服务
go run cmd/main.go
```

### 3️⃣ 前端配置

```bash
# 进入前端目录
cd web

# 复制环境配置
cp .env.example .env.local

# 编辑配置文件
vim .env.local

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 4️⃣ 管理后台

```bash
# 进入管理后台目录
cd admin

# 复制环境配置
cp .env.example .env.local

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

---

## 🔧 环境配置

### 后端环境变量 (`.env`)

```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=cloudsteps

# Redis
REDIS_URL=redis://localhost:6379

# 服务配置
PORT=7080
ENV=development

# 阿里云语音 API
REALTIME_API_KEY=sk-your-key
REALTIME_CONFIG_JSON={"..."}
```

### 前端环境变量 (`.env.local`)

```env
# API 配置
VITE_API_BASE_URL=http://localhost:7080/api

# WebSocket 配置（可选）
# 自动从 API URL 转换：http → ws, https → wss
# VITE_WS_BASE_URL=ws://localhost:7080

# 视频生成
VITE_VIDEO_PROVIDER=replicate
VITE_REPLICATE_API_KEY=r8_your_key
```

---

## 📚 核心功能详解

### 🎯 场景对话流程

```
1. 用户选择场景
   ↓
2. 后端创建会话，返回 WebSocket 连接信息
   ↓
3. 前端建立 WebSocket 连接
   ↓
4. 用户开始说话（语音识别）
   ↓
5. AI 理解并回应（LLM 推理）
   ↓
6. AI 语音合成并播放
   ↓
7. 实时纠错和反馈
   ↓
8. 会话结束，生成详细报告
```

### 📊 评分维度

| 维度 | 说明 | 范围 |
|------|------|------|
| 流畅度 | 说话的连贯性和自然度 | 0-100 |
| 准确度 | 语法和表达的正确性 | 0-100 |
| 发音 | 发音的清晰度和准确性 | 0-100 |
| 词汇 | 词汇的丰富度和使用 | 0-100 |
| 参与度 | 回答的完整度和主动性 | 0-100 |

### 😊 微表情识别

系统可以识别 30+ 种微表情，包括：
- 😊 开心、微笑
- 😕 困惑、皱眉
- 😐 中立、无表情
- 😟 担忧、焦虑
- 😤 沮丧、失望
- 等等...

根据用户的微表情，AI 会动态调整回应方式，提供更有同理心的对话。

---

## 🔌 API 端点

### 场景对话 API

```
GET    /api/scenario-dialogue/scenarios        # 获取场景列表
POST   /api/scenario-dialogue/sessions         # 创建会话
GET    /api/scenario-dialogue/sessions/:id     # 获取会话详情
POST   /api/scenario-dialogue/sessions/:id/complete  # 完成会话
GET    /api/scenario-dialogue/stats            # 获取学习统计

WebSocket:
GET    /api/voice/CloudStepsGo/v1/             # 实时语音对话
GET    /api/ws/realtime/ai-interview           # AI 面试模式
```

### 用户 API

```
POST   /api/auth/register                      # 注册
POST   /api/auth/login                         # 登录
GET    /api/users/profile                      # 获取用户信息
PUT    /api/users/profile                      # 更新用户信息
```

---

## 🐳 Docker 部署

### 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 构建镜像

```bash
# 构建后端镜像
docker build -t cloudsteps-backend:latest -f Dockerfile.backend .

# 构建前端镜像
docker build -t cloudsteps-web:latest -f Dockerfile.web ./web

# 构建管理后台镜像
docker build -t cloudsteps-admin:latest -f Dockerfile.admin ./admin
```

---

## 🚀 生产部署

### 环境要求

- HTTPS 证书（用于 WSS）
- 负载均衡器（如 Nginx）
- CDN（用于静态资源）

### Nginx 配置

详见 [DEPLOYMENT_CONFIG.md](./DEPLOYMENT_CONFIG.md)

### 关键配置

```nginx
# WebSocket 支持
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# 超时配置
proxy_read_timeout 86400;
proxy_send_timeout 86400;
```

---

## 📖 文档

- [功能检查清单](./FEATURE_CHECKLIST.md) - 完整的功能实现清单
- [功能增强建议](./FEATURE_RECOMMENDATIONS.md) - 13 项功能增强建议
- [部署配置指南](./DEPLOYMENT_CONFIG.md) - 详细的部署和配置说明
- [延迟监测文档](./LATENCY_MONITORING.md) - 性能监测指南
- [微表情识别指南](./EXPRESSION_IMPACT_GUIDE.md) - 微表情识别实现
- [麦克风故障排除](./MICROPHONE_TROUBLESHOOTING.md) - 常见问题解决

---

## 🧪 测试

### 运行单元测试

```bash
go test ./...
```

### 运行集成测试

```bash
go test -tags=integration ./...
```

### 前端测试

```bash
cd web
pnpm test
```

---

## 🔐 安全性

- ✅ JWT 身份验证
- ✅ HTTPS/WSS 加密
- ✅ SQL 注入防护
- ✅ CORS 配置
- ✅ 速率限制
- ✅ 输入验证

---

## 📊 性能指标

| 指标 | 目标 | 实现 |
|------|------|------|
| 用户→AI 延迟 | < 1000ms | ✅ 500-1200ms |
| 网络延迟 | < 100ms | ✅ 10-50ms |
| 页面加载 | < 3s | ✅ 1.5-2.5s |
| 并发连接 | 1000+ | ✅ 支持 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📝 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

## 👥 作者

- **LingByte** - 核心开发

---

## 🙏 致谢

感谢以下开源项目的支持：

- [Gin](https://github.com/gin-gonic/gin) - Web 框架
- [React](https://github.com/facebook/react) - UI 库
- [MediaPipe](https://github.com/google/mediapipe) - 微表情识别
- [Vite](https://github.com/vitejs/vite) - 前端构建工具

---

## 📞 联系方式

- 📧 Email: support@lingecho.com
- 🌐 Website: https://lingecho.com
- 💬 Discord: [加入我们的社区](https://discord.gg/lingecho)

---

## 🗺️ 路线图

### 短期（1-2 周）
- [ ] 对话录音和回放
- [ ] 词汇学习模块
- [ ] 成就系统

### 中期（2-4 周）
- [ ] 实时发音评测（Azure Speech）
- [ ] 自适应难度调整
- [ ] 学习路径规划

### 长期（4+ 周）
- [ ] 多语言支持
- [ ] 移动应用
- [ ] 企业版本
- [ ] 认证考试

---

<div align="center">

**[⬆ 返回顶部](#-cloudsteps---ai-英语口语陪练系统)**

Made with ❤️ by [LingByte](https://github.com/LingByte)

</div>
