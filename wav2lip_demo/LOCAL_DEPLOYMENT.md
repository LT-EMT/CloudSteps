# 本地 Wav2Lip 部署指南

完全本地部署，无需 API Key，支持 GPU 加速。

## 系统要求

- **Python**: 3.8+
- **GPU**: NVIDIA GPU（推荐，CPU 也可以但很慢）
- **CUDA**: 11.0+ （如果使用 GPU）
- **内存**: 至少 8GB RAM

## 安装步骤

### 1. 克隆官方 Wav2Lip 仓库

```bash
cd wav2lip_demo
git clone https://github.com/Rudrabha/Wav2Lip.git
cd Wav2Lip
```

### 2. 创建虚拟环境

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 下载预训练模型

```bash
# 下载 Wav2Lip 模型
mkdir -p checkpoints
wget "https://www.adrianbulat.com/downloads/dlib/mmod_human_face_detector.dat.bz2"
bunzip2 mmod_human_face_detector.dat.bz2

# 下载 Wav2Lip 检查点
# 从这里下载: https://github.com/Rudrabha/Wav2Lip#getting-the-pretrained-model
# 放到 checkpoints/ 目录
```

### 5. 验证安装

```bash
python face_detection/detection/sfd/detect.py
```

## 使用方法

### 方式 1: 命令行推理

```bash
python inference.py \
  --checkpoint_path checkpoints/wav2lip.pth \
  --face input_video.mp4 \
  --audio input_audio.wav \
  --outfile output.mp4
```

### 方式 2: Flask API 服务器

```bash
# 回到 wav2lip_demo 目录
cd ..

# 启动服务器
python local_wav2lip_server.py
```

服务器会在 `http://localhost:5000` 运行。

### 方式 3: 使用 Wrapper 类

```python
from sync_api_wrapper import SyncAPIWrapper

# 注意：这个 wrapper 是为 Sync.so API 设计的
# 对于本地部署，直接使用 Wav2Lip 的 inference.py
```

## API 端点

### 生成视频

```bash
curl -X POST http://localhost:5000/api/video/generate \
  -F "video=@input.mp4" \
  -F "audio=@audio.wav"
```

响应:
```json
{
  "success": true,
  "taskId": "uuid",
  "videoUrl": "/api/video/output/uuid",
  "status": "completed"
}
```

### 获取视频

```bash
curl http://localhost:5000/api/video/output/uuid -o output.mp4
```

### 检查状态

```bash
curl http://localhost:5000/api/video/status/uuid
```

## 性能优化

### 1. GPU 加速

确保 PyTorch 正确安装了 CUDA 支持：

```bash
python -c "import torch; print(torch.cuda.is_available())"
```

如果返回 `False`，重新安装 PyTorch：

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 2. 批处理

对于多个视频，可以使用 `inference.py` 的批处理模式。

### 3. 模型量化

可以使用 INT8 量化减少内存占用（需要修改代码）。

## 常见问题

### Q: 生成速度太慢？
A: 
- 使用 GPU（CUDA）而不是 CPU
- 减小视频分辨率
- 使用更短的视频

### Q: 显存不足？
A:
- 减小 `batch_size`
- 使用模型量化
- 使用更小的视频分辨率

### Q: 人脸检测失败？
A:
- 确保视频中有清晰的人脸
- 尝试调整 `--pads` 参数
- 检查 `mmod_human_face_detector.dat` 是否正确下载

### Q: 音频和视频不同步？
A:
- 检查音频和视频的时长是否匹配
- 尝试调整 `--sync_mode` 参数

## Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/Rudrabha/Wav2Lip.git
WORKDIR /app/Wav2Lip

COPY requirements.txt .
RUN pip install -r requirements.txt

# 下载模型
RUN mkdir -p checkpoints
# 这里添加模型下载命令

EXPOSE 5000

CMD ["python", "local_wav2lip_server.py"]
```

构建和运行：

```bash
docker build -t wav2lip-local .
docker run --gpus all -p 5000:5000 wav2lip-local
```

## 成本对比

| 方案 | 初始成本 | 运行成本 | 质量 | 速度 |
|------|---------|---------|------|------|
| **Sync.so API** | $0 | $0.10-1 per video | ⭐⭐⭐⭐⭐ | 快 |
| **本地部署** | GPU 成本 | $0 | ⭐⭐⭐⭐ | 中等 |
| **云 GPU** | $0 | $0.5-2 per hour | ⭐⭐⭐⭐ | 快 |

## 参考资源

- 官方仓库: https://github.com/Rudrabha/Wav2Lip
- 论文: https://arxiv.org/abs/2011.10233
- 模型下载: https://github.com/Rudrabha/Wav2Lip#getting-the-pretrained-model

## 许可证

Wav2Lip 使用 MIT License。
