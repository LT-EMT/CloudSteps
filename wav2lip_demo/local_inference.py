#!/usr/bin/env python3
"""
本地 Wav2Lip 推理脚本
基于官方 Wav2Lip: https://github.com/Rudrabha/Wav2Lip

使用方法:
1. 下载官方仓库: git clone https://github.com/Rudrabha/Wav2Lip.git
2. 下载模型到 checkpoints/wav2lip.pth
3. 运行: python local_inference.py --face video.mp4 --audio audio.wav
"""

import os
import sys
import argparse
import torch
import cv2
import numpy as np
from pathlib import Path
import subprocess

# 检查是否有 GPU
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"🖥️  使用设备: {DEVICE}")


def download_model():
    """下载 Wav2Lip 模型"""
    checkpoint_path = Path("checkpoints/wav2lip.pth")
    
    if checkpoint_path.exists():
        print(f"✅ 模型已存在: {checkpoint_path}")
        return str(checkpoint_path)
    
    print("📥 下载 Wav2Lip 模型...")
    checkpoint_path.parent.mkdir(exist_ok=True)
    
    # 从官方源下载
    url = "https://github.com/Rudrabha/Wav2Lip/releases/download/v1.0/wav2lip.pth"
    
    try:
        import urllib.request
        urllib.request.urlretrieve(url, checkpoint_path)
        print(f"✅ 模型下载完成: {checkpoint_path}")
        return str(checkpoint_path)
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        print("请手动下载: https://github.com/Rudrabha/Wav2Lip#getting-the-pretrained-model")
        return None


def load_model(checkpoint_path):
    """加载 Wav2Lip 模型"""
    try:
        # 这是一个简化版本，实际需要完整的 Wav2Lip 模型定义
        # 对于完整实现，需要从官方仓库复制模型代码
        print(f"加载模型: {checkpoint_path}")
        
        # 检查模型文件
        if not os.path.exists(checkpoint_path):
            print(f"❌ 模型文件不存在: {checkpoint_path}")
            return None
        
        # 这里应该加载实际的 Wav2Lip 模型
        # 简化版本只返回路径
        return checkpoint_path
    
    except Exception as e:
        print(f"❌ 加载模型失败: {e}")
        return None


def inference(video_path, audio_path, checkpoint_path, output_path):
    """
    运行 Wav2Lip 推理
    
    这个函数调用官方的 inference.py
    """
    try:
        # 检查输入文件
        if not os.path.exists(video_path):
            print(f"❌ 视频文件不存在: {video_path}")
            return False
        
        if not os.path.exists(audio_path):
            print(f"❌ 音频文件不存在: {audio_path}")
            return False
        
        print(f"📹 视频: {video_path}")
        print(f"🎵 音频: {audio_path}")
        print(f"💾 输出: {output_path}")
        
        # 调用官方 inference.py
        # 需要在 Wav2Lip 仓库目录中运行
        cmd = [
            sys.executable, "inference.py",
            "--checkpoint_path", checkpoint_path,
            "--face", video_path,
            "--audio", audio_path,
            "--outfile", output_path,
            "--device", DEVICE,
        ]
        
        print(f"\n⏳ 运行推理... (这可能需要几分钟)")
        print(f"命令: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ 推理完成!")
            print(f"📹 输出视频: {output_path}")
            return True
        else:
            print(f"❌ 推理失败")
            print(f"错误: {result.stderr}")
            return False
    
    except Exception as e:
        print(f"❌ 推理异常: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="本地 Wav2Lip 推理",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python local_inference.py --face video.mp4 --audio audio.wav
  python local_inference.py --face video.mp4 --audio audio.wav --outfile output.mp4
        """
    )
    
    parser.add_argument('--face', required=True, help='输入视频文件路径')
    parser.add_argument('--audio', required=True, help='输入音频文件路径')
    parser.add_argument('--outfile', default='results/result.mp4', help='输出视频文件路径')
    parser.add_argument('--checkpoint_path', default='checkpoints/wav2lip.pth', help='模型检查点路径')
    parser.add_argument('--device', default=DEVICE, help='使用设备 (cuda/cpu)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🎬 本地 Wav2Lip 推理")
    print("=" * 60)
    
    # 创建输出目录
    output_dir = Path(args.outfile).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 下载模型
    checkpoint = download_model()
    if not checkpoint:
        print("❌ 无法获取模型，退出")
        return False
    
    # 加载模型
    model = load_model(checkpoint)
    if not model:
        print("❌ 无法加载模型，退出")
        return False
    
    # 运行推理
    success = inference(
        args.face,
        args.audio,
        checkpoint,
        args.outfile
    )
    
    print("=" * 60)
    if success:
        print("✅ 完成!")
    else:
        print("❌ 失败")
    print("=" * 60)
    
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
