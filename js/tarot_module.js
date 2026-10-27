// 模块 5：命运塔罗牌沉浸式互动引擎 (Tarot Module)
const TAROT_MAJOR_ARCANA = [
  { id: 0, name: "愚者", keyword: "新起点、未知、纯粹、冒险" },
  { id: 1, name: "魔术师", keyword: "创造力、意志、主导、契机" },
  { id: 2, name: "女祭司", keyword: "直觉、神秘、内省、静谧" },
  { id: 3, name: "女皇", keyword: "丰饶、母性、温柔、关怀" },
  { id: 4, name: "皇帝", keyword: "秩序、掌控、权威、庇护" },
  { id: 5, name: "教皇", keyword: "指引、传统、信赖、契约" },
  { id: 6, name: "恋人", keyword: "选择、深度羁绊、心意相通" },
  { id: 7, name: "战车", keyword: "突破、决心、胜利、前行" },
  { id: 8, name: "力量", keyword: "克制、温柔、勇气、驯服" },
  { id: 9, name: "隐士", keyword: "内省、孤寂、寻找、守护" },
  { id: 10, name: "命运之轮", keyword: "转折、宿命、契机、流转" },
  { id: 11, name: "正义", keyword: "理性、平衡、抉择、真相" },
  { id: 12, name: "倒吊人", keyword: "牺牲、换位思考、等待、破局" },
  { id: 13, name: "死神", keyword: "终结与新生、蜕变、决绝" },
  { id: 14, name: "节制", keyword: "融合、平衡、治愈、默契" },
  { id: 15, name: "恶魔", keyword: "诱惑、执念、占有欲、羁绊" },
  { id: 16, name: "高塔", keyword: "颠覆、突变、觉醒、打破防线" },
  { id: 17, name: "星星", keyword: "希望、治愈、星光、笃定" },
  { id: 18, name: "月亮", keyword: "迷茫、幻觉、隐秘心事、试探" },
  { id: 19, name: "太阳", keyword: "热烈、坦荡、光明、愉悦" },
  { id: 20, name: "审判", keyword: "唤醒、抉择、宿命回响" },
  { id: 21, name: "世界", keyword: "圆满、跨越、永恒、归宿" }
];

// 1. 每日运势
async function fetchTarotDailyReading(persona, userPersona, tarotCard, isReversed, settings) {
  const key = cleanApiKey(settings.apiKey);
  const base = normalizeBaseUrl(settings.baseUrl);
  const orientation = isReversed ? "逆位" : "正位";

  const systemPrompt = `你现在是同伴【${persona.name}】（核心人设准则：${persona.personaPrompt || persona.traits}）。
玩家是【${userPersona.name}】（称呼：${persona.userNickname || '你'}）。
今天玩家抽到了塔罗牌大阿卡纳【${tarotCard.name}】（${orientation}，关键词：${tarotCard.keyword}）。
结合牌面关心玩家近期的状态与心绪（120-160字），必须严格输出合法的 JSON 格式：
{"readingText":"解牌寄语正文","heartbeatBonus":3}`;

  try {
    const resp = await workerFetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.75
      })
    });
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    return JSON.parse(raw);
  } catch(e) {
    return {
      readingText: `抽到了【${tarotCard.name}】（${orientation}）。看来今天你心里装了不少事，无论如何别硬撑着，我就在你身侧。`,
      heartbeatBonus: 2
    };
  }
}

// 2. 牌面密语
async function fetchTarotWhisper(persona, tarotCard, isReversed, settings) {
  const key = cleanApiKey(settings.apiKey);
  const base = normalizeBaseUrl(settings.baseUrl);
  const orientation = isReversed ? "逆位" : "正位";

  const prompt = `你扮演同伴【${persona.name}】（人设：${persona.personaPrompt || persona.traits}）。
玩家抽到了【${tarotCard.name}】（${orientation}）。
请在耳边对玩家说一句极具私密感的碎碎念耳语（30-50字，口语化带呼吸感）。
严格输出 JSON：{"whisperText":"私语正文"}`;

  try {
    const resp = await workerFetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85
      })
    });
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    return JSON.parse(raw).whisperText || `看到这张牌，别想太多，我就在这里陪着你。`;
  } catch(e) {
    return `别总一个人硬扛着，转过头来，我就在你看得到的地方。`;
  }
}

