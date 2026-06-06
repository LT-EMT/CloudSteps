import { useEffect, useRef } from 'react';
import { LAppDelegate } from '@/lib/live2d/src/lappdelegate';

export function Live2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 初始化 Live2D
    if (LAppDelegate.getInstance().initialize(canvasRef.current) === false) {
      return;
    }
    LAppDelegate.getInstance().run();

    // 清理
    return () => {
      LAppDelegate.releaseInstance();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      id="live2dCanvas"
    />
  );
}
