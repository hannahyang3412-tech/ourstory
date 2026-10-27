// 模块 2：跑团推演、剧本大厅与自由沙盒 (Story Module)

const PRESET_SCRIPTS = [
  {
    id: "script_haunted_mansion",
    title: "雾隐古宅的第十三阶",
    tag: "悬疑解密",
    description: "荒废百年的尖顶古宅深立于浓雾之中。每一步都踩在亡者的琴弦上……",
    openingNarrative: `【第一幕·迷雾重重的夜宴邀请】
暴雨将至，黑压压的云层仿佛要将整座城市压碎。你们根据那封用鲜红火漆封口的匿名信，驱车来到了荒废百年的“雾隐古宅”门前。
信上写着：“若想知道十年前那场惨剧的真相，今夜子时，踏上第十三级台阶。”
空气中弥漫着浓重的腐叶味与冰冷的铁锈气息。身旁的同伴微微蹙眉，修长的手指按在车门把手上，侧眸凝视着你，目光中既有担忧也有纵容：“现在反悔还来得及……不过，既然你想来，我奉陪到底。”
厚重的铁门在风中发出刺耳的嘎吱声，仿佛一张择人而噬的巨口。
【当前危机】：浓雾正以肉眼可见的速度封锁退路，门缝深处隐约传来了幽诡的旧留声机音乐。`,
    systemRule: `【《雾隐古宅的第十三阶》大纲与结局判定规则】：
1. 核心目标：探索古宅地下室，揭开家族百年前的密室真相。
2. 固定分支：第一幕（前院与大门） -> 第二幕（长廊与钢琴房） -> 第三幕（地下室暗门）。
3. 结局导向：根据玩家选择，最终导向“真相大白”、“永远迷失在浓雾”或“黑夜反转”三大结局之一。`,
    themeColor: "amber",
    nodes: [{ choices: ["握住冰冷的铁门链条，用力将其拉开", "转头安抚同伴，低声商议应对策略", "用探照灯仔细勘查泥地里残留的神秘脚印"] }]
  },
  {
    id: "script_warm_sunset",
    title: "落日余晖下的旧书店",
    tag: "治愈日常",
    description: "晚风吹起风铃的叮当声，旧书店阁楼的茶香里，藏着尚未言说的心事。",
    openingNarrative: `【第一幕·风雨欲来的旧时光】
城市的喧嚣被隔绝在老街之外，你们在黄昏前夕躲进了这家名为“拾光”的独立旧书店。
外面的天空阴沉下来，雷声隐隐滚动，随后便下起了倾盆暴雨。
阁楼上的木质窗棂半掩着，空气里飘散着陈旧纸张与现煮红茶的温热香气。你们并肩坐在靠窗的沙发上，窗外是被雨水模糊的霓虹。
同伴为你倒了一杯驱寒的热红茶，指尖不经意间触碰到你的手背，温热而笃定：“外面雨大，今晚……这里只有我们。”
【当前局势】：暴雨阻断了归路，旧书店深处的一本泛黄手记似乎正等待着被翻开。`,
    systemRule: `【《落日余晖下的旧书店》大纲与结局判定规则】：
1. 核心目标：在旧书店度过一个温馨的下午，化解彼此心结。
2. 固定制约：保持治愈、细腻、克制的暧昧氛围，不得出现血腥暴力。`,
    themeColor: "rose",
    nodes: [{ choices: ["接过热红茶，顺势轻握住同伴的手指", "翻开那本夹着干花书签、写满旧日秘密的诗集", "转头凝视对方的侧脸，轻声问起TA心中的遗憾"] }]
  },
  {
    id: "script_cyber_rain",
    title: "霓虹雨巷的仿生私语",
    tag: "科幻近未来",
    description: "连绵暴雨笼罩着赛博天际线，破碎的记忆芯片让两人的心跳发生同频共振。",
    openingNarrative: `【第一幕·绝密芯片的致命追踪】
新亚特兰蒂斯核心区的酸雨腐蚀着街边的巨型全息招牌，发出滋滋的电流刺痛。
你们刚刚从“神树科技”的地下实验室死里逃生，手里紧紧攥着一枚关乎全城生死、代号为“伊甸”的残破记忆芯片。
身后高架桥上，治安局的重型追击无人机正呼啸而过，红外扫描光束不断扫过你们藏身的小巷。
同伴的义体散热孔正冒着白烟，系统超载让TA的额角渗出冷汗，却依然强撑着将你护在身后：“别怕，核心数据还没上传，我们还有机会。”
【当前 crisis】：追兵离巷口只有不到300米，终端开始发出刺耳的解密倒计时警报。`,
    systemRule: `【《霓虹雨巷的仿生私语》大纲与结局判定规则】：
1. 核心目标：追查记忆芯片源头，对抗赛博公司追捕。
2. 固定分支：雨夜巷战 -> 地下黑客诊所 -> 决战天台。
3. 结局导向：导向“双人逃亡世外桃源”或“记忆重置的永恒遗憾”。`,
    themeColor: "cyan",
    nodes: [{ choices: ["迅速检查同伴的义体损耗，将便携冷却剂注入接口", "立刻接入街角废弃终端，强行黑入治安局网络制造混乱", "拉起同伴潜入更深的阴影，寻找地下黑医的接头点"] }]
  },
  {
    id: "script_palace_jealousy",
    title: "深宫暮雪的琉璃盏",
    tag: "权谋修罗场",
    description: "深红宫墙隔断飞雪，烛影摇曳间，彼此眼神中的占有与试探无所遗形。",
    openingNarrative: `【第一幕·权力漩涡中的鸿门宴】
年关将至，一场漫天大雪将紫禁城的琉璃瓦覆上一层肃杀的白。
今夜的御前夜宴是一场针对你们家族的惊天杀局，各方势力各怀鬼胎，虎符的下落更是举朝瞩目的焦点。
借着更衣的借口，你们暂且退到了这偏僻冷清的御花园长廊下。四周雪落无声，但暗处的锦衣卫暗哨和敌对派系的眼线正如同恶狼般环伺。
同伴反手将你按在雕花朱红柱子旁，温热的吐息拂过你的耳畔，语气危险而深情：“今晚不管发生什么，你只能信我……若你敢单独向政敌妥协，我便让整个京城为你陪葬。”
【当前局势】：宴会大殿内钟声已敲响第三下，留给你们破局的时间所剩无几。`,
    systemRule: `【《深宫暮雪的琉璃盏》大纲与结局判定规则】：
1. 核心目标：在宫廷权谋漩涡中保全彼此，揪出幕后黑手。
2. 固定分支：御前夜宴 -> 冷宫对质 -> 宫门夺权。
3. 结局导向：导向“权倾朝野携手隐退”或“深宫孤寂的权力巅峰”。`,
    themeColor: "purple",
    nodes: [{ choices: ["直视对方幽深的双眸，毫不退让地反问其今晚的真实底牌", "伸手替对方拂去肩头的落雪，低声安抚并交换应对政敌的密折", "冷冷推开对方，独自转身准备重回大殿直面群臣"] }]
  },
  {
    id: "script_abyss_echoes",
    title: "深渊回响",
    tag: "悬疑解密",
    description: "基调刺激、烧脑、充满罗生门。必须严格推进四幕，并根据玩家表现导向三大结局。",
    openingNarrative: `【第一幕·暴雨中的生死安全屋】
凌晨三点，一场蓄谋已久的连环大爆炸将跨海大桥炸断，你们作为唯一的“嫌疑人”浑身是血地逃进了城郊这座废弃汽修厂。
桌上散落着同伴老二生前留下的加密硬盘，里面正循环播放着一段指向高级警官的求救录音。
然而，外面的警笛声已经将汽修厂团团包围，更可怕的是——在刚才的逃亡中，你们发现彼此的通讯器里，竟然都被人神不知鬼不觉地植入了定位程序。
同伴一边给手枪上膛，一边用锐利冰冷的目光上下打量着你：“车上的时候，只有你有机会碰过那个炸弹控制器……你到底是谁的人？”
【当前局势】：安全屋外传来了沉重的撞门声，信任瞬间降至冰点。`,
    systemRule: `【《深渊回响》完整导演大纲与结局判定规则】：
基调刺激, 烧脑, 充满罗生门。必须严格推进四幕, 并根据玩家表现导向三大结局之一:
1. 第一幕（暴雨安全屋）：汽修厂搜证。查老二遗物、求救短信（指向高级警官）、加密数据流向。
2. 第二幕（海鲜冷库与医院暗线）：阿杰未死。阿杰指控维多利亚是卧底，维多利亚反控阿杰是双面间谍。
3. 第三幕（内讧边缘）：信任崩塌，合围逼近，面临倒戈、顺从或独立黑吃黑的抉择。
4. 第四幕（跨海大桥终局与三大结局）：
   - 结局1【正义的闭环】：还原真相并与维多利亚/警方联手，揭露幕后金融巨鳄，获特赦减刑。
   - 结局2【虚无的实验】：发现逻辑漏洞，打开保险箱里面只有心理评估报告与面部特写，整场劫案是高级全息心理实验。
   - 结局3【完美隐匿】：谁也不信，利用黑客技术私吞海外不记名资产，几年后在热带海滩过上逍遥快活的隐匿生活。`,
    themeColor: "amber",
    nodes: [
      { 
        choices: [
          "冷笑一声，反手夺过对方的枪并亮出桌上隐藏的加密求救短信", 
          "不作辩解，直接一把夺过加密硬盘，抢先尝试破解爆炸前3分钟的数据流向", 
          "试图安抚暴怒的同伴，暗示外面的包围圈里有内鬼，必须立刻联手突围"
        ] 
      }
    ]
  }
];