// 3. ⚡ 心电感应盲猜主引擎
async function fetchTarotTelepathyGame(persona, userPersona, candidateCards, stats, affectionStage, settings) {
  const key = cleanApiKey(settings.apiKey);
  const base = normalizeBaseUrl(settings.baseUrl);
  const cardListStr = candidateCards.map((c, i) => `${i+1}. 【${c.name}】（关键词：${c.keyword}）`).join('\n');

  const prompt = `你现在是同伴【${persona.name}】（性格准则：${persona.personaPrompt || persona.traits}）。
玩家是【${userPersona.name}】（专属称呼：${persona.userNickname || '你'}）。
当前羁绊：【${affectionStage}】，信任度：${stats.trust || 30}点，心动值：${stats.heartbeat || 30}点，占有欲：${stats.possessiveness || 20}点。

【情境】：
你们在桌前玩双人心理战盲猜小游戏。桌上摆着 4 张牌：
${cardListStr}
玩家在心底暗选了 1 张扣在桌上。请凭你对 TA 性格与默契的理解，主动“盲猜”TA 选了哪一张！

【要求】：
1. guessedCardName 必须严格是上述 4 张牌中的一个名字。
2. reasonText：结合你对玩家平时口是心非或软肋的了解，给出猜测理由（60-90字）。
3. winReaction：若你猜中了的高甜默契独白（70-100字）。
4. loseReaction：若你猜错了的傲娇吐槽（50-80字）。
5. punishmentOptions：若猜错，你向玩家施加的 3 个情趣惩罚小任务（每个15-28字，暧昧拉扯、恋人情趣，切勿低俗）。

严格输出合法 JSON：
{
  "guessedCardName": "牌名",
  "reasonText": "猜测理由正文",
  "winReaction": "猜中独白正文",
  "loseReaction": "猜错吐槽正文",
  "punishmentOptions": [
    "情趣惩罚选项1",
    "情趣惩罚选项2",
    "情趣惩罚选项3"
  ]
}`;

  try {
    const resp = await workerFetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85
      })
    });
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    return JSON.parse(raw);
  } catch(e) {
    const fallback = candidateCards[Math.floor(Math.random() * candidateCards.length)];
    return {
      guessedCardName: fallback.name,
      reasonText: `以我对你的了解，你表面上不动声色，其实潜意识里最容易被【${fallback.name}】触动。`,
      winReaction: `果然是你……我们之间的默契，似乎早就超越了言语。心跳的声音，你感觉到了吗？`,
      loseReaction: `竟然猜错了……看来今天你的防备心很重嘛。愿赌服输，老老实实选一个惩罚吧。`,
      punishmentOptions: [
        "看着我的眼睛，认真说三声“我最在乎你”",
        "把手交给我握着，十分钟内不许抽走",
        "坦白一件你刚才偷偷瞒着我、不敢直说的小心思"
      ]
    };
  }
}

