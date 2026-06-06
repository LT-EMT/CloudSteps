#!/bin/bash

# Wav2Lip Demo 设置脚本

echo "=========================================="
echo "🎬 Wav2Lip Demo 设置"
echo "=========================================="

# 检查 Python 版本
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3"
    echo "请先安装 Python 3.8 或更高版本"
    exit 1
fi

python_version=$(python3 --version | awk '{print $2}')
echo "✅ Python 版本: $python_version"

# 创建虚拟环境
echo ""
echo "📦 创建虚拟环境..."
python3 -m venv venv

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 升级 pip
echo "📥 升级 pip..."
pip install --upgrade pip

# 安装依赖
echo "📚 安装依赖..."
pip install -r requirements.txt

# 创建 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，填入你的 Sync.so API Key"
else
    echo "✅ .env 文件已存在"
fi

echo ""
echo "=========================================="
echo "✅ 设置完成！"
echo "=========================================="
echo ""
echo "📖 后续步骤:"
echo "1. 编辑 .env 文件，填入 SYNC_API_KEY"
echo "2. 运行 demo:"
echo "   source venv/bin/activate"
echo "   python quickstart.py"
echo ""
echo "3. 或启动 Flask API 服务器:"
echo "   python flask_api_server.py"
echo ""
echo "获取 API Key: https://dashboard.sync.so"
echo "=========================================="
