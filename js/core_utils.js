// 全局配置与基础网络工具模块 (Core Utils)
const WORKER_PROXY = 'https://moxinglaqu.lucyabbyhannah.workers.dev/?url=';

function normalizeBaseUrl(raw) {
  return (raw || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '').replace(/\/models$/, '');
}

function cleanApiKey(key) {
  return (key || '').trim().replace(/^bearer\s+/i, '');
}

async function workerFetch(url, options = {}) {
  // 核心修复：优先直接向中转站发起请求，绝不硬走挂掉的代理
  try {
    const directResp = await fetch(url, options);
    return directResp;
  } catch (err) {
    // 只有当本地跨域且直连彻底失败时，才进行兜底提示
    console.error("Direct fetch failed:", err);
    throw new Error(`网络连接失败 [${err.message}]，请检查中转站地址与网络代理环境`);
  }
}

async function fetchRemoteModels(baseUrl, apiKey) {
  const cleanKey = cleanApiKey(apiKey);
  const base = normalizeBaseUrl(baseUrl);
  const resp = await workerFetch(`${base}/v1/models`, {
    headers: { 'Authorization': `Bearer ${cleanKey}` }
  });
  const resJson = await resp.json();
  if (Array.isArray(resJson.data)) {
    return resJson.data.map(i => i.id);
  }
  return [];
}

async function parseWordFileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(event) {
      try {
        const arrayBuffer = event.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        resolve(result.value || '');
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

function getCurrentFormattedTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function getStoredTheme() {
  return localStorage.getItem('se_theme_style') || 'warm';
}

function saveStoredTheme(theme) {
  localStorage.setItem('se_theme_style', theme);
}
// 语音合成 TTS 播放工具函数
async function playTtsSpeech(text, voice, ttsConfig) {
  if (!text || !text.trim()) return;

  // 1. 若启用了自定义 API 且配置完整，走接口请求音频
  const cleanKey = cleanApiKey(ttsConfig?.apiKey);
  if (ttsConfig && ttsConfig.enabled && cleanKey && ttsConfig.baseUrl) {
    try {
      const base = normalizeBaseUrl(ttsConfig.baseUrl);
      const resp = await workerFetch(`${base}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: ttsConfig.model || 'tts-1',
          input: text,
          voice: voice || ttsConfig.defaultVoice || 'alloy'
        })
      });

      if (!resp.ok) throw new Error(`TTS 请求失败: ${resp.status}`);
      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
      return;
    } catch (e) {
      console.warn("API TTS 调用异常，降级使用原生语音:", e);
    }
  }

  // 2. 降级方案：调用手机/浏览器系统自带的免费语音播放
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92; // 语速微慢，贴合沉浸感
    utter.pitch = 0.9;
    utter.lang = 'zh-CN';
    window.speechSynthesis.speak(utter);
  } else {
    alert("当前浏览器环境不支持系统语音朗读。");
  }
}