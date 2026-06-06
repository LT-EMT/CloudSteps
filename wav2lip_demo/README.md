# 本地 Wav2Lip 部署

完全本地部署，无需 API Key，支持 GPU 加速。

## 快速开始

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
pip install -r ../requirements.txt
```

### 4. 下载模型

```bash
mkdir -p checkpoints
# 从官方下载: https://github.com/Rudrabha/Wav2Lip#getting-the-pretrained-model
# 放到 checkpoints/wav2lip.pth
```

### 5. 运行推理

```bash
python ../local_inference.py --face input.mp4 --audio audio.wav --outfile output.mp4
```

## 文件说明

- `local_inference.py` - 本地推理脚本
- `local_wav2lip_server.py` - Flask API 服务器
- `LOCAL_DEPLOYMENT.md` - 详细部署指南
- `COMPARISON.md` - 方案对比

## 系统要求

- Python 3.8+
- NVIDIA GPU（推荐）或 CPU
- 8GB+ RAM
- CUDA 11.0+（如果使用 GPU）

## 常见问题

### Q: 如何获取模型？
A: 从官方仓库下载: https://github.com/Rudrabha/Wav2Lip#getting-the-pretrained-model

### Q: 推理速度太慢？
A: 使用 GPU 而不是 CPU，确保 PyTorch 正确安装了 CUDA 支持

### Q: 显存不足？
A: 减小视频分辨率或使用 CPU

## 参考

- 官方仓库: https://github.com/Rudrabha/Wav2Lip
- 论文: https://arxiv.org/abs/2011.10233

