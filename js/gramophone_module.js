// js/gramophone_module.js - 心跳留声机、夜信与 TTS 语音播放模块 (100% 纯净修复版)

function useGramophoneModule(
  personaList, 
  userPersonaList, 
  chosenUserPersonaId, 
  activeDailySessions, 
  settings, 
  ttsConfig, 
  helpers
) {
  const { ref, reactive, onMounted, onUnmounted } = Vue;
  const { getPersonaAffectionStats, addAffectionPoints } = helpers;

  // ★ 核心修复：自己内部实现查询函数，并加上万能兜底，绝对不返回 null
  const getPersonaObj = (pId) => {
    return personaList.value.find(p => p.id === pId) || personaList.value[0];
  };
  const getUserPersonaObj = (upId) => {
    return userPersonaList.value.find(u => u.id === upId) || userPersonaList.value[0];
  };

  const showGramophoneModal = ref(false);
  const gramophoneTab = ref('letters'); // 'letters' | 'tapes'
  const gramophonePersonaId = ref('p_shen');

  // 1. 夜信档案与磁带档案持久化存储
  const archivedLetters = ref(JSON.parse(localStorage.getItem('se_archived_letters') || '{}'));
  const archivedTapes = ref(JSON.parse(localStorage.getItem('se_archived_tapes') || '{}'));

  const getPersonaLetters = (pId) => archivedLetters.value[pId] || [];
  const getPersonaTapes = (pId) => archivedTapes.value[pId] || [];

  // ======= 隐藏磁轨：双生理指标 + 人设驱动 + 活人感防刷锁 =======
  const touchBonusBpm = ref(0);
  const touchClickCount = ref(0);
  const naturalBpmJitter = ref(0);
  const burstVoiceBubble = ref(null);
  const isListeningHeart = ref(false);
  const showHeartHistoryModal = ref(false);

  // 本地心声档案库持久化
  const heartVoiceHistory = ref(JSON.parse(localStorage.getItem('se_heart_history') || '{}'));
  const getHeartHistoryList = (pId) => heartVoiceHistory.value[pId] || [];

  const saveHeartVoiceRecord = (pId, tag, content) => {
    if (!heartVoiceHistory.value[pId]) heartVoiceHistory.value[pId] = [];
    if (!heartVoiceHistory.value[pId].some(r => r.content === content)) {
      heartVoiceHistory.value[pId].unshift({
        tag,
        content,
        time: getCurrentFormattedTime()
      });
      localStorage.setItem('se_heart_history', JSON.stringify(heartVoiceHistory.value));
    }
  };

  const extractPersonaHeartbeatPrompt = (p) => {
    if (!p) return '';
    const fullText = (p.personaPrompt || '') + ' ' + (p.traits || '');
    const matched = fullText.match(/[^。！？；\n]*?(心跳|脉搏|体温|呼吸|失控|胸膛|耳根|克制)[^。！？；\n]*/g);
    return matched ? matched.slice(0, 3).join('；') : '';
  };

  let jitterTimer = null;
  let decayTimer = null;
  onMounted(() => {
    jitterTimer = setInterval(() => {
      naturalBpmJitter.value = Math.floor(Math.random() * 5) - 2;
    }, 4000);

    decayTimer = setInterval(() => {
      if (touchBonusBpm.value > 0) {
        touchBonusBpm.value = Math.max(0, touchBonusBpm.value - 2);
      }
      if (touchClickCount.value > 0 && touchBonusBpm.value <= 4) {
        touchClickCount.value = 0;
      }
    }, 900);
  });

  onUnmounted(() => {
    if (jitterTimer) clearInterval(jitterTimer);
    if (decayTimer) clearInterval(decayTimer);
  });

  const getCompanionBpm = (pId) => {
    const stats = getPersonaAffectionStats(pId);
    const hb = stats.heartbeat || 30;
    let base = 68 + Math.floor(hb / 5);
    if (isAudioPlaying.value && currentAudioId.value) base += 12;
    const total = base + touchBonusBpm.value + naturalBpmJitter.value;
    return Math.min(135, Math.max(62, total));
  };

  const getCompanionTemp = (pId) => {
    const bpm = getCompanionBpm(pId);
    const temp = 36.5 + ((bpm - 62) / 73) * 1.3;
    return temp.toFixed(1);
  };

  const getEcgAnimDuration = (pId) => {
    const bpm = getCompanionBpm(pId);
    const sec = (120 / bpm * 1.05).toFixed(2);
    return `${sec}s`;
  };

  const getCompanionBpmDescription = (pId) => {
    const p = getPersonaObj(pId);
    const bpm = getCompanionBpm(pId);
    const customKeywords = extractPersonaHeartbeatPrompt(p);

    if (touchBonusBpm.value >= 22) {
      return `指尖反复撩拨下防线彻底瓦解。${customKeywords ? customKeywords + '，' : ''}急促的呼吸与滚烫的体温已无法掩饰。`;
    }
    if (touchBonusBpm.value > 0) {
      return `感知到触碰，原本自持的心跳骤然提速，耳根泛起不易察觉的薄红。`;
    }
    if (isAudioPlaying.value) {
      return `耳畔低语萦绕，声线随着呼吸微颤，脉搏同频共振。`;
    }
    if (bpm < 75) {
      return `${p?.name || 'TA'}呼吸平稳自持，深邃的目光静静注视着你的一举一动。`;
    }
    return `视线在你身上驻留，微垂眼睫下，脉搏正因你的靠近而紊乱。`;
  };

  let lastBurstApiTime = 0;
  const triggerHeartTouch = async (pId) => {
    touchClickCount.value++;
    const isFlutter = Math.random() < 0.25;
    const delta = isFlutter ? Math.floor(Math.random() * 8) + 14 : Math.floor(Math.random() * 6) + 8;
    touchBonusBpm.value = Math.min(48, touchBonusBpm.value + delta);

    const bpm = getCompanionBpm(pId);
    const now = Date.now();

    if (bpm >= 105 && touchClickCount.value >= 3 && (now - lastBurstApiTime > 15 * 60 * 1000)) {
      lastBurstApiTime = now;
      await requestBurstReactionAPI(pId, '触碰破防');
    } else if (touchClickCount.value >= 4) {
      const history = getHeartHistoryList(pId);
      if (history.length > 0) {
        const pick = history[Math.floor(Math.random() * history.length)];
        burstVoiceBubble.value = { tag: '💥 脉搏紊乱 (心声)', content: pick.content, time: pick.time };
      }
    }
  };

  const playVoiceSnippet = (text, voice) => {
    const cfg = { ...ttsConfig };
    if (!cfg.apiKey) cfg.apiKey = settings.apiKey;
    if (typeof playTtsSpeech === 'function') {
      playTtsSpeech(text, voice || cfg.defaultVoice, cfg);
    }
  };

  const requestBurstReactionAPI = async (pId, eventType) => {
    const key = cleanApiKey(settings.apiKey);
    if (!key) return;

    const p = getPersonaObj(pId);
    const up = getUserPersonaObj(chosenUserPersonaId.value);
    const bpm = getCompanionBpm(pId);
    const temp = getCompanionTemp(pId);
    const customRules = extractPersonaHeartbeatPrompt(p);
    const historyTexts = getHeartHistoryList(pId).slice(0, 3).map(r => r.content).join('；');
    const recentChat = activeDailySessions.value.find(d => d.personaId === pId)?.messages?.slice(-2)?.[0]?.text || '';

    const systemPrompt = `你扮演同伴【${p.name}】（核心性格与人设：${p.personaPrompt || p.traits}）。
玩家是【${up.name}】（称呼：${p.userNickname || '你'}）。
此时由于玩家的亲密触碰/贴近胸膛，你的生理指标为：心率 ${bpm} BPM，体温已升至 ${temp}℃。
${customRules ? `【你的专属生理特征】：${customRules}` : ''}
${recentChat ? `【你们刚聊到的线索】：${recentChat}` : ''}

【严格要求】：
1. 严禁OOC，用符合人设的语气说一句极具张力的台词或微喘气声独白（35-55字）。
2. 严禁重复以下已出现过的台词梗：${historyTexts || '无'}。
3. 严格返回合法的 JSON 格式，不要包含任何多余符号：
{"voice":"台词正文"}`;

    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: 0.8
        })
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      const parsed = JSON.parse(raw);
      if (parsed.voice) {
        burstVoiceBubble.value = {
          tag: eventType === '触碰破防' ? '💥 触碰破防 (失控)' : '🎧 胸膛私语',
          content: parsed.voice,
          time: getCurrentFormattedTime()
        };
        saveHeartVoiceRecord(pId, burstVoiceBubble.value.tag, parsed.voice);
        if (ttsConfig.enabled) {
          playVoiceSnippet(parsed.voice, p.voice);
        }
      }
    } catch (e) {
      console.warn("破防心声生成失败:", e);
    }
  };

  const triggerStethoscopeListen = async (pId) => {
    if (isListeningHeart.value) return;
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请先配置 API Key"); return; }

    isListeningHeart.value = true;
    try {
      await requestBurstReactionAPI(pId, '贴近胸膛');
      if (burstVoiceBubble.value?.content) {
        if (!archivedTapes.value[pId]) archivedTapes.value[pId] = [];
        archivedTapes.value[pId].unshift({
          id: 'tape_' + Date.now(),
          title: '贴近胸膛的共振',
          whisper: burstVoiceBubble.value.content,
          source: '听诊器共鸣',
          time: getCurrentFormattedTime()
        });
        localStorage.setItem('se_archived_tapes', JSON.stringify(archivedTapes.value));
      }
    } finally {
      isListeningHeart.value = false;
    }
  };

  const openHeartHistoryModal = (pId) => {
    gramophonePersonaId.value = pId;
    showHeartHistoryModal.value = true;
  };

  const regenerateSingleTape = async (tape, pId) => {
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请先配置 API Key"); return; }

    if (!confirm(`确定重新刻录《${tape.title}》吗？原有的私语将被覆盖。`)) return;

    tape.isRegenerating = true;
    const p = getPersonaObj(pId);
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `你扮演同伴【${p.name}】（人设：${p.personaPrompt || p.traits}）。请说一句对玩家私密耳语式的极度克制深情台词（40-60字左右），带轻微呼吸与真实细节，严禁与此前重复。返回严格JSON：{"whisper":"新耳语正文"}`
          }]
        })
      });
      const data = await resp.json();
      const parsed = JSON.parse(data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
      if (parsed.whisper) {
        tape.whisper = parsed.whisper;
        tape.audioUrl = null;
        tape.time = getCurrentFormattedTime();
        localStorage.setItem('se_archived_tapes', JSON.stringify(archivedTapes.value));
        alert('📼 磁带重新刻录成功！');
      }
    } catch(e) {
      alert('重新刻录失败：' + e.message);
    } finally {
      tape.isRegenerating = false;
    }
  };

  const openGramophoneModal = (activeHubPId) => {
    gramophonePersonaId.value = activeHubPId || personaList.value[0]?.id;
    showGramophoneModal.value = true;
  };

  let globalAudio = null;
  let virtualTimer = null;
  const currentAudioId = ref(null);
  const isAudioPlaying = ref(false);
  const audioProgress = reactive({
    currentTime: 0,
    duration: 0
  });

  const formatAudioTime = (sec) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAudioSeek = () => {
    if (globalAudio && !isNaN(audioProgress.currentTime)) {
      globalAudio.currentTime = audioProgress.currentTime;
    }
  };

  function startProgressTimer() {
    if (virtualTimer) clearInterval(virtualTimer);
    virtualTimer = setInterval(() => {
      if (globalAudio) {
        audioProgress.currentTime = globalAudio.currentTime;
        audioProgress.duration = globalAudio.duration || audioProgress.duration;
      } else {
        if (audioProgress.currentTime >= audioProgress.duration) {
          stopAllAudio();
        } else {
          audioProgress.currentTime += 0.2;
        }
      }
    }, 200);
  }

  function playAudioUrl(src) {
    globalAudio = new Audio(src);
    globalAudio.onloadedmetadata = () => { audioProgress.duration = globalAudio.duration; };
    globalAudio.onended = () => { stopAllAudio(); };
    globalAudio.play();
    isAudioPlaying.value = true;
    startProgressTimer();
  }

  function stopAllAudio() {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (virtualTimer) clearInterval(virtualTimer);
    isAudioPlaying.value = false;
  }

  const toggleAudioPlayback = async (tape, voice) => {
    if (currentAudioId.value === tape.id && isAudioPlaying.value) {
      if (globalAudio) globalAudio.pause();
      if (window.speechSynthesis) window.speechSynthesis.pause();
      if (virtualTimer) clearInterval(virtualTimer);
      isAudioPlaying.value = false;
      return;
    }

    if (currentAudioId.value === tape.id && !isAudioPlaying.value && audioProgress.currentTime > 0 && audioProgress.currentTime < audioProgress.duration) {
      if (globalAudio) {
        globalAudio.play();
      } else if (window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
      startProgressTimer();
      isAudioPlaying.value = true;
      return;
    }

    stopAllAudio();
    currentAudioId.value = tape.id;
    audioProgress.currentTime = 0;

    if (tape.audioUrl) {
      playAudioUrl(tape.audioUrl);
      return;
    }

    const cfg = { ...ttsConfig };
    if (!cfg.apiKey) cfg.apiKey = settings.apiKey;
    const cleanKey = cleanApiKey(cfg.apiKey);

    if (cfg.enabled && cleanKey && cfg.baseUrl) {
      try {
        const base = normalizeBaseUrl(cfg.baseUrl);
        const resp = await workerFetch(`${base}/v1/audio/speech`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanKey}` },
          body: JSON.stringify({
            model: cfg.model || 'tts-1',
            input: tape.whisper,
            voice: voice || cfg.defaultVoice || 'alloy'
          })
        });
        if (!resp.ok) throw new Error(`状态码: ${resp.status}`);
        const blob = await resp.blob();
        tape.audioUrl = URL.createObjectURL(blob);
        playAudioUrl(tape.audioUrl);
        return;
      } catch (err) {
        console.warn("TTS 请求失败，降级原生语音:", err);
      }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(tape.whisper);
      utter.rate = 0.95;
      utter.lang = 'zh-CN';
      const totalSec = Math.max(3, tape.whisper.length * 0.28);
      audioProgress.duration = totalSec;
      isAudioPlaying.value = true;
      startProgressTimer();
      utter.onend = () => { stopAllAudio(); audioProgress.currentTime = audioProgress.duration; };
      window.speechSynthesis.speak(utter);
    }
  };

  const closeGramophoneModal = () => {
    stopAllAudio();
    showGramophoneModal.value = false;
  };

  // 4. A面：生成专属夜信
  const showLetterModal = ref(false);
  const showSingleLetterDetailModal = ref(false);
  const activeLetter = ref(null);
  const letterAuthorId = ref('p_shen');
  const currentMidnightLetter = ref('');
  const isGeneratingLetter = ref(false);

  const openMidnightLetterModal = () => {
    showLetterModal.value = true;
    if (!currentMidnightLetter.value) {
      currentMidnightLetter.value = '（点击下方按钮，由 TA 在月色下为你亲笔落下一封信……）';
    }
  };

  const fetchMidnightLetter = async () => {
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请配置API"); return; }
    isGeneratingLetter.value = true;
    const author = getPersonaObj(letterAuthorId.value);
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: `你扮演同伴【${author.name}】（设定：${author.personaPrompt || author.traits}）。在深夜万籁俱寂时，给玩家写下一封克制深情的亲笔信，字数150-200字左右。` }],
          temperature: 0.85
        })
      });
      const data = await resp.json();
      currentMidnightLetter.value = data.choices?.[0]?.message?.content?.trim() || '（信纸上带着淡淡的香气与墨迹）';
    } catch(e) {
      currentMidnightLetter.value = '生成失败，请检查网络与API配置。';
    } finally {
      isGeneratingLetter.value = false;
    }
  };

  const generateNewMidnightLetter = async (pId) => {
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请先配置 API Key"); return; }

    const p = getPersonaObj(pId);
    const up = getUserPersonaObj(chosenUserPersonaId.value);
    isGeneratingLetter.value = true;

    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `你现在是同伴【${p.name}】（核心人设：${p.personaPrompt || p.traits}）。
请在万籁俱寂的深夜，为你心中的玩家【${up.name}】写一封充满克制深情、专属细节的亲笔信。
要求：
1. 语言符合人设，严禁OOC。
2. 必须严格输出 JSON 格式（不要多余字符）：
{"title":"信件标题","content":"信笺正文，120-180字"}`
          }]
        })
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      const parsed = JSON.parse(raw);

      if (!archivedLetters.value[pId]) archivedLetters.value[pId] = [];
      const newRecord = {
        id: 'let_' + Date.now(),
        title: parsed.title || '月色无言',
        content: parsed.content || '（笔迹在月光下若隐若现……）',
        date: getCurrentFormattedTime()
      };
      archivedLetters.value[pId].unshift(newRecord);
      localStorage.setItem('se_archived_letters', JSON.stringify(archivedLetters.value));
      
      if (typeof addAffectionPoints === 'function') {
        addAffectionPoints(pId, { heartbeat: 3 });
      }
      activeLetter.value = newRecord;
      showSingleLetterDetailModal.value = true;
    } catch(e) {
      alert('夜信生成失败：' + e.message);
    } finally {
      isGeneratingLetter.value = false;
    }
  };

  const readLetterDetail = (letter) => {
    activeLetter.value = letter;
    showSingleLetterDetailModal.value = true;
  };

  // 5. B面：主动刻录当下私语
  const isGeneratingTape = ref(false);
  const extractNewWhisperTape = async (pId) => {
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请先配置 API Key"); return; }

    const p = getPersonaObj(pId);
    isGeneratingTape.value = true;
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `你扮演【${p.name}】（人设：${p.personaPrompt || p.traits}）。请说一句对玩家私密耳语式的极度克制深情的台词（40-60字左右），仿佛是在耳畔吐息。必须返回合法JSON：{"title":"磁带简短题名","whisper":"耳语正文"}`
          }]
        })
      });
      const data = await resp.json();
      const parsed = JSON.parse(data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
      
      if (!archivedTapes.value[pId]) archivedTapes.value[pId] = [];
      archivedTapes.value[pId].unshift({
        id: 'tape_' + Date.now(),
        title: parsed.title || '耳畔轻语',
        whisper: parsed.whisper || '（低沉的声音在耳畔回荡）',
        source: '独家刻录',
        time: getCurrentFormattedTime()
      });
      localStorage.setItem('se_archived_tapes', JSON.stringify(archivedTapes.value));
      alert(`📼 已成功为【${p.name}】刻录了一盘崭新的心动私语磁带！`);
    } catch(e) {
      alert('刻录失败：' + e.message);
    } finally {
      isGeneratingTape.value = false;
    }
  };

  const autoUnlockMilestoneTape = async (pId, milestoneTitle, triggerContext) => {
    const p = getPersonaObj(pId);
    const up = getUserPersonaObj(chosenUserPersonaId.value);
    const key = cleanApiKey(settings.apiKey);
    if (!key) return;

    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `你扮演同伴【${p.name}】（人设：${p.personaPrompt || p.traits}）。当前达成的情感事件：【${triggerContext}】。请背着玩家【${up.name}】在留声机里悄悄录下一段充满克制、深情或宠溺的40-60字私密耳语。必须返回严格JSON：{"whisper":"耳语正文"}`
          }]
        })
      });
      const parsed = JSON.parse((await resp.json()).choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
      if (parsed.whisper) {
        if (!archivedTapes.value[pId]) archivedTapes.value[pId] = [];
        archivedTapes.value[pId].unshift({
          id: 'tape_' + Date.now(),
          title: milestoneTitle,
          whisper: parsed.whisper,
          source: triggerContext,
          time: getCurrentFormattedTime()
        });
        localStorage.setItem('se_archived_tapes', JSON.stringify(archivedTapes.value));
      }
    } catch (e) {
      console.error("自动解锁留言失败:", e);
    }
  };

  return {
    showGramophoneModal, gramophoneTab, gramophonePersonaId,
    archivedLetters, archivedTapes, getPersonaLetters, getPersonaTapes,
    touchBonusBpm, touchClickCount, naturalBpmJitter, burstVoiceBubble, isListeningHeart, showHeartHistoryModal,
    heartVoiceHistory, getHeartHistoryList, saveHeartVoiceRecord, extractPersonaHeartbeatPrompt,
    getCompanionBpm, getCompanionTemp, getEcgAnimDuration, getCompanionBpmDescription, triggerHeartTouch, requestBurstReactionAPI, triggerStethoscopeListen, openHeartHistoryModal,
    playVoiceSnippet, regenerateSingleTape, openGramophoneModal, closeGramophoneModal,
    currentAudioId, isAudioPlaying, audioProgress, formatAudioTime, handleAudioSeek, toggleAudioPlayback, playAudioUrl, stopAllAudio,
    showLetterModal, showSingleLetterDetailModal, activeLetter, letterAuthorId, currentMidnightLetter, isGeneratingLetter,
    openMidnightLetterModal, fetchMidnightLetter, generateNewMidnightLetter, readLetterDetail,
    isGeneratingTape, extractNewWhisperTape, autoUnlockMilestoneTape
  };
}