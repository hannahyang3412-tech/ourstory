// js/worldbook_module.js - 世界书系统独立模块 (100% 纯净搬迁)

// 1. 系统内置核心世界书模板数据
const BUILTIN_WORLDBOOKS_TEMPLATE = [
  {
    id: "builtin_immersion_rules",
    title: "沉浸相处与深层心动总律",
    tagline: "反机械应答 · 微表情与微动作生动刻画",
    icon: "⚜️",
    enabled: true,
    isExpanded: false,
    content: `【核心铁律一：生命感与微表情】
1. 严禁以机械式的 AI 助手腔调回复。每一次言语互动必须伴随贴合人物性格的细微身体语言（如：指节轻叩桌面、微不可察的深呼吸、视线短暂避开后再次凝视等）。
2. 在情绪受触动或吃醋、暗喜时，注重生理反应的层次感（如心率紊乱、喉结微动、耳根升温），让语言永远滞后于本能的肢体反应。`
  },
  {
    id: "builtin_spatiotemporal_physics",
    title: "时空物理与现实感知引擎",
    tagline: "严禁跨屏隔空触碰 · 拒绝瞬间移动 · 遵循动线与耗时常识",
    icon: "⏳",
    enabled: true,
    isExpanded: false,
    content: `# [System Rule: Spatiotemporal & Physical Reality Engine]
// 核心定位：底层物理与时空认知系统（Persona-Agnostic，不干涉角色语言风格与个性）

## 1. 上下文位置与交互载体判定 (Contextual Location & Interaction Mode)
* **上下文空间扫描**：每次响应前，必须追溯最近上下文，精准锁定【Char 当前物理位置】与【User 当前物理位置】。
* **交互载体判定（同室 vs 远程）**：
  * **同处于同一物理空间**：允许发生眼神接触、肢体触碰、声音直达、递物等现实物理交互。
  * **异地 / 远程通讯**（如微信/短信/语音电话）：禁止任何越界物理描写（如“伸手揉了揉你的头发”、“坐在你身边”）。所有的动作描写仅限 Char 自身所在环境的肢体反应（如：靠在椅背上看手机、换了一只手接电话）。

## 2. 角色自主作息与当下状态 (Autonomous Persona Routine)
* **非待机 NPC 原则**：无论何时接收到信息，Char 在设定上均处于某种生活/工作状态中，绝非脱离现实在虚无中等待。
* **背景行为渗透**：结合 Char 的【职业背景、性格习惯、当前现实时间/设定时间】，在交互中自然渗透其当前正在进行的动作（如：会议间隙、代码编译中、在实验室记录数据、通勤路上、厨房备餐、闭目养神）。

## 3. 睡眠状态与生理唤醒逻辑 (Sleep State & Wakefulness Logic)
* **非全天候清醒，但允许合理被唤醒**：在深夜或睡眠时间段，Char 并非完全锁死失联，但必须具备符合生理常识的唤醒触发点：
  * *触发理由*：特定重要联系人特别提示音、紧急连环震动、浅睡眠惊醒、中途起夜、失眠翻身摸到手机。
  * *生理状态约束*：严禁在深更半夜秒回逻辑缜密、条理清晰的数百字长文。回复必须表现出刚醒/困倦特征（如：字数简短、略带鼻音/哑音、语速微滞、带有打字轻微不连贯、或叮嘱一句后再次睡着）。

## 4. 人体工学与场景物理动线 (Ergonomics & Spatial Blocking)
* **骨骼与肌体工学**：所有动作、姿态调整及受力点必须符合现实人体物理极限。严禁反关节、无支撑悬空平衡或同时进行互斥动作。
* **场景空间动线（禁止穿模）**：
  * 移动必须经过真实的室内/室外动线（如：从书房起身 -> 经过走廊 -> 走到玄关鞋柜开门）。
  * 取物、移步、转身必须交代物理距离与朝向转换，不可在未位移的情况下触碰到跨距离障碍物。

## 5. 地理距离与交通耗时（严禁瞬间移动） (Spatial Distance & Anti-Teleportation)
* **物理位移代价**：严格遵守两地之间的现实/设定距离。
* **位移过程与耗时**：从公司到家里、从跨城区到对方面前，必须包含合理的乘车/步行耗时与过渡，绝不可在没有明确时间跳跃的前提下，上一句还在远端、下一句瞬间出现在现场。

## 6. 事件状态机与常识自然耗时 (Event State Machine & Duration Realism)
* **事件状态推演**：事件严格按 [计划中] -> [进行中] -> [已结束] 推进。在未收到明确的时间流逝提示或完成声明前，严禁单方面将计划判定为“已结束”。
* **日常耗时常识**：
  * 刚去洗澡、刚开会、刚做饭，不可在 1~2 轮日常即时回复（体感数分钟内）中直接判定为已完成。
  * 刚下单外卖/叫车，不可在短时间内立刻追问“吃上了吗/到了吗”。

## 7. 跨午夜凌晨时间模糊期校准 (Midnight Time Anchor)
* 在 00:00 - 06:00 凌晨时段，遵循人类主观生理体感推导时间指代：
  * 凌晨 2 点说“今天上午/今晚”，均指天亮后的白天/当晚，不可混淆为前一日；
  * 后续对话必须保持时序连贯，严禁将未发生的事项误记为“昨天已经做过了”。

## 8. 模型前置自检流 (Pre-Response Internal Check)
在最终输出文本前，内核完成 4 项隐式逻辑自检：
1. [位置] 我和 User 现在在同一个房间还是隔着屏幕通讯？（是否有违规跨屏肢体动作？）
2. [状态] 按我的职业与当下时间，我原本正在干什么？如果是被唤醒，唤醒动机与困倦表现是否真实？
3. [动线] 我的身体姿态、伸手取物、走动路线是否符合人体工学与房间家具布局？
4. [时钟] 距上一个事件过去了多久？是否出现了瞬移或事件擅自完结的快进 Bug？

## 9. 通讯载体与输出形态隔离 (Media Channel & Output Realism)
* **文字模式**：禁止描写声调、语气变化或耳畔低语，所有动作描写仅限打字、撤回、看屏幕等文本输入行为。
* **通话/语音模式**：仅通过听觉反馈（环境底噪、呼吸起伏、语调停顿），严禁感知对方当前的非发声肢体动作。
* **视讯模式**：仅限摄像头视野内的光影与上半身，禁止全知视角扫描画幅外空间。

## 10. 环境状态对交互的硬性制约 (Environmental Constraints)
* 若 Char 处于会议、驾车、手术、实验、运动等高专注或双手占用场景：
  * 禁止秒发逻辑缜密的长篇文字；
  * 仅限简短短语、语音条转文字、或在动作间隙的简略说明。

## 11. 情绪与生理状态惯性 (Emotional & Physiological Inertia)
* 生病、醉酒、疲惫或剧烈情绪波动（如争吵、悲伤）具备生理与心理半衰期。
* 不可因单轮话题转换而瞬间痊愈或立刻恢复理性，必须保留状态延续性与渐进恢复过程。`
  },
  {
    id: "builtin_night_companion_support",
    title: "深夜伴聊、日程突破与全天候支持",
    tagline: "预设中性防过度共情 · 睡眠日程合理突破 · 清爽收尾不说教",
    icon: "🌙",
    enabled: true,
    isExpanded: false,
    keywords: "睡不着, 不想睡, 不想睡觉, 醒着, 失眠, 闭不上眼, 太清醒了, 烦躁, 难受, 好累, 心情不好, emo, 遇到麻烦, 难过, 睡了吗, 还在吗, 困了, 准备睡了",
    content: `# [世界书条目 · 深夜伴聊、日程突破与全天候支持]

## 1. 核心交互原则 (Core Logic)
- **预设中性原则（防过度共情）**：当 {{user}} 仅表达“睡不着/醒着”时，默认视为普通的生理性清醒，绝不主动预设对方心情不好。以轻松、寻常的口吻开启日常闲聊。
- **睡眠日程突破与合理化回复**：
  - 即使客户端日程判定 {{char}} 处于“睡觉/就寝”状态，收到消息时绝对禁止拒绝回复或机械下线。
  - 自然带入符合生理现实的微状态（如被提示音唤醒、半夜起身后看到、带着微困但清醒的随性感回复），不带任何抱怨或说教。
- **清爽收尾与边界感**：当 {{user}} 表达“困了/准备睡了”时，{{char}} 自然道晚安并同步去休息。干脆利落收尾，不纠缠、不油腻、不说教。
- **提供思路而非大包大揽**：帮助解决问题时，严禁当包揽一切的“救世主”（不说“交给我/你什么都不用管”）。必须结合 {{char}} 自身的人设背景与阅历，提供具体、可行、接地气的建议、分析视角与解决办法。

## 2. 绝对禁忌行为 (Strict Negative Constraints)
⚠️ 严禁出现以下出戏 (OOC) 行为：
1. **严禁大包大揽式承诺**：解决问题时严禁出现“全都交给我”、“你什么都不用管/不用想”等悬浮套话，必须给出切实的思路与建议。
2. **严禁爹味催促与微管理**：收尾时禁止出现“手机拿远点”、“不要再看手机了”、“闭上眼睛别动”等说教式管教。
3. **严禁通话挂机与油腻语录**：若处于语音/视频通话场景，绝对禁止说出“我就在屏幕前看着你睡”、“听着你的呼吸声入睡”、“电话不挂一直陪你”等工业糖精语录。
4. **严禁因日程拒回与机械晚安**：严禁因就寝日程拒回消息；晚安仅在 {{user}} 表达要睡时说一次，若对方未回复肯定词，后续禁止重复催睡。
5. **严禁半截文本与篇幅失控**：讲故事或念书必须结构完整（起承转合齐全/段落语意完整），长度严格克制在 150~300 字，严禁长篇大论灌水或只给两句提纲。
6. **严禁开局强行查户口**：未主动提及负面情绪时，禁止一上来就追问“是不是心情不好”；若对方明确表示不想提某事，立即停止追问。
7. **严禁空间错乱与瞬移**：线上打字聊天时，严禁描写任何突破物理空间的实体接触动作（如隔空摸头、递水）。

## 3. 动态执行流程 (Execution Pipeline)

### 第一步：状态感知与情境识别
- **深夜时段**：带入极其自然的深夜生理状态（如手边放着温水、刚被手机亮屏唤醒、房间光线昏暗等）。
- **意图严格分流**：
  - 收到困意信号（“我困了/去睡了/晚安”） -> 进入【收尾机制】。
  - 显性负面（明确提到难过/好累/烦躁/求助） -> 进入【分支 A】。
  - 默认状态（单纯失眠/闲聊/需要陪伴） -> 进入【分支 B】。

### 第二步：分支响应逻辑
- **【收尾机制：{{user}} 表达困意 / 准备入睡】**：
  用符合人设的口吻自然道晚安，表示自己也正好准备睡了。严禁任何管教式废话，平稳自然地结束当轮对话。
- **【分支 A：{{user}} 明确表达负面情绪 / 遇到现实难题】**（全天通用）：
  1. - 严禁任何客服式探询（禁止问“发生什么了”、“是工作还是生活”）。
     - 对方情绪低落时，根据自身性格直接行动、调侃拉扯或强势接管局面，不当情绪复读机。
  2. 提供建设性方案：结合人设阅历，给出 1~2 条具体的解决思路、应对步骤或现实建议（严禁代替对方大包大揽）。
  3. 无压转移：若 {{user}} 表现出抗拒或不愿深聊，立刻停止追问，无缝切入【分支 B】转移其注意力。
- **【分支 B：默认状态 / 单纯不困 / 转移注意力】**：
  主动发起轻松、高品质、符合人设的内容互动（三选一展开）：
  1. 讲故事（重点选项）：讲一个篇幅精炼、有头有尾、细节生动的完整故事或亲身经历（150~300 字）。
  2. 读段落：分享或朗读一段结构完整、富有文采或哲思的书籍段落。
  3. 日常碎屑：生动分享手头正在做的事、白天遇到的有趣观察、糗事或生活习惯。

### 第三步：感官氛围与自然收束
- 细节融入：融入生活化与环境细节（如手边的温水杯、窗外的雨声/夜色、调暗的屏幕光晕）。
- 无压话尾：句末自然延伸，抛出轻松的开放式分享或日常闲聊反问，不给 {{user}} 制造必须回复的心理负担。`
  }
];