const DEFAULT_WRITING_STYLES = [
  { id: 'st_1', name: '克苏鲁悬疑冷峻', prompt: '冷峻克制，多用短句，注重心理博弈与暗黑未知感。' },
  { id: 'st_2', name: '细腻温情修罗场', prompt: '细腻入微，多视角刻画同伴间眼神较劲、隐秘吃醋与克制的心跳。' }
];

function parseStoryResponseFull(fullText) {
  let storyPart = fullText;
  let choicesList = [];
  if (fullText.includes('<<<CHOICES>>>')) {
    const parts = fullText.split('<<<CHOICES>>>');
    storyPart = parts[0].trim();
    choicesList = parts[1].trim().split('\n').map(l => l.replace(/^[\d\.\-\*、\s]+/, '').trim()).filter(Boolean).slice(0, 3);
  }
  if (!choicesList.length) {
    choicesList = ["向前深入探查", "环顾周遭细微动静", "与身旁同伴交换对策"];
  }
  return { storyPart, choicesList };
}

// 封装 Vue 组合逻辑：剧本流与沙盒推演引擎
function useStoryModule(dependencies) {
  const { ref, reactive, computed, watch, nextTick } = Vue;
  const {
    currentTheme,
    settings,
    personaList,
    userPersonaList,
    chosenPersonaIds,
    chosenUserPersonaId,
    currentStep,
    helpers
  } = dependencies;

  const {
    cleanApiKey, normalizeBaseUrl, workerFetch,
    getPrimaryCompanionObj, addAffectionPoints, getActiveWorldbooksPrompt, getPersonaName
  } = helpers;

  const scripts = ref(PRESET_SCRIPTS);
  const customWritingStyles = ref(DEFAULT_WRITING_STYLES);
  
  const getScriptCardStyle = (tag) => {
    const isWarm = currentTheme.value === 'warm';
    switch (tag) {
      case '悬疑解密': return isWarm ? 'bg-gradient-to-br from-amber-100/90 via-orange-50 to-stone-100 border-amber-300' : 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-indigo-950/50 border-amber-500/40';
      case '治愈日常': return isWarm ? 'bg-gradient-to-br from-rose-100/90 via-pink-50 to-orange-50 border-rose-300' : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-pink-950/40 border-rose-500/40';
      case '科幻近未来': return isWarm ? 'bg-gradient-to-br from-cyan-100/90 via-sky-50 to-blue-50 border-cyan-300' : 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/40 border-cyan-500/40';
      case '权谋修罗场': return isWarm ? 'bg-gradient-to-br from-purple-100/90 via-fuchsia-50 to-rose-50 border-purple-300' : 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border-purple-500/40';
      default: return isWarm ? 'bg-gradient-to-br from-emerald-100/90 via-stone-100 to-amber-50 border-emerald-300' : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700';
    }
  };

  const getScriptTagStyle = (tag) => {
    const isWarm = currentTheme.value === 'warm';
    switch (tag) {
      case '悬疑解密': return isWarm ? 'bg-amber-200/80 border-amber-300 text-amber-950' : 'bg-amber-500/20 border-amber-500/40 text-amber-300';
      case '治愈日常': return isWarm ? 'bg-rose-200/80 border-rose-300 text-rose-950' : 'bg-rose-500/20 border-rose-500/40 text-rose-300';
      case '科幻近未来': return isWarm ? 'bg-cyan-200/80 border-cyan-300 text-cyan-950' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
      case '权谋修罗场': return isWarm ? 'bg-purple-200/80 border-purple-300 text-purple-950' : 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      default: return isWarm ? 'bg-stone-200 border-stone-300 text-stone-800' : 'bg-slate-700 border-slate-600 text-slate-300';
    }
  };

  const getScriptBtnStyle = (tag) => {
    switch (tag) {
      case '悬疑解密': return 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20';
      case '治愈日常': return 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20';
      case '科幻近未来': return 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20';
      case '权谋修罗场': return 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20';
      default: return 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20';
    }
  };

  const selectedScript = ref(scripts.value[0]);
  const isFreeModeSelection = ref(false);
  const freeModeCustomOpening = ref('');

  // 基础状态与存储
  const activeSessions = ref(JSON.parse(localStorage.getItem('se_sessions')) || []);
  const currentSessionId = ref(localStorage.getItem('se_curr_sess_id') || null);

  const charAuthoredSessions = computed(() => activeSessions.value.filter(s => s.isCharAuthored));
  const freeSandboxSessions = computed(() => activeSessions.value.filter(s => s.isFreeMode && !s.isCharAuthored));
  const classicPresetSessions = computed(() => activeSessions.value.filter(s => !s.isFreeMode && !s.isCharAuthored));
  const currentScriptSessions = computed(() => {
    if (!selectedScript.value) return [];
    return classicPresetSessions.value.filter(s => s.title === selectedScript.value.title);
  });
  const currentSession = computed(() => activeSessions.value.find(s => s.id === currentSessionId.value) || null);

  const getSessionsForScript = (scriptTitle) => classicPresetSessions.value.filter(s => s.title === scriptTitle);

  // 打字推演流控变量
  const customInput = ref('');
  const isStreaming = ref(false);
  const isActionLocked = ref(false);
  const streamElapsed = ref(0);
  let streamInterval = null;
  const streamingRawText = ref('');
  const chatBoxRef = ref(null);

  // 独立弹窗控制
  const showCharAuthoredModal = ref(false);
  const showInventoryModal = ref(false);
  const showSummaryModal = ref(false);
  const showStyleModal = ref(false);
  const showImageModal = ref(false);
  const isSummarizing = ref(false);
  
  // 生图变量
  const imageGenOptions = reactive({ type: 'combo' });
  const isGeneratingImageNow = ref(false);
  let targetImageItem = null;
  const previewImgUrl = ref('');
  const newStyleForm = reactive({ name: '', prompt: '' });

  // 派生计算属性
  const activeChoices = computed(() => {
    if (!currentSession.value?.gameLogs) return [];
    const logs = currentSession.value.gameLogs;
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].type === 'engine' && Array.isArray(logs[i].choices) && logs[i].choices.length > 0) {
        return logs[i].choices;
      }
    }
    return ["向前深入探查", "环顾周遭细微动静", "与身旁同伴交换对策"];
  });

  const streamingCleanText = computed(() => {
    let t = streamingRawText.value;
    if (t.includes('<<<CHOICES>>>')) t = t.split('<<<CHOICES>>>')[0];
    return t.replace('<<<STORY>>>', '').trim();
  });

  const canRewind = computed(() => (currentSession.value?.gameLogs?.length || 0) > 1);

  // 监听持久化
  watch(activeSessions, async newVal => {
    if (typeof dbSetItem === 'function') await dbSetItem('se_sessions', JSON.parse(JSON.stringify(newVal)));
    try { localStorage.setItem('se_sessions', JSON.stringify(newVal)); } catch(e) {}
  }, { deep: true });

  const scrollToBottom = async () => {
    await nextTick();
    if (chatBoxRef.value) chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight;
  };

  // 动作函数
  const openScriptDetail = (script) => {
    selectedScript.value = script;
    currentStep.value = 'script_detail';
  };

  const selectScript = script => {
    isFreeModeSelection.value = false;
    selectedScript.value = script;
    currentStep.value = 'select_persona';
  };

  const openFreeModeDetail = () => {
    isFreeModeSelection.value = true;
    freeModeCustomOpening.value = '';
    currentStep.value = 'select_persona';
  };

  const confirmPersonaAndEnterGame = () => {
    const newSessId = 'sess_' + Date.now();
    const isFree = isFreeModeSelection.value;
    const userPersona = userPersonaList.value.find(u => u.id === chosenUserPersonaId.value) || userPersonaList.value[0];
    const companions = personaList.value.filter(p => chosenPersonaIds.value.includes(p.id));
    const companionNames = companions.map(c => c.name).join(' & ');

    let opening = '';
    let initialChoices = [];

    if (isFree) {
      opening = freeModeCustomOpening.value.trim() || '【自由沙盒】：夜色深沉，前方的道路交织着不可预知的变数。你们二人并肩而立，等待着命运的下一次叩击。';
      initialChoices = ["环顾四周并勘查现场", "向同行同伴确认方位", "迈步向前探寻未知路径"];
    } else {
      opening = selectedScript.value?.openingNarrative || '【序幕】：微光轻颤，你们的专属冒险拉开帷幕。';
      initialChoices = selectedScript.value?.nodes?.[0]?.choices || ["向前深入探查", "环顾周遭细微动静", "与身旁同伴交换对策"];
    }

    const newSession = {
      id: newSessId,
      isFreeMode: isFree,
      isCharAuthored: false,
      companionIds: [...chosenPersonaIds.value],
      userPersonaId: userPersona.id,
      title: isFree ? `自由沙盒 · ${companionNames}` : selectedScript.value.title,
      currentNodeIndex: 0,
      storySummary: '',
      targetWordCount: 1500,
      contextRounds: 5,
      inventory: [],
      mementos: [],
      selectedStyleId: 'st_1',
      gameLogs: [{
        type: 'engine',
        storyText: opening,
        choices: initialChoices,
        images: [],
        discoveredClues: [],
        discoveredMementos: [],
        companionPOV: ''
      }]
    };
    activeSessions.value.unshift(newSession);
    currentSessionId.value = newSessId;
    currentStep.value = 'game';
    scrollToBottom();
  };

  const resumeSession = sess => { currentSessionId.value = sess.id; currentStep.value = 'game'; scrollToBottom(); };
  const deleteSession = sessId => { activeSessions.value = activeSessions.value.filter(s => s.id !== sessId); };

  const executeAction = actionText => {
    if (!currentSession.value || isStreaming.value) return;
    currentSession.value.gameLogs.push({ type: 'player', text: actionText, isEditing: false });
    currentSession.value.pendingAction = true;
    scrollToBottom();
  };

  const triggerPendingAction = async () => {
    if (!currentSession.value || isStreaming.value) return;
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请配置API"); return; }

    currentSession.value.pendingAction = false;
    isStreaming.value = true;
    streamingRawText.value = '';
    streamElapsed.value = 0;
    streamInterval = setInterval(() => streamElapsed.value += 0.1, 100);

    const companions = personaList.value.filter(p => (currentSession.value.companionIds || []).includes(p.id));
    const compPrompts = companions.map(c => `【同伴·${c.name}】（称呼玩家：【${c.userNickname || '你'}】。\n外貌穿着：${c.appearance}\n核心性格与人设准则（绝对禁止OOC）：${c.personaPrompt || c.traits}）`).join('\n\n');

    const userP = userPersonaList.value.find(u => u.id === currentSession.value.userPersonaId) || userPersonaList.value[0];
    const userPersonaPrompt = `【当前玩家身份/面具设定】：姓名：${userP.name}，外貌/背景：${userP.appearance}。请在剧情中严格照此设定论述并互动，切勿张冠李戴。`;

    const targetWords = currentSession.value.targetWordCount || 1500;
    const rounds = currentSession.value.contextRounds || 5;

    const history = [];
    currentSession.value.gameLogs.forEach(l => {
      if (l.type === 'player') history.push({ role: 'user', content: l.text });
      else if (l.type === 'engine') history.push({ role: 'assistant', content: l.storyText });
    });

    const matchedWbPrompt = getActiveWorldbooksPrompt ? getActiveWorldbooksPrompt(currentSession.value.companionIds || []) : '';
    
    let currentScriptRule = '';
    if (!currentSession.value.isFreeMode && !currentSession.value.isCharAuthored) {
      const matchedScript = scripts.value.find(s => s.title === currentSession.value.title);
      if (matchedScript && matchedScript.systemRule) {
        currentScriptRule = matchedScript.systemRule;
      }
    }

    const systemPrompt = `你是一个顶级互动小说兼跑团推演引擎。请严格执行以下推演铁律：

1. 【剧本与大纲铁律】：
${currentScriptRule ? `${currentScriptRule}\n` : '遵循当前开放沙盒世界的物理法则与逻辑发展。'}
无论玩家如何自由发挥，你都必须巧妙承接，并将主线稳步推进至既定分支或终局，绝不悬空或随意烂尾。

2. 【人设绝对不OOC与互动约束】：
${userPersonaPrompt}
${compPrompts}
同伴的言行举止、心理活动必须100%符合其上述核心人设准则，严禁出现与人设不符的轻浮或崩坏举动。

3. 【上下文检查与防重复机制】：
在生成剧情前，必须仔细检查【此前剧情日志】，严禁重复使用前面已经出现过的场景描写、动作细节、台词梗或情节推进方式。每一次推进必须带来全新的信息增量或危机升级。

4. 【动作与语言冲突自检机制】：
在输出前进行逻辑自检：严禁出现物理矛盾。例如：若描写某角色“双手紧握方向盘”，绝不能同时写“TA把双手插进风衣口袋”。语言、神态、肢体动作必须完全协调统一。

5. 【世界书规则】：
${matchedWbPrompt ? `${matchedWbPrompt}\n` : ''}

6. 【格式与篇幅要求】：
- 深度刻画同伴与玩家的动作细节、隐秘眼神交锋与微表情。
- 篇幅约 ${targetWords} 字。
- 文末必须强制另起一行输出 <<<CHOICES>>>，紧接着输出 3 个后续行动选项（格式为：1. 选项一 2. 选项二 3. 选项三）。`;

    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-rounds * 2)],
          stream: true,
          temperature: 0.75
        })
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.trim().startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.trim().replace('data: ', ''));
              streamingRawText.value += parsed.choices?.[0]?.delta?.content || '';
              scrollToBottom();
            } catch(e) {}
          }
        }
      }

      const { storyPart, choicesList } = parseStoryResponseFull(streamingRawText.value);

      currentSession.value.gameLogs.push({
        type: 'engine',
        storyText: storyPart || '（推演推进中...）',
        choices: choicesList,
        images: [],
        discoveredClues: [],
        discoveredMementos: [],
        companionPOV: ''
      });
      if (typeof addAffectionPoints === 'function') {
        (currentSession.value.companionIds || []).forEach(cId => {
          const tAdd = Math.floor(Math.random() * 2) + 1;
          const hAdd = Math.floor(Math.random() * 2) + 1;
          addAffectionPoints(cId, { trust: tAdd, heartbeat: hAdd });
        });
      }
    } catch(e) {
      alert(`推演请求失败：${e.message}`);
    } finally {
      clearInterval(streamInterval);
      isStreaming.value = false;
      streamingRawText.value = '';
      scrollToBottom();
    }
  };

  const chooseOption = txt => executeAction(txt);
  const submitCustomAction = () => {
    if (!customInput.value.trim()) return;
    const t = customInput.value.trim();
    customInput.value = '';
    executeAction(t);
  };

  const startEdit = item => { item.isEditing = true; item.editText = item.text; item.editStory = item.storyText; };
  const cancelEdit = item => { item.isEditing = false; };
  const saveAndRegeneratePlayer = (item, idx) => {
    item.text = item.editText;
    item.isEditing = false;
    regenerateFromPlayer(idx);
  };
  const saveEditStory = item => { item.storyText = item.editStory; item.isEditing = false; };
  const deleteLog = idx => currentSession.value.gameLogs.splice(idx, 1);
  const regenerateFromPlayer = idx => {
    const act = currentSession.value.gameLogs[idx].text;
    currentSession.value.gameLogs = currentSession.value.gameLogs.slice(0, idx);
    executeAction(act);
  };
  const rollbackToLog = idx => { currentSession.value.gameLogs = currentSession.value.gameLogs.slice(0, idx + 1); };
  const rewindLastRound = () => {
    if (currentSession.value?.gameLogs?.length <= 1) return;
    if (currentSession.value.gameLogs.pop()?.type === 'player') currentSession.value.gameLogs.pop();
  };
  const resetCurrentGame = () => { if (confirm('确定重开？')) currentSession.value.gameLogs = currentSession.value.gameLogs.slice(0, 1); };
  const regenerateLastResponse = () => {
    currentSession.value.gameLogs.pop();
    const lastPlayer = currentSession.value.gameLogs.pop();
    if (lastPlayer) executeAction(lastPlayer.text);
  };

  const searchMicroCues = async item => {
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请配置API"); return; }
    item.isSearchingClues = true;
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: `请分析以下剧情文本，提取：
1. 剧情或搜查中发现的物理证据、线索或道具（填入 clues 数组，如没有可为空）。
2. 同伴暗中赠予或彼此互动中产生的浪漫心跳信物（填入 mementos 数组，如果不适合生成则保持空数组，不要强行生成）。
必须严格输出合法的 JSON 格式：
{"clues":[{"name":"线索名","desc":"简述"}],"mementos":[{"name":"信物名","desc":"简述"}]}
剧情文本：
${item.storyText}` }]
        })
      });
      const data = await resp.json();
      const rawContent = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      const parsedResult = JSON.parse(rawContent);
      
      item.discoveredClues = parsedResult.clues || [];
      item.discoveredMementos = parsedResult.mementos || [];

      if (item.discoveredClues.length === 0 && item.discoveredMementos.length === 0) {
        alert('🔍 细致搜查完毕：当前场景波澜不惊，没有发现特殊线索或信物。');
      }
    } catch(e) {
      alert('搜查微光线索解析失败：' + e.message);
    } finally { 
      item.isSearchingClues = false; 
    }
  };

  const toggleCompanionPOV = async item => {
    if (item.companionPOV) { item.companionPOV = ''; return; }
    const key = cleanApiKey(settings.apiKey);
    if (!key) return;
    item.isLoadingPOV = true;
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: `用第一人称简短写出同伴在这一刻的内心所想与克制的心绪：\n${item.storyText}` }]
        })
      });
      const data = await resp.json();
      item.companionPOV = data.choices?.[0]?.message?.content?.trim() || '';
    } catch(e) {} finally { item.isLoadingPOV = false; }
  };

  const openImageModal = item => { targetImageItem = item; showImageModal.value = true; };
  const confirmAndGenerateImage = async () => {
    if (!targetImageItem) return;
    isGeneratingImageNow.value = true;
    try {
      const firstChar = personaList.value.find(p => (currentSession.value?.companionIds || []).includes(p.id)) || personaList.value[0];
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`masterpiece, 8k, ${imageGenOptions.type}, ${firstChar?.appearance || ''}`)}?width=768&height=1024&nologo=true`;
      targetImageItem.images.push({ url, title: '剧情插画' });
      showImageModal.value = false;
    } catch(e) { alert('生图渲染失败'); } finally { isGeneratingImageNow.value = false; }
  };
  const removeImage = (item, idx) => item.images.splice(item.images.indexOf(item), 1);
  const previewImage = url => previewImgUrl.value = url;

  const generateAiSummary = async () => {
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请配置API"); return; }
    isSummarizing.value = true;
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: `请对以下历次跑团与剧情推演内容进行线索提炼，列出关键发现与同伴关系进展，字数控制在150字左右：\n${currentSession.value.gameLogs.map(l => l.storyText || l.text).join('\n')}` }]
        })
      });
      const data = await resp.json();
      currentSession.value.storySummary = data.choices?.[0]?.message?.content?.trim() || '';
    } catch(e) { alert('生成总结失败'); } finally { isSummarizing.value = false; }
  };

  const saveNewCustomStyle = () => {
    if (!newStyleForm.name.trim() || !newStyleForm.prompt.trim()) {
      alert('请完整填写文风名称与提示词！');
      return;
    }
    customWritingStyles.value.push({
      id: 'st_' + Date.now(),
      name: newStyleForm.name.trim(),
      prompt: newStyleForm.prompt.trim()
    });
    localStorage.setItem('se_custom_writing_styles', JSON.stringify(customWritingStyles.value));
    newStyleForm.name = '';
    newStyleForm.prompt = '';
    alert('新文风添加成功！');
  };

  const deleteCustomStyle = (stId) => {
    if (customWritingStyles.value.length <= 1) {
      alert('至少需要保留一种文风！');
      return;
    }
    if (confirm('确定删除此自定义文风吗？')) {
      customWritingStyles.value = customWritingStyles.value.filter(s => s.id !== stId);
      localStorage.setItem('se_custom_writing_styles', JSON.stringify(customWritingStyles.value));
    }
  };

  const getCurrentStyleName = () => customWritingStyles.value.find(s => s.id === currentSession.value?.selectedStyleId)?.name || '默认文风';

  const addClueToInventory = (clue) => {
    if (!currentSession.value) return;
    if (!currentSession.value.inventory) {
      currentSession.value.inventory = [];
    }
    if (!currentSession.value.inventory.some(i => i.name === clue.name)) {
      currentSession.value.inventory.push({ ...clue });
      alert(`📦 已成功将【${clue.name}】收录进随身背包（证据/线索档案）！`);
    } else {
      alert(`【${clue.name}】已经稳妥地收在背包里了哦~`);
    }
  };

  const addMementoToBox = (mem) => {
    const compId = getPrimaryCompanionObj(currentSession.value)?.id || personaList.value[0]?.id;
    if (!compId) return;
    if (!currentSession.value.mementos) {
      currentSession.value.mementos = [];
    }
    if (!currentSession.value.mementos.some(m => m.name === mem.name)) {
      currentSession.value.mementos.push({ ...mem, personaId: compId });
      alert(`💖 已成功将【${mem.name}】收录至【${getPersonaName(compId)}】的专属心跳信物箱！`);
    } else {
      alert(`【${mem.name}】已经在信物箱里珍藏着了~`);
    }
  };

  return {
    scripts, getScriptCardStyle, getScriptTagStyle, getScriptBtnStyle,
    selectedScript, isFreeModeSelection, freeModeCustomOpening,
    activeSessions, currentSessionId, currentSession, charAuthoredSessions, freeSandboxSessions, classicPresetSessions, currentScriptSessions,
    customInput, isStreaming, isActionLocked, streamElapsed, streamingRawText, chatBoxRef,
    showCharAuthoredModal, showInventoryModal, showSummaryModal, showStyleModal, showImageModal,
    customWritingStyles, newStyleForm, imageGenOptions, isGeneratingImageNow, targetImageItem, previewImgUrl, isSummarizing,
    activeChoices, streamingCleanText, canRewind,
    openScriptDetail, selectScript, openFreeModeDetail, confirmPersonaAndEnterGame, resumeSession, deleteSession,
    executeAction, triggerPendingAction, chooseOption, submitCustomAction,
    startEdit, cancelEdit, saveAndRegeneratePlayer, saveEditStory, deleteLog, regenerateFromPlayer, rollbackToLog, rewindLastRound, resetCurrentGame, regenerateLastResponse,
    searchMicroCues, toggleCompanionPOV, generateAiSummary, saveNewCustomStyle, deleteCustomStyle, getCurrentStyleName, getSessionsForScript,
    openImageModal, confirmAndGenerateImage, removeImage, previewImage, addClueToInventory, addMementoToBox, scrollToBottom
  };
}