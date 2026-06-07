# 部署配置指南

## 🔴 常见问题：Mixed Content 错误

### 问题描述
```
Mixed Content: The page at 'https://h5.lingecho.com/scenario-dialogue' was loaded over HTTPS, 
but attempted to connect to the insecure WebSocket endpoint 'ws://api/voice/CloudStepsGo/v1/'. 
This request has been blocked; this endpoint must be available over WSS.
```

### 原因
- 前端页面使用 HTTPS 加载
- WebSocket 连接使用不安全的 WS 协议
- 浏览器安全策略阻止了混合内容

### ✅ 解决方案

#### 方案 1：设置环境变量（推荐）

**开发环境** (`.env.local`)：
```env
VITE_API_BASE_URL=http://localhost:7080/api
VITE_WS_BASE_URL=ws://localhost:7080
```

**生产环境** (`.env.production`)：
```env
VITE_API_BASE_URL=https://api.lingecho.com/api
VITE_WS_BASE_URL=wss://api.lingecho.com
```

#### 方案 2：自动转换（如果 API 和 WebSocket 同域）

**生产环境** (`.env.production`)：
```env
VITE_API_BASE_URL=https://api.lingecho.com/api
# 不设置 VITE_WS_BASE_URL，会自动转换为 wss://api.lingecho.com
```

#### 方案 3：使用相对路径

**生产环境** (`.env.production`)：
```env
VITE_API_BASE_URL=/api
VITE_WS_BASE_URL=wss://api.lingecho.com
```

---

## 🔧 配置详解

### 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | API 基础 URL | `https://api.lingecho.com/api` |
| `VITE_WS_BASE_URL` | WebSocket 基础 URL（可选） | `wss://api.lingecho.com` |

### 自动转换规则

如果不设置 `VITE_WS_BASE_URL`，会自动从 `VITE_API_BASE_URL` 转换：

```
http://localhost:7080/api  → ws://localhost:7080
https://api.lingecho.com/api → wss://api.lingecho.com
```

### 前端构建流程

```
1. 读取环境变量
   ↓
2. 如果设置了 VITE_WS_BASE_URL，使用它
   否则从 VITE_API_BASE_URL 自动转换
   ↓
3. 后端返回 wsPath: /api/voice/CloudStepsGo/v1/?device-id=cs-2-12
   ↓
4. 前端构建完整 URL: {wsBaseURL}{wsPath}
   ↓
5. 连接 WebSocket
```

---

## 📋 部署检查清单

### ✅ 开发环境
- [ ] 设置 `VITE_API_BASE_URL=http://localhost:7080/api`
- [ ] 设置 `VITE_WS_BASE_URL=ws://localhost:7080`
- [ ] 运行 `npm run dev` 测试

### ✅ 生产环境
- [ ] 设置 `VITE_API_BASE_URL=https://api.lingecho.com/api`
- [ ] 设置 `VITE_WS_BASE_URL=wss://api.lingecho.com`
- [ ] 确保后端支持 WSS（WebSocket Secure）
- [ ] 运行 `npm run build` 构建
- [ ] 部署到 CDN 或服务器
- [ ] 测试 WebSocket 连接

### ✅ 后端配置
- [ ] 配置 HTTPS 证书
- [ ] 启用 WSS 支持
- [ ] 配置 CORS（如需跨域）
- [ ] 配置反向代理（如使用 Nginx）

---

## 🔒 Nginx 反向代理配置

如果使用 Nginx 作为反向代理，需要配置 WebSocket 支持：

```nginx
server {
    listen 443 ssl http2;
    server_name api.lingecho.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # API 路由
    location /api/ {
        proxy_pass http://backend:7080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 路由
    location /api/voice/CloudStepsGo/v1/ {
        proxy_pass http://backend:7080;
        
        # WebSocket 特殊配置
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 其他必要的头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # AI Interview WebSocket 路由
    location /api/ws/realtime/ai-interview {
        proxy_pass http://backend:7080;
        
        # WebSocket 特殊配置
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 其他必要的头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

---

## 🧪 测试 WebSocket 连接

### 使用浏览器控制台测试

```javascript
// 测试 WSS 连接
const ws = new WebSocket('wss://api.lingecho.com/api/voice/CloudStepsGo/v1/?device-id=cs-2-12');

ws.onopen = () => {
    console.log('✅ WebSocket 连接成功');
    ws.send(JSON.stringify({
        type: 'hello',
        version: 1,
        transport: 'websocket'
    }));
};

ws.onmessage = (event) => {
    console.log('📨 收到消息:', event.data);
};

ws.onerror = (error) => {
    console.error('❌ WebSocket 错误:', error);
};

ws.onclose = () => {
    console.log('🔌 WebSocket 已关闭');
};
```

### 使用 curl 测试

```bash
# 使用 websocat 工具测试
websocat 'wss://api.lingecho.com/api/voice/CloudStepsGo/v1/?device-id=cs-2-12'
```

---

## 📊 常见配置场景

### 场景 1：同域部署（推荐）
```
前端：https://h5.lingecho.com
后端：https://h5.lingecho.com/api
WebSocket：wss://h5.lingecho.com/api/voice/...

配置：
VITE_API_BASE_URL=https://h5.lingecho.com/api
# 不需要设置 VITE_WS_BASE_URL，会自动转换
```

### 场景 2：分离部署
```
前端：https://h5.lingecho.com
后端：https://api.lingecho.com
WebSocket：wss://api.lingecho.com

配置：
VITE_API_BASE_URL=https://api.lingecho.com/api
VITE_WS_BASE_URL=wss://api.lingecho.com
```

### 场景 3：本地开发
```
前端：http://localhost:5173
后端：http://localhost:7080
WebSocket：ws://localhost:7080

配置：
VITE_API_BASE_URL=http://localhost:7080/api
VITE_WS_BASE_URL=ws://localhost:7080
```

---

## 🚀 快速部署步骤

### 1. 准备环境文件

创建 `.env.production`：
```env
VITE_API_BASE_URL=https://api.lingecho.com/api
VITE_WS_BASE_URL=wss://api.lingecho.com
VITE_VIDEO_PROVIDER=replicate
VITE_REPLICATE_API_KEY=your_key_here
```

### 2. 构建前端

```bash
cd web
npm install
npm run build
```

### 3. 部署到服务器

```bash
# 上传 dist 目录到 CDN 或 Web 服务器
scp -r dist/* user@server:/var/www/h5.lingecho.com/
```

### 4. 验证部署

```bash
# 检查 WebSocket 连接
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://api.lingecho.com/api/voice/CloudStepsGo/v1/?device-id=cs-2-12
```

---

## 📝 故障排除

### 问题：WSS 连接被拒绝
**原因**：后端未配置 HTTPS/WSS
**解决**：配置 SSL 证书，启用 HTTPS

### 问题：连接超时
**原因**：防火墙阻止、代理配置错误
**解决**：检查防火墙规则、Nginx 配置

### 问题：Mixed Content 错误
**原因**：HTTPS 页面连接 WS（不安全）
**解决**：使用 WSS（安全 WebSocket）

### 问题：CORS 错误
**原因**：跨域请求被阻止
**解决**：配置后端 CORS 头

---

## 📚 相关文档

- [WebSocket 安全最佳实践](https://owasp.org/www-community/attacks/websocket)
- [Nginx WebSocket 配置](https://nginx.org/en/docs/http/websocket.html)
- [浏览器混合内容政策](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)