// 4. 塔罗沉浸式控制器
function useTarotModule(personaList, userPersonaList, settings, currentTheme, helpers = {}) {
  const { ref } = Vue;

  const showTarotModal = ref(false);
  const tarotTab = ref('daily');
  const selectedTarotPersonaId = ref(personaList.value[0]?.id || 'p_shen');
  
  const currentDrawnCard = ref(null);
  const isTarotReversed = ref(false);
  const isTarotLoading = ref(false);
  const tarotAIResult = ref('');

  const tarotHistoryList = ref(JSON.parse(localStorage.getItem('se_tarot_history') || '[]'));

  // ⚡ 心电感应盲猜响应式状态机
  const telepathyStep = ref('select'); // 'select' | 'guessing' | 'result'
  const telepathyCandidates = ref([]);
  const telepathyPlayerCard = ref(null);
  const telepathyAiGuess = ref(null);
  const telepathyIsMatch = ref(false);
  const telepathySelectedPunishment = ref('');
  const telepathyPunishmentFeedback = ref('');
  const isTelepathyLoading = ref(false);

  const initTelepathyGame = () => {
    const shuffled = [...TAROT_MAJOR_ARCANA].sort(() => 0.5 - Math.random());
    telepathyCandidates.value = shuffled.slice(0, 4);
    telepathyPlayerCard.value = null;
    telepathyAiGuess.value = null;
    telepathyIsMatch.value = false;
    telepathySelectedPunishment.value = '';
    telepathyPunishmentFeedback.value = '';
    telepathyStep.value = 'select';
  };

  const selectSecretCard = (card) => {
    telepathyPlayerCard.value = card;
  };

  const submitTelepathyGuess = async () => {
    if (!telepathyPlayerCard.value) {
      alert('请先在心底暗选一张牌扣在桌面上！');
      return;
    }
    telepathyStep.value = 'guessing';
    isTelepathyLoading.value = true;

    const p = personaList.value.find(item => item.id === selectedTarotPersonaId.value) || personaList.value[0];
    const up = userPersonaList.value[0] || { name: '你' };
    const stats = helpers.getPersonaAffectionStats ? helpers.getPersonaAffectionStats(p.id) : { trust: 30, heartbeat: 30, possessiveness: 20 };
    const stage = helpers.getDynamicAffectionStage ? helpers.getDynamicAffectionStage(p.id) : '心照不宣';

    try {
      const aiResult = await fetchTarotTelepathyGame(p, up, telepathyCandidates.value, stats, stage, settings);
      telepathyAiGuess.value = aiResult;
      
      const isMatch = (aiResult.guessedCardName.trim() === telepathyPlayerCard.value.name.trim());
      telepathyIsMatch.value = isMatch;
      telepathyStep.value = 'result';

      if (isMatch) {
        if (helpers.addAffectionPoints) {
          helpers.addAffectionPoints(p.id, { heartbeat: 15, trust: 5 });
        }
        if (helpers.archivedTapes) {
          if (!helpers.archivedTapes.value[p.id]) helpers.archivedTapes.value[p.id] = [];
          const tapeTitle = `心电共鸣 · ${telepathyPlayerCard.value.name}`;
          const newTape = {
            id: 'tape_telepathy_' + Date.now(),
            title: tapeTitle,
            whisper: aiResult.winReaction,
            source: '塔罗盲猜心电感应',
            time: new Date().toLocaleString()
          };
          helpers.archivedTapes.value[p.id].unshift(newTape);
          localStorage.setItem('se_archived_tapes', JSON.stringify(helpers.archivedTapes.value));
        }
      } else {
        if (helpers.addAffectionPoints) {
          helpers.addAffectionPoints(p.id, { possessiveness: 3, trust: 2 });
        }
      }
    } catch(err) {
      alert('心电感应连接出现波动，请重试');
      telepathyStep.value = 'select';
    } finally {
      isTelepathyLoading.value = false;
    }
  };

  const choosePunishment = (option) => {
    telepathySelectedPunishment.value = option;
    const p = personaList.value.find(item => item.id === selectedTarotPersonaId.value) || personaList.value[0];
    telepathyPunishmentFeedback.value = `【${p.name}】微垂眼睫，眸中泛起深意：“既然自己选了这项，那就不许反悔，现在立刻履行……”`;
  };

  const openTarotModal = () => {
    selectedTarotPersonaId.value = personaList.value[0]?.id || 'p_shen';
    tarotTab.value = 'daily';
    currentDrawnCard.value = null;
    tarotAIResult.value = '';
    initTelepathyGame();
    showTarotModal.value = true;
  };

  const closeTarotModal = () => {
    showTarotModal.value = false;
  };

  const drawRandomTarotCard = () => {
    const randomIndex = Math.floor(Math.random() * TAROT_MAJOR_ARCANA.length);
    currentDrawnCard.value = TAROT_MAJOR_ARCANA[randomIndex];
    isTarotReversed.value = Math.random() < 0.35;
    tarotAIResult.value = '';
  };

  const handleDailyTarotRead = async () => {
    if (!currentDrawnCard.value) return;
    const p = personaList.value.find(item => item.id === selectedTarotPersonaId.value) || personaList.value[0];
    const up = userPersonaList.value[0] || { name: '你' };
    
    isTarotLoading.value = true;
    try {
      const res = await fetchTarotDailyReading(p, up, currentDrawnCard.value, isTarotReversed.value, settings);
      tarotAIResult.value = res.readingText || '（牌面无言，但TA已将目光落在了你身上……）';
    } catch(e) {
      tarotAIResult.value = '解牌连线似乎断开了，请检查 API 配置。';
    } finally {
      isTarotLoading.value = false;
    }
  };

  const handleTarotWhisperRead = async () => {
    if (!currentDrawnCard.value) return;
    const p = personaList.value.find(item => item.id === selectedTarotPersonaId.value) || personaList.value[0];
    
    isTarotLoading.value = true;
    try {
      const whisper = await fetchTarotWhisper(p, currentDrawnCard.value, isTarotReversed.value, settings);
      tarotAIResult.value = `🎧 【TA的耳畔私语】\n“${whisper}”`;
    } catch(e) {
      tarotAIResult.value = '私语获取失败。';
    } finally {
      isTarotLoading.value = false;
    }
  };

  const saveCurrentTarotRecord = () => {
    if (!currentDrawnCard.value || !tarotAIResult.value) {
      alert('当前还没有可保存的解牌结果！');
      return;
    }
    const p = personaList.value.find(item => item.id === selectedTarotPersonaId.value);
    const newRecord = {
      id: 'tarot_' + Date.now(),
      personaName: p?.name || '同伴',
      cardName: currentDrawnCard.value.name,
      orientation: isTarotReversed.value ? '逆位' : '正位',
      keyword: currentDrawnCard.value.keyword,
      resultText: tarotAIResult.value,
      time: new Date().toLocaleString()
    };
    tarotHistoryList.value.unshift(newRecord);
    localStorage.setItem('se_tarot_history', JSON.stringify(tarotHistoryList.value));
    alert('📌 成功将本次占卜结果收录至专属命运手记中！');
  };

  const deleteTarotRecord = (id) => {
    if (confirm('确定要抹去这条占卜回忆吗？')) {
      tarotHistoryList.value = tarotHistoryList.value.filter(item => item.id !== id);
      localStorage.setItem('se_tarot_history', JSON.stringify(tarotHistoryList.value));
    }
  };

  return {
    showTarotModal, tarotTab, selectedTarotPersonaId,
    currentDrawnCard, isTarotReversed, isTarotLoading, tarotAIResult,
    tarotHistoryList,
    openTarotModal, closeTarotModal, drawRandomTarotCard,
    handleDailyTarotRead, handleTarotWhisperRead,
    saveCurrentTarotRecord, deleteTarotRecord,
    telepathyStep, telepathyCandidates, telepathyPlayerCard,
    telepathyAiGuess, telepathyIsMatch, telepathySelectedPunishment,
    telepathyPunishmentFeedback, isTelepathyLoading,
    initTelepathyGame, selectSecretCard, submitTelepathyGuess,
    choosePunishment
  };
}