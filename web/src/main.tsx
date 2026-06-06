import { createRoot } from "react-dom/client";
import App from "@/App";
import "./styles/index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "antd/dist/reset.css";
import { ConfigProvider, theme } from "antd";
import { initializeVideoGeneration } from "@/config/videoGenerationConfig";

// 初始化视频生成服务
initializeVideoGeneration();

const antdTheme = {
  token: {
    colorPrimary: "#4ECDC4",
    colorSuccess: "#4ECDC4",
    colorInfo: "#4ECDC4",
    colorWarning: "#FFA94D",
    colorError: "#FF6B6B",
    borderRadius: 8,
  },
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ConfigProvider theme={antdTheme}>
      <App />
    </ConfigProvider>
  </ErrorBoundary>,
);