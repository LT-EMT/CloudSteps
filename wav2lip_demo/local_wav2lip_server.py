#!/usr/bin/env python3
"""
本地 Wav2Lip 服务器
基于官方 Wav2Lip 仓库: https://github.com/Rudrabha/Wav2Lip

需要先安装 Wav2Lip:
git clone https://github.com/Rudrabha/Wav2Lip.git
cd Wav2Lip
pip install -r requirements.txt
python face_detection/detection/sfd/detect.py  # 下载人脸检测模型
"""

import os
import sys
import torch
import numpy as np
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import uuid
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Wav2Lip 模型路径
WAV2LIP_CHECKPOINT = "checkpoints/wav2lip.pth"
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# 存储生成的视频
OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

print(f"🖥️  使用设备: {DEVICE}")


def load_wav2lip_model():
    """加载 Wav2Lip 模型"""
    try:
        from models import SyncNet_color, SyncNet_color_for_load
        from models import Wav2Lip as Wav2LipModel
        
        if not os.path.exists(WAV2LIP_CHECKPOINT):
            print(f"❌ 模型文件不存在: {WAV2LIP_CHECKPOINT}")
            print("请下载模型: https://github.com/Rudrabha/Wav2Lip#getting-the-pretrained-model")
            return None
        
        model = Wav2LipModel()
        print(f"加载模型: {WAV2LIP_CHECKPOINT}")
        checkpoint = torch.load(WAV2LIP_CHECKPOINT, map_location=DEVICE)
        s, t = checkpoint.popitem()
        model.load_state_dict(checkpoint)
        model = model.to(DEVICE)
        return model.eval()
    except ImportError as e:
        print(f"❌ 导入失败: {e}")
        print("请确保已安装 Wav2Lip")
        return None


def generate_video(video_path: str, audio_path: str, output_path: str):
    """
    生成带对口型的视频
    
    这是一个简化版本，实际使用需要完整的 Wav2Lip 推理代码
    """
    try:
        # 这里应该调用完整的 Wav2Lip 推理流程
        # 包括: 视频帧提取、人脸检测、音频处理、模型推理、视频合成
        
        # 简化示例（实际需要完整实现）
        import subprocess
        
        cmd = [
            "python", "inference.py",
            "--checkpoint_path", WAV2LIP_CHECKPOINT,
            "--face", video_path,
            "--audio", audio_path,
            "--outfile", output_path,
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return False, f"推理失败: {result.stderr}"
        
        return True, output_path
    
    except Exception as e:
        return False, str(e)


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "service": "Local Wav2Lip Server",
        "device": DEVICE,
        "model_available": os.path.exists(WAV2LIP_CHECKPOINT)
    })


@app.route('/api/video/generate', methods=['POST'])
def generate():
    """
    生成视频
    
    支持两种方式:
    1. 上传文件
    2. 提供 URL
    """
    try:
        # 获取输入
        video_file = request.files.get('video')
        audio_file = request.files.get('audio')
        video_url = request.form.get('videoUrl')
        audio_url = request.form.get('audioUrl')
        
        if not video_file and not video_url:
            return jsonify({"error": "需要提供视频文件或 URL"}), 400
        
        if not audio_file and not audio_url:
            return jsonify({"error": "需要提供音频文件或 URL"}), 400
        
        # 创建临时目录
        task_id = str(uuid.uuid4())
        task_dir = OUTPUT_DIR / task_id
        task_dir.mkdir(exist_ok=True)
        
        # 保存输入文件
        if video_file:
            video_path = task_dir / "input_video.mp4"
            video_file.save(video_path)
        else:
            # 从 URL 下载
            import requests
            video_path = task_dir / "input_video.mp4"
            response = requests.get(video_url)
            with open(video_path, 'wb') as f:
                f.write(response.content)
        
        if audio_file:
            audio_path = task_dir / "input_audio.wav"
            audio_file.save(audio_path)
        else:
            # 从 URL 下载
            import requests
            audio_path = task_dir / "input_audio.wav"
            response = requests.get(audio_url)
            with open(audio_path, 'wb') as f:
                f.write(response.content)
        
        # 生成输出路径
        output_path = task_dir / "output.mp4"
        
        # 生成视频
        success, result = generate_video(
            str(video_path),
            str(audio_path),
            str(output_path)
        )
        
        if not success:
            return jsonify({
                "success": False,
                "error": result
            }), 500
        
        return jsonify({
            "success": True,
            "taskId": task_id,
            "videoUrl": f"/api/video/output/{task_id}",
            "status": "completed"
        }), 200
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/video/output/<task_id>', methods=['GET'])
def get_output(task_id):
    """获取生成的视频"""
    try:
        output_path = OUTPUT_DIR / task_id / "output.mp4"
        
        if not output_path.exists():
            return jsonify({"error": "视频不存在"}), 404
        
        return send_file(
            output_path,
            mimetype='video/mp4',
            as_attachment=True,
            download_name=f"output_{task_id}.mp4"
        )
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/video/status/<task_id>', methods=['GET'])
def get_status(task_id):
    """获取任务状态"""
    try:
        output_path = OUTPUT_DIR / task_id / "output.mp4"
        
        if output_path.exists():
            return jsonify({
                "taskId": task_id,
                "status": "completed",
                "videoUrl": f"/api/video/output/{task_id}"
            }), 200
        else:
            return jsonify({
                "taskId": task_id,
                "status": "processing"
            }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "端点不存在"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "服务器错误"}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("🎬 本地 Wav2Lip 服务器")
    print("=" * 60)
    print(f"📍 服务器地址: http://localhost:5000")
    print(f"🖥️  设备: {DEVICE}")
    print(f"📦 模型: {WAV2LIP_CHECKPOINT}")
    print("=" * 60)
    
    if not os.path.exists(WAV2LIP_CHECKPOINT):
        print("⚠️  警告: 模型文件不存在")
        print("请先下载模型:")
        print("  https://github.com/Rudrabha/Wav2Lip#getting-the-pretrained-model")
    
    print("\n可用端点:")
    print("  GET  /health")
    print("  POST /api/video/generate")
    print("  GET  /api/video/output/<task_id>")
    print("  GET  /api/video/status/<task_id>")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