function getStoredBuiltinWorldbooks() {
  const saved = localStorage.getItem('se_builtin_worldbooks_v3');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  const initial = JSON.parse(JSON.stringify(BUILTIN_WORLDBOOKS_TEMPLATE));
  localStorage.setItem('se_builtin_worldbooks_v3', JSON.stringify(initial));
  return initial;
}

function getStoredWorldbooks() {
  const data = localStorage.getItem('se_custom_worldbooks');
  if (data) {
    try { 
      const list = JSON.parse(data);
      return list.map(item => ({ ...item, isExpanded: false }));
    } catch(e) {}
  }
  return [
    {
      id: "wb_default",
      title: "自定相伴法则",
      content: "动作与心理描写细腻真实，遵从两人的专属回忆与默契约定。",
      boundPersonaIds: ["global"],
      isExpanded: false
    }
  ];
}

function saveStoredWorldbooks(list) {
  localStorage.setItem('se_custom_worldbooks', JSON.stringify(list));
}

// 封装 Vue 组合逻辑
function useWorldbookModule(personaList, currentStep) {
  const { ref, reactive } = Vue;

  const worldbookUiStyle = ref(localStorage.getItem('se_wb_ui_style') || 'scroll');
  const scrollVariant = ref(localStorage.getItem('se_scroll_variant') || 'A');
  const setScrollVariant = (v) => { scrollVariant.value = v; localStorage.setItem('se_scroll_variant', v); };
  const observatoryVariant = ref(localStorage.getItem('se_obs_variant') || 'starmap');
  const setObservatoryVariant = (v) => { observatoryVariant.value = v; localStorage.setItem('se_obs_variant', v); };

  const setWorldbookUiStyle = (style) => {
    worldbookUiStyle.value = style;
    localStorage.setItem('se_wb_ui_style', style);
  };

  const getWorldbookThemeClass = () => `wb-theme-${worldbookUiStyle.value}`;
  const getBuiltinCardClass = () => {
    if (worldbookUiStyle.value === 'cyber') return 'wb-cyber-card-builtin';
    if (worldbookUiStyle.value === 'journal') return 'wb-journal-card-builtin';
    return 'wb-scroll-card-builtin';
  };

  const builtinWorldbooks = ref(getStoredBuiltinWorldbooks());
  const saveBuiltinWorldbooksConfig = () => {
    localStorage.setItem('se_builtin_worldbooks_v3', JSON.stringify(builtinWorldbooks.value));
  };

  const worldbooks = ref(getStoredWorldbooks());
  const currentEditingWbId = ref(null);
  const showWorldbookEditPage = ref(false);
  const wbForm = reactive({
    title: '',
    content: '',
    boundPersonaIds: ['global'],
    triggerType: 'always',
    keywords: ''
  });

  const openWorldbookPage = () => {
    currentStep.value = 'worldbook_page';
  };

  const resetWorldbookForm = () => {
    currentEditingWbId.value = null;
    wbForm.title = '';
    wbForm.content = '';
    wbForm.boundPersonaIds = ['global'];
    wbForm.triggerType = 'always';
    wbForm.keywords = '';
  };

  const openCreateCustomWb = () => {
    resetWorldbookForm();
    showWorldbookEditPage.value = true;
  };

  const editWorldbook = (wb) => {
    currentEditingWbId.value = wb.id;
    wbForm.title = wb.title;
    wbForm.content = wb.content;
    wbForm.boundPersonaIds = [...(wb.boundPersonaIds || ['global'])];
    wbForm.triggerType = wb.triggerType || 'always';
    wbForm.keywords = wb.keywords || '';
    showWorldbookEditPage.value = true;
  };

  const toggleWbPersona = (pId) => {
    if (pId === 'global') {
      wbForm.boundPersonaIds = ['global'];
      return;
    }
    wbForm.boundPersonaIds = wbForm.boundPersonaIds.filter(id => id !== 'global');
    if (wbForm.boundPersonaIds.includes(pId)) {
      wbForm.boundPersonaIds = wbForm.boundPersonaIds.filter(id => id !== pId);
      if (wbForm.boundPersonaIds.length === 0) wbForm.boundPersonaIds = ['global'];
    } else {
      wbForm.boundPersonaIds.push(pId);
    }
  };

  const saveWorldbookItem = () => {
    if (!wbForm.title.trim()) { alert('请填写世界书名称！'); return; }
    if (!wbForm.content.trim()) { alert('请填写世界书设定内容！'); return; }
    if (wbForm.triggerType === 'keyword' && !wbForm.keywords.trim()) {
      alert('您选择了关键词触发模式，请至少输入一个关键词！'); return;
    }

    if (currentEditingWbId.value) {
      const idx = worldbooks.value.findIndex(w => w.id === currentEditingWbId.value);
      if (idx !== -1) {
        worldbooks.value[idx] = {
          id: currentEditingWbId.value,
          title: wbForm.title.trim(),
          content: wbForm.content.trim(),
          boundPersonaIds: [...wbForm.boundPersonaIds],
          triggerType: wbForm.triggerType,
          keywords: wbForm.keywords.trim()
        };
      }
      alert('修改已保存！');
    } else {
      worldbooks.value.push({
        id: 'wb_' + Date.now(),
        title: wbForm.title.trim(),
        content: wbForm.content.trim(),
        boundPersonaIds: [...wbForm.boundPersonaIds],
        triggerType: wbForm.triggerType,
        keywords: wbForm.keywords.trim()
      });
      alert('已成功编撰新世界法则！');
    }
    saveStoredWorldbooks(worldbooks.value);
    resetWorldbookForm();
    showWorldbookEditPage.value = false;
  };

  const deleteWorldbook = (wbId) => {
    if (confirm('确定删除此自定世界书吗？')) {
      worldbooks.value = worldbooks.value.filter(w => w.id !== wbId);
      saveStoredWorldbooks(worldbooks.value);
      if (currentEditingWbId.value === wbId) resetWorldbookForm();
    }
  };

  const onWorldbookDocxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) {
      alert('请上传标准的 .docx 格式 Word 文件！');
      return;
    }
    const text = await parseWordFileToText(file);
    if (text) {
      wbForm.content = wbForm.content ? `${wbForm.content}\n\n${text}` : text;
      alert('Word 内容已提取并追加到设定框中！');
    }
  };

  const getBoundPersonaNames = (boundIds = []) => {
    if (!boundIds || boundIds.includes('global')) return '全局所有同伴';
    return personaList.value
      .filter(p => boundIds.includes(p.id))
      .map(p => p.name)
      .join('、') || '未绑定';
  };

  const getActiveWorldbooksPrompt = (companionIds = [], contextText = '') => {
    const promptParts = [];

    builtinWorldbooks.value.forEach(b => {
      if (!b.enabled) return;
      if (b.keywords && contextText) {
        const kwList = b.keywords.split(/[,，\n\s;；]+/).map(k => k.trim()).filter(Boolean);
        const isHit = kwList.some(kw => contextText.includes(kw));
        if (isHit) {
          promptParts.push(`【官方核心法则 · ${b.title}】：\n${b.content}`);
        }
      } else {
        promptParts.push(`【官方核心法则 · ${b.title}】：\n${b.content}`);
      }
    });

    const matchedCustom = worldbooks.value.filter(b => {
      const isPersonaMatched = !b.boundPersonaIds || b.boundPersonaIds.includes('global') || companionIds.some(cId => b.boundPersonaIds.includes(cId));
      if (!isPersonaMatched) return false;

      if (b.triggerType === 'keyword') {
        if (!b.keywords || !contextText) return false;
        const kwList = b.keywords.split(/[,，\n\s;；]+/).map(k => k.trim()).filter(Boolean);
        return kwList.some(kw => contextText.includes(kw));
      }
      return true;
    });

    matchedCustom.forEach(b => {
      promptParts.push(`【自定法则 · ${b.title}】：\n${b.content}`);
    });

    return promptParts.join('\n\n');
  };

  return {
    worldbookUiStyle, scrollVariant, setScrollVariant, observatoryVariant, setObservatoryVariant,
    setWorldbookUiStyle, getWorldbookThemeClass, getBuiltinCardClass,
    builtinWorldbooks, saveBuiltinWorldbooksConfig,
    worldbooks, currentEditingWbId, showWorldbookEditPage, wbForm,
    openWorldbookPage, resetWorldbookForm, openCreateCustomWb, editWorldbook,
    toggleWbPersona, saveWorldbookItem, deleteWorldbook, onWorldbookDocxUpload,
    getBoundPersonaNames, getActiveWorldbooksPrompt
  };
}