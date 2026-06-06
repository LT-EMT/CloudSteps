// 数字人服务 API 配置
const DIGITAL_HUMAN_BASE_URL = process.env.VITE_DIGITAL_HUMAN_API_URL || 'http://localhost:8880';
const API_BASE = `${DIGITAL_HUMAN_BASE_URL}/adh`;
const SERVER_VERSION = 'v1';

// =========================== ASR APIs ===========================
const ASR_PATH = `${API_BASE}/asr/${SERVER_VERSION}`;

export async function asrGetList(): Promise<any[]> {
  try {
    const response = await fetch(`${ASR_PATH}/engine`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('ASR get list error:', error);
    return [];
  }
}

export async function asrGetDefault(): Promise<any> {
  try {
    const response = await fetch(`${ASR_PATH}/engine/default`);
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error('ASR get default error:', error);
    return {};
  }
}

export async function asrInfer(
  engine: string,
  config: any,
  data: string | Blob,
  type: string = 'wav',
  sampleRate: number = 16000,
  sampleWidth: number = 2
): Promise<string> {
  try {
    const response = await fetch(`${ASR_PATH}/engine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engine,
        config,
        data,
        type,
        sampleRate,
        sampleWidth,
      }),
    });
    const result = await response.json();
    return result.data || '';
  } catch (error) {
    console.error('ASR infer error:', error);
    return '';
  }
}

// =========================== TTS APIs ===========================
const TTS_PATH = `${API_BASE}/tts/${SERVER_VERSION}`;

export async function ttsGetList(): Promise<any[]> {
  try {
    const response = await fetch(`${TTS_PATH}/engine`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('TTS get list error:', error);
    return [];
  }
}

export async function ttsGetDefault(): Promise<any> {
  try {
    const response = await fetch(`${TTS_PATH}/engine/default`);
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error('TTS get default error:', error);
    return {};
  }
}

export async function ttsGetVoice(engine: string, config: any): Promise<any[]> {
  try {
    const response = await fetch(
      `${TTS_PATH}/engine/${engine}/voice?config=${encodeURIComponent(JSON.stringify(config))}`
    );
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('TTS get voice error:', error);
    return [];
  }
}

export async function ttsInfer(
  engine: string,
  config: any,
  data: string,
  signal?: AbortSignal
): Promise<string> {
  try {
    const response = await fetch(`${TTS_PATH}/engine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engine,
        config,
        data,
      }),
      signal,
    });
    const result = await response.json();
    return result.data || '';
  } catch (error) {
    console.error('TTS infer error:', error);
    return '';
  }
}

// =========================== Agent APIs ===========================
const AGENT_PATH = `${API_BASE}/agent/${SERVER_VERSION}`;

export async function agentGetList(): Promise<any[]> {
  try {
    const response = await fetch(`${AGENT_PATH}/engine`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Agent get list error:', error);
    return [];
  }
}

export async function agentGetDefault(): Promise<any> {
  try {
    const response = await fetch(`${AGENT_PATH}/engine/default`);
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error('Agent get default error:', error);
    return {};
  }
}

export async function agentCreateConversation(engine: string, config: any): Promise<string> {
  try {
    const response = await fetch(`${AGENT_PATH}/engine/${engine}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engine,
        data: config,
      }),
    });
    const result = await response.json();
    return result.data || '';
  } catch (error) {
    console.error('Agent create conversation error:', error);
    return '';
  }
}

export async function agentStream(
  engine: string,
  config: any,
  data: string,
  conversationId: string,
  onMessage: (event: string, data: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(`${AGENT_PATH}/engine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engine,
        config,
        data,
        conversation_id: conversationId,
      }),
      signal,
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('event:')) {
          const event = line.replace('event:', '').trim();
        } else if (line.startsWith('data:')) {
          const data = line.replace('data:', '').trim();
          onMessage('message', data);
        }
      }
    }
  } catch (error) {
    console.error('Agent stream error:', error);
    onError(error as Error);
  }
}
