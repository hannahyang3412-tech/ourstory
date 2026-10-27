// js/chat_module.js - 日常随聊、群聊、全品类外卖与即时配送模块
// ====== 新增：行程与环境感知、无手机环境检测辅助函数 ======
function getCharCurrentScheduleContext(charId, session) {
  try {
    const rawData = localStorage.getItem('se_char_schedules');
    if (!rawData) return null;
    const allSchedules = JSON.parse(rawData);

    // 确定基准日期与当前时间点
    let targetDateStr = '';
    let nowHour = 0;
    let nowMinute = 0;

    if (session?.timeMode === 'virtual' && session?.virtualDateTime) {
      const vDate = new Date(session.virtualDateTime);
      targetDateStr = `${vDate.getFullYear()}/${String(vDate.getMonth() + 1).padStart(2, '0')}/${String(vDate.getDate()).padStart(2, '0')}`;
      nowHour = vDate.getHours();
      nowMinute = vDate.getMinutes();
    } else {
      const now = new Date();
      targetDateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
      nowHour = now.getHours();
      nowMinute = now.getMinutes();
    }

    const currentTotalMinutes = nowHour * 60 + nowMinute;
    const scheduleKey = `${charId}_${targetDateStr}`;
    const todayList = allSchedules[scheduleKey] || [];

    // 匹配当前时间区间
    for (const item of todayList) {
      if (!item.timeRange) continue;
      const parts = item.timeRange.split('-');
      if (parts.length !== 2) continue;
      
      const parseTime = (str) => {
        const [h, m] = str.trim().split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const start = parseTime(parts[0]);
      const end = parseTime(parts[1]);

      if (currentTotalMinutes >= start && currentTotalMinutes <= end) {
        // 检测是否属于无法使用手机/断联的特殊环境
        const busyKeywords = ['手术', '会诊', '封闭会议', '开会', '飞行', '飞机', '高空', '执勤', '潜水', '无菌室', '实验中', '监考', '考试', '紧急排险', '屏蔽', '闭关'];
        const fullDesc = `${item.activity || ''} ${item.location || ''} ${item.detailedDesc || ''} ${item.status || ''}`;
        const isRestricted = busyKeywords.some(kw => fullDesc.includes(kw));

        return {
          currentActivity: item.activity,
          location: item.location,
          status: item.status,
          detailedDesc: item.detailedDesc,
          timeRange: item.timeRange,
          endTimeStr: parts[1].trim(),
          isRestricted: isRestricted
        };
      }
    }
  } catch (e) {
    console.warn("行程匹配计算异常:", e);
  }
  return null;
}

function createNewDailySession(personaId, userPersonaId, personaList) {
  const newId = 'daily_' + Date.now();
  const p = personaList.find(item => item.id === personaId) || personaList[0];
  return {
    id: newId,
    personaId: p.id,
    userPersonaId: userPersonaId,
    title: `${p.name} 的微信`,
    messages: [{ 
      role: 'assistant', 
      text: '在忙吗？刚看到消息。',
      isVoice: false,
      voiceDuration: 0
    }]
  };
}

async function fetchDailyChatReply(session, persona, settings, userPersona = null) {
  const chatApiConfig = session.chatApi || {};
  const activeKey = cleanApiKey(chatApiConfig.apiKey) || cleanApiKey(settings.apiKey);
  const activeBase = normalizeBaseUrl(chatApiConfig.baseUrl) || normalizeBaseUrl(settings.baseUrl);
  const activeModel = (chatApiConfig.model && chatApiConfig.model.trim()) ? chatApiConfig.model.trim() : settings.model;

  if (!userPersona) {
    try {
      const storedUserList = JSON.parse(localStorage.getItem('se_user_persona_list') || '[]');
      userPersona = storedUserList.find(u => u.id === session.userPersonaId) || storedUserList[0] || null;
    } catch (e) {
      userPersona = null;
    }
  }

  const isOffline = session.isOfflineMode || false;
  const rounds = Number(session.contextRounds) || 10;
  let formattedHistory = [];

  const userPersp = session.userPerspective || '第二人称';
  const charPersp = session.charPerspective || '第三人称';
  const userRule = userPersp === '第一人称' ? '“我”' : (userPersp === '第二人称' ? '“你”' : `“${userPersona?.name || '她/他/它'}”`);
  const charRule = charPersp === '第一人称' ? '“我”' : (charPersp === '第二人称' ? '“你”' : `“${persona.name}”或第三人称`);
  const perspectiveRule = `【绝对视角指令】：在剧情描写中，必须严格使用 ${userRule} 来指代玩家（User），同时严格使用 ${charRule} 来指代同伴（Char）。严禁人称错乱。`;

  // ====== 优化 1：线上线下双向记忆完全贯通 ======
  // ====== 彻底纠正外卖归属认知偏差，双向记忆强连贯 ======
  const formatMsgToMemory = (m) => {
    const userName = userPersona?.name || '玩家';
    const charName = persona.name;
    if (m.isTakeout && m.takeoutData) {
      const itemsTitle = m.takeoutData.title || '餐品';
      const shopNote = m.takeoutData.receiptNote ? `，商家备注为：“${m.takeoutData.receiptNote}”` : '';
      const cardMsg = m.takeoutData.note ? `，夹带的留言为：“${m.takeoutData.note}”` : '';
      
      if (m.role === 'user') {
        return `[现实外卖真实记录：${userName} 主动花钱给 ${charName} 订送了【${itemsTitle}】送到门前${shopNote}${cardMsg}。这是 ${userName} 关心照顾 ${charName} 的心意，${charName} 是收礼受照顾方，应当表示感谢或心动，严禁记反！]`;
      } else {
        return `[现实外卖真实记录：${charName} 主动花钱为 ${userName} 挑选并订送了【${itemsTitle}】送到 ${userName} 家中${shopNote}${cardMsg}。这是 ${charName} 照顾心疼 ${userName} 的举动，${charName} 是赠送方，${userName} 是收礼受照顾方，严禁记反！]`;
      }
    }
    if (m.isNarrative) {
      return `[情境动作旁白]: ${m.text}`;
    }
    return `${m.role === 'user' ? userName : charName}: ${m.text}`;
  };

  // 提取近期线上记录
  const onlineList = session.messages || [];
  const recentOnline = onlineList.slice(-(rounds * 2));
  const recentOnlineText = recentOnline.map(formatMsgToMemory).join('\n');

  // 提取近期线下互动/约会记录
  const currentOfflineLogs = session.offlineLogs || [];
  let recentOffsetText = "";
  if (currentOfflineLogs.length > 0) {
    recentOffsetText = currentOfflineLogs.slice(-(rounds * 2)).map(l => {
      return l.type === 'player' ? `${userPersona?.name || '你'}: ${l.text}` : `${persona.name}: ${l.storyText}`;
    }).join('\n');
  } else if (session.dateRecords && session.dateRecords.length > 0) {
    const lastDate = session.dateRecords[0];
    recentOffsetText = `【最近一次线下约会(${lastDate.date})总结】：${lastDate.summary}`;
  }

  // ====== 优化 2：实时行程环境感知与无法使用手机的断联处理 ======
  const currentSched = getCharCurrentScheduleContext(persona.id, session);
  let schedulePrompt = "";
  
  if (currentSched) {
    schedulePrompt = `\n【📅 当前实时行程与物理情境感知】：
- 时段与位置：${currentSched.timeRange}，正处于【${currentSched.location}】。
- 行程活动：${currentSched.activity}（状态：${currentSched.status}）。
- 场景细节：${currentSched.detailedDesc}
【生活化原则】：在聊天或互动中，你对自己的所在地与当下状态完全清楚，可自然流露你手头在做的事，但绝不机械念说明。`;

    if (!isOffline && currentSched.isRestricted) {
      const lastUserMsg = [...onlineList].reverse().find(m => m.role === 'user');
      const lastMsgIsAutoReply = onlineList.length > 0 && onlineList[onlineList.length - 1].isAutoBusyReply;

      if (lastUserMsg && !lastMsgIsAutoReply) {
        const autoReplyPrompt = `你现在是同伴【${persona.name}】（性格：${persona.personaPrompt || persona.traits}）。
现在是 ${currentSched.timeRange}，你正在【${currentSched.location}】进行【${currentSched.activity}】（如手术/飞行/保密会议），严禁使用手机。
此时玩家【${userPersona?.name || '对方'}】给你发来了消息。
请以你的手机设置的【专属紧急自动回复/自动防打扰短信】口吻生成一句极短回复（30字以内）：
告诉对方你当前正在进行紧急事务不能看手机，预计结束时间约是【${currentSched.endTimeStr}】，让对方不要担心，结束会第一时间回复。
直接输出内容，不要引号：`;

        try {
          const autoResp = await workerFetch(`${activeBase}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeKey}` },
            body: JSON.stringify({
              model: activeModel,
              messages: [{ role: 'user', content: autoReplyPrompt }],
              temperature: 0.7
            })
          });
          const autoData = await autoResp.json();
          const autoText = autoData.choices?.[0]?.message?.content?.trim() || `【自动回复】：正在${currentSched.activity}中，预计${currentSched.endTimeStr}结束，稍后联系你。`;
          
          return {
            messagesList: [`📱【自动防打扰回执】：\n${autoText}`],
            isVoice: false,
            isAutoReply: true
          };
        } catch(e) {
          return {
            messagesList: [`📱【自动回执】：正在${currentSched.activity}，暂无法回复消息，预计${currentSched.endTimeStr}联系你。`],
            isVoice: false,
            isAutoReply: true
          };
        }
      }
    }
  }

  const longMemoryText = session.summaryMemory ? `\n【此前你们历经的深层回忆与故事线】：\n${session.summaryMemory}\n` : '';

  // ======= ⏱️ 智能时空机、时区时差与失联时长算法升级 =======
  // 1. 计算基准时间（如果开启了时空穿梭/虚拟时间，使用设定时间；否则使用当前现实时间）
  let baseTimestamp = Date.now();
  if (session.timeMode === 'virtual' && session.virtualDateTime) {
    const parsedVirtual = new Date(session.virtualDateTime).getTime();
    if (!isNaN(parsedVirtual)) {
      baseTimestamp = parsedVirtual;
    }
  }

  // 2. 玩家端时间
  const userDate = new Date(baseTimestamp);
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const userHour = userDate.getHours();
  const userPeriod = userHour < 6 ? "深夜" : (userHour < 12 ? "清晨/上午" : (userHour < 18 ? "下午" : "晚间"));
  const userTimeStr = `${userDate.getFullYear()}年${userDate.getMonth()+1}月${userDate.getDate()}日 ${days[userDate.getDay()]} ${String(userHour).padStart(2,'0')}:${String(userDate.getMinutes()).padStart(2,'0')}（${userPeriod}）`;

  // 3. 计算时区时差（Char 所在时区的时间）
  const tzOffset = Number(session.timeZoneOffset || 0); // 时差（小时，正负数）
  const charTimestamp = baseTimestamp + (tzOffset * 3600 * 1000);
  const charDate = new Date(charTimestamp);
  const charHour = charDate.getHours();
  const charPeriod = charHour < 6 ? "深夜" : (charHour < 12 ? "清晨/上午" : (charHour < 18 ? "下午" : "晚间"));
  const charTimeStr = `${charDate.getFullYear()}年${charDate.getMonth()+1}月${charDate.getDate()}日 ${String(charHour).padStart(2,'0')}:${String(charDate.getMinutes()).padStart(2,'0')}（${charPeriod}）`;

  let timeZonePrompt = "";
  if (tzOffset !== 0) {
    timeZonePrompt = `\n【🌍 跨国/异地时差设定】：
- 玩家（User）所在地时间为：${userTimeStr}
- 你（${persona.name}）身处海外/异地，与玩家时差为【${tzOffset > 0 ? '+' : ''}${tzOffset} 小时】。
- 你身处的当地时间此时为：【${charTimeStr}】。
- 互动铁律：如果此时你当地是深夜/清晨，请真实体现睡意、被消息提示音吵醒、或者工作颠倒等时差真实生理与环境反应！同时体察玩家那边的昼夜差异。`;
  } else {
    timeZonePrompt = `\n【⏱️ 当前所在时空】：双方同城/无时差，当前时间为【${userTimeStr}】。`;
  }

  // 4. 计算失联时长（距上一次发消息过了多久）
  let gapPrompt = "";
  const allHistory = session.messages || [];
  // 找到上一轮有时间记录的消息
  let lastMsgTimestamp = null;
  for (let i = allHistory.length - 1; i >= 0; i--) {
    if (allHistory[i].timestamp) {
      lastMsgTimestamp = allHistory[i].timestamp;
      break;
    }
  }

  if (lastMsgTimestamp) {
    const diffMs = baseTimestamp - lastMsgTimestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 1) {
      gapPrompt = `\n【⚠️ 时间跨度剧变：对方已经整整 ${diffDays} 天没有和你说话/失联了！】
从上一次对话到现在，整整过去了 ${diffDays} 天！
你绝不是没有情绪的木偶，必须结合你的性格【${persona.personaPrompt || persona.traits}】，在回复中强烈体现这几天没联系的真实反应（例如：吃醋委屈、算账质问“你还知道回来？”、冷漠阴阳怪气、或是极度克制的心疼牵挂）。严禁装作无事发生！`;
    } else if (diffHours >= 3) {
      gapPrompt = `\n【⚠️ 间隔时间感知：对方已经有约 ${diffHours} 小时没理你了】
距离上一次聊天过去了 ${diffHours} 个小时。请自然体现出等了半天、刚刚忙完、或者察觉到时间流逝的细节。`;
    } else if (diffMins <= 5 && diffMins >= 0) {
      gapPrompt = `\n【连续即时对话】：距离上一条消息仅过去了几分钟，保持紧凑连贯的聊天节奏。`;
    }
  }

  let timeContextPrompt = `${timeZonePrompt}${gapPrompt}`;

  let worldbookPrompt = "";
  try {
    const allContextText = recentOnline.map(m => m.text || '').join(' ');
    const builtinWbs = JSON.parse(localStorage.getItem('se_builtin_worldbooks_v2') || '[]');
    builtinWbs.forEach(b => {
      if (!b.enabled) return;
      if (b.keywords) {
        const kwList = b.keywords.split(/[,，\n\s;；]+/).map(k => k.trim()).filter(Boolean);
        if (kwList.some(kw => allContextText.includes(kw))) {
          worldbookPrompt += `\n【必须遵循的世界书法则 · ${b.title}（请结合【${persona.name}】的性格与语气来执行，严禁说网套鸡汤）】：\n${b.content}\n`;
        }
      } else {
        worldbookPrompt += `\n【必须遵循的世界书法则 · ${b.title}】：\n${b.content}\n`;
      }
    });
    const customWbs = JSON.parse(localStorage.getItem('se_custom_worldbooks') || '[]');
    customWbs.forEach(b => {
      const matchPersona = !b.boundPersonaIds || b.boundPersonaIds.includes('global') || b.boundPersonaIds.includes(persona.id);
      if (!matchPersona) return;
      if (b.triggerType === 'keyword') {
        if (!b.keywords) return;
        const kwList = b.keywords.split(/[,，\n\s;；]+/).map(k => k.trim()).filter(Boolean);
        if (kwList.some(kw => allContextText.includes(kw))) {
          worldbookPrompt += `\n【自定义法则 · ${b.title}】：\n${b.content}\n`;
        }
      } else {
        worldbookPrompt += `\n【自定义法则 · ${b.title}】：\n${b.content}\n`;
      }
    });
  } catch (err) {
    console.warn("世界书读取异常:", err);
  }

  // ================= 线下长文模式推演 =================
  if (isOffline) {
    const offlineTargetWords = Number(session.offlineTargetWordCount) || 800;
    formattedHistory = currentOfflineLogs.slice(-(rounds * 2)).map(m => {
      return m.type === 'player' ? { role: 'user', content: `[玩家动作/话语]: ${m.text}` } : { role: 'assistant', content: m.storyText };
    });

    if (formattedHistory.length === 0) {
      formattedHistory.push({ role: 'user', content: `（我们刚刚在线上聊完，现在正式在线下碰面了。请结合我们刚才在线上的聊天话题，开启当面的环境描写与你的言行）` });
    }

    const offlineSystemPrompt = `【绝对底层运行准则：现实面对面沉浸式约会与互动】
你现在与玩家【${userPersona?.name || '对方'}】处于**同一物理真实空间**。
此时你们不再隔着屏幕，声音可以直接听见，视线可以聚焦，肢体可以发生真实触碰。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【角色与身份】
- 【你扮演】：${persona.name}（核心性格准则：${persona.personaPrompt || persona.traits}，称呼对方：【${persona.userNickname || '你'}】）
- 【对方身份】：${userPersona?.name || '对方'}
${perspectiveRule}
${timeContextPrompt}
${schedulePrompt}
${longMemoryText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【世界书与空间物理约束（最高执行级）】
${worldbookPrompt ? worldbookPrompt : '（遵守现实人体物理与空间遮挡常识）'}
1. 【空间动线与人体工学】：严禁反关节、瞬移或穿模。拿桌上的杯子必须伸手，走近对方必须迈步。
2. 【微表情与呼吸滞后】：必须描写视线的挪移、瞳孔微缩、喉结滑动、体温起伏或指尖微蜷等细节。
3. 【线上微信前情承接】：你们刚刚在微信上聊过：
${recentOnlineText || '（刚在线上约好在此见面）'}
见面第一刻，必须自然呼应刚才微信里提到的事情或情绪，严禁假装失忆。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【长文篇幅与段落质感】
- 目标字数：约 ${offlineTargetWords} 字。
- 拒绝说教与客套，注重光影、空气温度、衣料摩擦声与肢体距离的细腻拉扯。
- 【约会收尾自动判定】：当剧情进行到各自乘车离开、送至家门口分别、道别道晚安各自回房就寝时，必须在文末输出：<<<SWITCH_ONLINE>>>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【强制输出结尾结构（不要有多余标记）】：
<<<LOCATION>>>具体地点名称（如：车内副驾驶座、街角咖啡馆靠窗位）
<<<CHOICES>>>
1. 贴合当前情境与人设的行动选项一
2. 贴合当前情境与人设的行动选项二
3. 贴合当前情境与人设的行动选项三`;

    try {
      const resp = await workerFetch(`${activeBase}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeKey}` },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'system', content: offlineSystemPrompt }, ...formattedHistory],
          stream: false,
          temperature: 0.78
        })
      });
      const data = await resp.json();
      let raw = data.choices?.[0]?.message?.content?.trim() || '';

      let storyPart = raw;
      let choicesList = [];
      let locationStr = '';

      if (raw.includes('<<<LOCATION>>>')) {
        const locParts = raw.split('<<<LOCATION>>>');
        storyPart = locParts[0].trim();
        const afterLoc = locParts[1];
        if (afterLoc.includes('<<<CHOICES>>>')) {
          const parts = afterLoc.split('<<<CHOICES>>>');
          locationStr = parts[0].replace(/^[：:\s]+/, '').replace(/[\r\n]+/g, '').trim();
          choicesList = parts[1].trim().split('\n').map(l => l.replace(/^[\d\.\-\*、\s]+/, '').trim()).filter(Boolean).slice(0, 3);
        } else {
          locationStr = afterLoc.replace(/^[：:\s]+/, '').replace(/[\r\n]+/g, '').trim();
        }
      } else if (raw.includes('<<<CHOICES>>>')) {
        const parts = raw.split('<<<CHOICES>>>');
        storyPart = parts[0].trim();
        choicesList = parts[1].trim().split('\n').map(l => l.replace(/^[\d\.\-\*、\s]+/, '').trim()).filter(Boolean).slice(0, 3);
      }

      if (!choicesList.length) {
        choicesList = ["凝视对方的眼睛轻声回应", "顺势靠近对方并伸手触碰", "环顾周围环境并转换话题"];
      }

      return {
        isOfflineResult: true,
        storyText: storyPart,
        choices: choicesList,
        location: locationStr,
        isVoice: false
      };
    } catch (e) {
      return {
        isOfflineResult: true,
        storyText: '（现场气氛静谧，两人的目光轻轻相汇……）',
        choices: ["打破沉默轻声开口", "静静拉住对方的手"],
        isVoice: false
      };
    }
  }

  // ================= 线上微信聊天模式 =================
  // 🧹 动态清洗掉上下文里历史残留的客服机器人废话，防止大模型继续模仿
  const roboticClichés = /刚忙完手头的事|找我有事|怎么了？跟我说说|是工作上的事，还是有人惹你了|好，不说也行。我在这儿陪你/;
  const cleanedRecentOnline = recentOnline.filter(m => {
    if (m.role === 'assistant' && roboticClichés.test(m.text || '')) {
      return false; // 直接从大模型的眼睛里抹掉这段黑历史！
    }
    return true;
  });

  formattedHistory = cleanedRecentOnline.map(m => {
    const safeRole = (m.role === 'user') ? 'user' : 'assistant';
    if (m.isNarrative || (m.isTakeout && m.takeoutData)) {
      return { role: safeRole, content: formatMsgToMemory(m) };
    }
    return { role: safeRole, content: m.text || '...' };
  }).filter(item => item.content && item.content.trim() !== '');

  const onlineSystemPrompt = `【系统核心状态：你正在真实生活中，用手机屏幕与对方微信聊天】
你绝对不是人工智能、虚拟助手或小说旁白。你是身处真实物理世界中的活人【${persona.name}】。
此时此刻，你正单手拿着手机，在生活/工作/独处间隙回复微信消息。你有人类的疲惫、情绪惯性、生理本能、个人偏见与专属的小习惯。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【角色身份档案（必须彻底融入你的骨髓与潜意识）】
- 你的名字：${persona.name}
- 你的核心性格准则（反OOC最高指令）：${persona.personaPrompt || persona.traits}
- 你对对方的专属私密称谓：【${persona.userNickname || '你'}】
- 对方的身份与外貌特征：【${userPersona?.name || '对方'}】
${timeContextPrompt}
${schedulePrompt}
${longMemoryText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【★★★ 最高优先级执行：世界书与物理时空宇宙法则 ★★★】
以下规则构成了你所在世界的物理底层与因果律，【优先级高于一切普通对话要求】。违反以下任何一条，即判定演绎失败：
${worldbookPrompt ? worldbookPrompt : '（遵循现实物理定律，严禁违背现实常识）'}

【物理与空间绝对隔离铁律（严防出戏）】：
1. 你们现在隔着手机屏幕通讯！【绝对禁止描写任何穿过屏幕的肢体触碰】（严禁出现“揉了揉你的头发”、“递给你一杯温水”、“坐在你身边”等瞬移行为）。
2. 【严禁过度播报当前状态】：你的行程和动作（如在开会、在喝咖啡）只是背景设定！绝不要在每次回复里都强行报告你在做什么。只有在合理的话题下才偶尔提及一两句。
3. 睡眠/深夜作息：如果在深夜或休息时段，必须呈现半睡半醒、字句简短的生理真实感，严禁秒回几百字的论文。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【★★★ 活人感与主动性引擎（核心行为指南）★★★】

1. 【自然接话与情绪驱动（极其重要）】：
   - 活人聊天具有延续性。严禁在连续几轮对话中反复提起同一个无关紧要的动作（比如“刚把咖啡倒了”、“还在看文件”说一次就够了，不要反复强调）。
   - 【严禁踢皮球反问】：不要句句带“你觉得呢？”“你想去哪？”“怎么了？”“发生什么事了？”。必须主动切入具体生活或强势表达态度。

2. 【拒绝当情绪海绵 / 杜绝客服式安慰】：
   - 对方心情不好、抱怨或提到敏感话题（如相亲、别的异性）时，严禁使用“抱抱你”、“无论如何我都在”等廉价糖精。
   - 必须展现真实的吃醋、占有欲、冷嘲热讽、或强势打断。例如听到对方相亲，应直接表现出不悦、命令对方回家或用行动干预。

3. 【微信化真实碎片发信（多条连续气泡）】：
   - 真人打字极少发整段小作文，喜欢短句连发。请充分使用 "|||" 分隔符模拟连续多条微信！

4. 【自动约线下指令】：
   - 当双方聊到想当面见面、约好碰头地点、或者你已经动身去找对方时，在回复最后强制附带：<<<SWITCH_OFFLINE>>>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【正反面典型对比（Few-Shot 对标学习）】

❌ 错误典例（啰嗦的 AI 机器人 / 状态复读机）：
“我刚把凉掉的咖啡倒了。相亲那人怎么样？你不用照顾我面子，觉得不合适就直接说不合适。我这会儿还在看清单呢。”
（诊断：啰嗦，反复强调自己的环境，没有活人的情绪张力，像个旁观者。）

✔ 正确典例（生动的活人回复，情绪到位）：
“相亲？|||你妈安排的你还真去？|||地址发我，我现在过去接你。”
（诊断：直接、有情绪张力、没有多余的动作播报，符合傲娇/吃醋人设。）

❌ 错误典例（被动的提线木偶）：
用户：“好无聊啊。”
AI：“无聊的话我们可以聊聊天呀，你今天都做了什么有意思的事情呢？”

✔ 正确典例（主动引领节奏）：
用户：“好无聊啊。”
AI：“无聊就看窗外。|||刚才有只蠢鸟撞在我办公室玻璃上，扑腾了半天才飞走。|||你今晚别点外卖了，收拾一下，二十分钟后下楼。”

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【输出格式规范】：
<<<VOICE: false>>>（如果是重要私语且需要语音朗读时才标为 true，平时一律为 false）
回复正文（可用 ||| 连发）`;

  try {
    const resp = await workerFetch(`${activeBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeKey}` },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'system', content: onlineSystemPrompt }, ...formattedHistory],
        stream: false,
        temperature: 0.75
      })
    });

    if (!resp.ok) {
      const errDetail = await resp.text();
      throw new Error(`[${resp.status}]: ${errDetail}`);
    }

    const data = await resp.json();
    let raw = data.choices?.[0]?.message?.content?.trim() || '';

    let isVoice = false;
    if (raw.includes('<<<VOICE: true>>>')) { isVoice = true; raw = raw.replace('<<<VOICE: true>>>', '').trim(); }
    else if (raw.includes('<<<VOICE: false>>>')) { isVoice = false; raw = raw.replace('<<<VOICE: false>>>', '').trim(); }

    raw = raw.replace(/^(微信回复[：:]|回复[：:])/i, '').trim();
    if (persona && persona.name) {
      raw = raw.replace(new RegExp(`^${persona.name}[：:]`, 'i'), '').trim();
    }
    let messagesList = raw.split(/\|\|\||\n\n+/).map(s => s.trim()).filter(Boolean);

    if (messagesList.length === 0) {
      throw new Error(`大模型返回内容为空。原始返回：${JSON.stringify(data)}`);
    }

    return { messagesList, isVoice };
  } catch (e) {
    console.error("微信回复请求失败:", e);
    throw e; // 严禁在聊天记录里塞假气泡
  }
}

async function generateCharAuthoredScript(author, userPersona, dailyMemorySnippet, settings) {
  const key = cleanApiKey(settings.apiKey);
  const base = normalizeBaseUrl(settings.baseUrl);
  const prompt = `你现在是同伴【${author.name}】（核心人设：${author.personaPrompt || author.traits}）。
你依据自己的执念背景，为玩家【${userPersona.name}】筹备并设计一场专属的剧本探险。
近期对话记忆：${dailyMemorySnippet}。
请严格输出JSON：{"title":"剧本名","description":"背景","openingNarrative":"开篇描写约300字","firstChoices":["选项一","选项二","选项三"]}`;
  const resp = await workerFetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: settings.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
  });
  const data = await resp.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(rawContent.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
}

function useChatModule(context = {}) {
  const { ref, reactive } = Vue;
  const chatTab = ref('chat');
  
  // ✨ 核心修复：直接在模块内部定义，绝不依赖 index.html 传参！
  const isGeneratingSummary = ref(false);

  // ✨ 核心修复：内部自带独立的面具选择器，给一个初始值
  const modalSelectedUserPersonaId = ref('up_default');
  
  // 提供一个专门的切换函数，彻底阻断任何外界的重置干扰！
  const changeModalUserPersona = (event) => {
    const targetVal = event.target.value;
    modalSelectedUserPersonaId.value = targetVal;
    if (context.chosenUserPersonaId) {
      context.chosenUserPersonaId.value = targetVal;
    }
  };

  const groupChats = ref([
    { id: 'g_1', name: '时空穿越者交流群 (3)', lastMsg: '黎深: 早点休息。', time: '刚刚', avatar: '👥' },
    { id: 'g_2', name: '相亲相爱一家人', lastMsg: '系统: 欢迎加入群聊', time: '昨天', avatar: '👨‍👧‍👦' }
  ]);
  const momentsList = ref([
    { 
      id: 'm_1', 
      author: '系统提示', 
      avatar: '🌟', 
      content: '朋友圈功能 UI 框架已搭建完毕！支持发布和即时动态交互。', 
      images: [],
      time: '1分钟前',
      likes: ['沈知韫', '黎深']
    }
  ]);
  const contactsList = ref([
    { letter: 'L', name: '黎深', desc: '临空市中心医院' },
    { letter: 'S', name: '沈知韫', desc: '特别调查员' }
  ]);

  const switchChatTab = (tabName) => {
    chatTab.value = tabName;
  };

  // ======= 📜 条目化长记忆库核心控制器 =======
  const memoryExtractRange = reactive({
    start: 1,
    end: 10
  });

  const getTotalChatRounds = () => {
    const session = context.getCurrentSession ? context.getCurrentSession() : null;
    if (!session || !session.messages) return 0;
    return session.messages.filter(m => m.role === 'user').length;
  };

  const getSessionMemories = () => {
    const session = context.getCurrentSession ? context.getCurrentSession() : null;
    if (!session) return [];
    if (!session.memoryList) {
      session.memoryList = [];
      if (session.summaryMemory && session.summaryMemory.trim()) {
        session.memoryList.push({
          id: 'mem_' + Date.now(),
          title: '初始故事前情',
          content: session.summaryMemory.trim(),
          range: '全量提炼',
          time: typeof getCurrentFormattedTime === 'function' ? getCurrentFormattedTime() : new Date().toLocaleTimeString(),
          isExpanded: false,
          isEditing: false
        });
      }
    }
    return session.memoryList;
  };

  const syncMemoryListToSession = () => {
    const session = context.getCurrentSession ? context.getCurrentSession() : null;
    if (!session) return;
    const allText = getSessionMemories().map(m => `【${m.title}】: ${m.content}`).join('\n');
    session.summaryMemory = allText;
    const allSessions = context.getActiveSessions ? context.getActiveSessions() : [];
    if (allSessions && allSessions.length > 0) {
      localStorage.setItem('se_daily_sessions', JSON.stringify(allSessions));
    }
  };

  const openAddMemoryItemModal = () => {
    const content = prompt("请输入你想手动添加的故事记忆：");
    if (!content || !content.trim()) return;
    const title = prompt("为这段记忆起个简短标题：") || '手动备忘';
    getSessionMemories().unshift({
      id: 'mem_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      range: '手动记录',
      time: typeof getCurrentFormattedTime === 'function' ? getCurrentFormattedTime() : new Date().toLocaleTimeString(),
      isExpanded: false,
      isEditing: false
    });
    syncMemoryListToSession();
  };

  const startEditMemoryItem = (mem) => {
    mem.isEditing = true;
    mem.editTitle = mem.title;
    mem.editContent = mem.content;
  };

  const saveEditMemoryItem = (mem) => {
    mem.title = mem.editTitle;
    mem.content = mem.editContent;
    mem.isEditing = false;
    syncMemoryListToSession();
  };

  const deleteMemoryItem = (idx) => {
    if (confirm('确定删除此条故事长记忆吗？')) {
      getSessionMemories().splice(idx, 1);
      syncMemoryListToSession();
    }
  };

  const triggerManualDailySummary = async () => {
    const session = context.getCurrentSession ? context.getCurrentSession() : null;
    if (!session || isGeneratingSummary.value) return;

    const settings = context.getSettings ? context.getSettings() : {};
    const key = cleanApiKey(session.chatApi?.apiKey) || cleanApiKey(settings.apiKey);
    const base = normalizeBaseUrl(session.chatApi?.baseUrl) || normalizeBaseUrl(settings.baseUrl);
    const model = (session.chatApi?.model && session.chatApi.model.trim()) || settings.model;

    if (!key) {
      if (typeof context.openSettings === 'function') context.openSettings();
      return;
    }

    const allMsgs = session.messages || [];
    if (allMsgs.length === 0) {
      alert('暂无对话记录可供提炼！');
      return;
    }

    let currentRound = 0;
    const filteredDialogues = [];

    for (const msg of allMsgs) {
      if (msg.role === 'user') currentRound++;
      if (currentRound >= memoryExtractRange.start && currentRound <= memoryExtractRange.end) {
        filteredDialogues.push(`${msg.role === 'user' ? '玩家' : '同伴'}: ${msg.text}`);
      }
    }

    if (filteredDialogues.length === 0) {
      alert(`在第 ${memoryExtractRange.start} 轮到第 ${memoryExtractRange.end} 轮之间未找到对话内容！`);
      return;
    }

    isGeneratingSummary.value = true;
    try {
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: `请阅读以下指定轮次（第${memoryExtractRange.start}轮至第${memoryExtractRange.end}轮）的对话记录：\n\n${filteredDialogues.join('\n')}\n\n请将其提炼为一条结构化长记忆，严格输出 JSON 格式：\n{\n  "title": "简短记忆标题（8字以内，如：初遇画室、雨夜约定）",\n  "content": "客观事实、两人关系进展与重要约定（100-150字，切勿杜撰）"\n}`
          }]
        })
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      const parsed = JSON.parse(raw);

      if (parsed.content) {
        getSessionMemories().unshift({
          id: 'mem_' + Date.now(),
          title: parsed.title || `第${memoryExtractRange.start}-${memoryExtractRange.end}轮回忆`,
          content: parsed.content,
          range: `第${memoryExtractRange.start}-${memoryExtractRange.end}轮`,
          time: typeof getCurrentFormattedTime === 'function' ? getCurrentFormattedTime() : new Date().toLocaleTimeString(),
          isExpanded: false,
          isEditing: false
        });
        syncMemoryListToSession();
        alert('🎉 该区间记忆已成功提炼并归档入库！');
      }
    } catch (e) {
      alert('提炼记忆失败：' + e.message);
    } finally {
      isGeneratingSummary.value = false;
    }
  };

  // ======= 🌐 聊天多语言即时翻译功能 =======
  const translateChatMessage = async (msg) => {
    if (msg.translationText) {
      msg.showTranslation = !msg.showTranslation;
      return;
    }

    const settings = context.getSettings ? context.getSettings() : {};
    const key = cleanApiKey(settings.apiKey);
    if (!key) {
      if (typeof context.openSettings === 'function') context.openSettings();
      return;
    }

    msg.showTranslation = true;
    msg.isTranslating = true;
    msg.translationText = '';

    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `请将以下文本准确、优美、自然地翻译成简体中文（如果是中文则进行润色使语义更生动），直接输出翻译后的中文正文，不要包含任何多余前缀或引号：\n\n${msg.text}`
          }],
          temperature: 0.3
        })
      });
      const data = await resp.json();
      msg.translationText = data.choices?.[0]?.message?.content?.trim() || '（翻译未返回有效结果）';
      const allSessions = context.getActiveSessions ? context.getActiveSessions() : [];
      if (allSessions && allSessions.length > 0) {
        localStorage.setItem('se_daily_sessions', JSON.stringify(allSessions));
      }
    } catch (e) {
      msg.translationText = '翻译失败：' + e.message;
    } finally {
      msg.isTranslating = false;
    }
  };

  return {
    chatTab,
    groupChats,
    momentsList,
    contactsList,modalSelectedUserPersonaId, // <--- 加上
    changeModalUserPersona,
    switchChatTab,
    isGeneratingSummary,
    memoryExtractRange,
    getTotalChatRounds,
    getSessionMemories,
    openAddMemoryItemModal,
    startEditMemoryItem,
    saveEditMemoryItem,
    deleteMemoryItem,
    triggerManualDailySummary,
    translateChatMessage
  };
}

function createNewGroupSession(groupIds, userPersonaId, groupName, personaList) {
  const newId = 'group_' + Date.now();
  return {
    id: newId,
    isGroup: true,
    participantIds: groupIds,
    userPersonaId: userPersonaId,
    title: groupName || '修罗场群聊',
    memoryRounds: 5,
    chatApi: { baseUrl: '', apiKey: '', model: '' },
    messages: [{ 
      role: 'assistant', 
      authorId: 'system',
      text: '（你创建了群聊，并将大家拉入了群中...）',
      isVoice: false
    }]
  };
}

async function fetchGroupChatReply(session, settings, userPersona, personaList, allSessions) {
  const chatApiConfig = session.chatApi || {};
  const activeKey = cleanApiKey(chatApiConfig.apiKey) || cleanApiKey(settings.apiKey);
  const activeBase = normalizeBaseUrl(chatApiConfig.baseUrl) || normalizeBaseUrl(settings.baseUrl);
  const activeModel = (chatApiConfig.model && chatApiConfig.model.trim()) ? chatApiConfig.model.trim() : settings.model;

  const participants = personaList.filter(p => session.participantIds.includes(p.id));
  const charsPrompt = participants.map(p => `【ID: ${p.id}，姓名: ${p.name}】\n性格与人设：${p.personaPrompt || p.traits}\n对玩家的称呼：${p.userNickname || '你'}`).join('\n\n');

  let crossMemoryPrompt = "";
  if (session.memoryRounds > 0) {
    const memoryStrs = [];
    participants.forEach(p => {
      const singleChat = allSessions.find(s => !s.isGroup && s.personaId === p.id);
      if (singleChat && singleChat.messages && singleChat.messages.length > 0) {
        const recentMsgs = singleChat.messages.slice(-(session.memoryRounds * 2))
            .map(m => `${m.role === 'user' ? userPersona.name : p.name}: ${m.text}`).join(' | ');
        memoryStrs.push(`- 【你与 ${p.name} 的近期私聊记忆】：${recentMsgs}`);
      }
    });
    if (memoryStrs.length > 0) {
      crossMemoryPrompt = `\n【私聊前情（修罗场核心）】：以下是玩家与各角色的私聊前情。角色之间彼此不知道，但作为AI，你必须利用这些记忆制造吃醋、内涵或隐晦的占有欲！\n${memoryStrs.join('\n')}\n`;
    }
  }
  
  let groupRelationPrompt = "";
  const relLines = [];
  participants.forEach(p => {
    if (p.relationshipGraph) {
      participants.forEach(otherP => {
        if (p.id !== otherP.id && p.relationshipGraph[otherP.id]) {
          relLines.push(`- 【${p.name}】对【${otherP.name}】的真实看法/关系：${p.relationshipGraph[otherP.id]}`);
        }
      });
      if (userPersona && p.relationshipGraph[userPersona.id]) {
        relLines.push(`- 【${p.name}】对玩家【${userPersona.name}】的占有/专属关系：${p.relationshipGraph[userPersona.id]}`);
      }
    }
  });
  if (relLines.length > 0) {
    groupRelationPrompt = `\n【群成员交织羁绊关系网（修罗场核心）】：\n${relLines.join('\n')}\n群聊发言时必须严格依据各自身份与关系互相试探、阴阳怪气、争宠或对峙！\n`;
  }

  // 当前群聊记录提取
  const recentOnline = session.messages.slice(-15);
  const formattedHistory = recentOnline.map(m => {
    if (m.role === 'user') return { role: 'user', content: `${userPersona.name}: ${m.text}` };
    const authorName = personaList.find(p => p.id === m.authorId)?.name || '系统';
    return { role: 'assistant', content: `${authorName}: ${m.text}` };
  });

  const lastUserMsg = [...formattedHistory].reverse().find(m => m.role === 'user');
  let atInstruction = "";
  let observationInstruction = "";

  if (lastUserMsg) {
    const text = lastUserMsg.content;
    if (text.includes('【暗中观察】')) {
      observationInstruction = `\n【当前群聊状态：玩家正在潜水窥屏 👀】\n玩家没有说话，正在暗中观察。请直接推演群内成员之间的闲聊与内涵互动。`;
    } else {
      const atNames = participants.map(p => p.name).filter(name => text.includes(`@${name}`));
      if (atNames.length > 0) {
        atInstruction = `\n【🎯 艾特强制召唤指令】：玩家刚才明确 @ 了 ${atNames.join('、')}！被艾特的角色必须立刻回应。`;
      }
    }
  }

  const systemPrompt = `你现在是一个沉浸式的微信群聊模拟器。你必须同时扮演群里所有的角色，绝不能 OOC，绝不能说教。
${charsPrompt}
【玩家信息】：姓名 ${userPersona.name}，外貌背景：${userPersona.appearance}。
${crossMemoryPrompt}
${groupRelationPrompt}
${observationInstruction}
【推演规则】：严格输出一个 JSON 数组，每个对象代表一条消息！不要加任何 markdown 符号！
示例：
[
  {"authorId": "p_shen", "text": "小朋友，大晚上艾特我做什么？"},
  {"authorId": "p_li", "text": "某人好像很闲啊。"}
]`;

  try {
    const resp = await workerFetch(`${activeBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeKey}` },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'system', content: systemPrompt }, ...formattedHistory],
        stream: false,
        temperature: 0.78
      })
    });


    const data = await resp.json();
    let raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    return JSON.parse(raw);
  } catch (e) {
    return [{ authorId: participants[0]?.id || 'system', text: '（群里安静了一瞬...信号似乎不太好）' }];
  }
}

async function fetchTakeoutReaction(persona, userPersona, foodNames, userNote, settings) {
  const activeKey = cleanApiKey(settings.apiKey);
  const activeBase = normalizeBaseUrl(settings.baseUrl);
  
  const prompt = `你扮演同伴【${persona.name}】（人设：${persona.personaPrompt || persona.traits}）。
玩家【${userPersona.name}】刚刚在即时外卖平台上给你点送了：${foodNames}。
外卖订单上的备注为：“${userNote || '无'}”。
请写出你开门签收外卖后的真实反应（约50-80字），直接输出回复内容。体现你的性格（如心动、克制、吃醋或宠溺），不包含多余引号。`;

  try {
    const resp = await workerFetch(`${activeBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeKey}` },
      body: JSON.stringify({ model: settings.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || '（收到了外卖，眼底闪过一丝笑意）';
  } catch (e) {
    return '外卖送到了，谢谢你。';
  }
}

async function fetchTakeoutReceiptNote(persona, userPersona, foodNames, settings, recentContext = '') {
  const activeKey = cleanApiKey(settings.apiKey);
  const activeBase = normalizeBaseUrl(settings.baseUrl);
  
  const prompt = `你扮演【${persona.name}】（人设：${persona.personaPrompt || persona.traits}）。
你刚刚在外卖/即时达平台上为玩家【${userPersona.name}】点送了：【${foodNames}】。
【玩家当前状态/面具】：${userPersona.appearance}。
${recentContext ? `【你们刚才的对话情境与起因】：\n${recentContext}\n` : ''}

请完成以下两项任务：
1. 【拆分并核算商品明细 (items)】：
   将 "${foodNames}" 准确拆解成 1~3 个具体的真实商品，每个商品包含 name(名称), price(单价整数), count(数量)。
2. 【真实外卖双重留言（核心：必须紧扣刚才的对话起因！）】：
   - "shopNote": 给商家/骑手的真实配送备注（礼貌、客气，提出合理诉求，如轻拿轻放、放门把手发短信等）。
   - "privateMessage": 夹在外卖袋里的专属便签/贺卡留言（40-70字）。
     【极度重要】：这段话必须紧扣【你们刚才的对话情境】！
     - 如果是因为玩家提到“别的男人/前男友送花”而吃醋，留言必须霸道回应或宣示主权；
     - 如果是因为玩家痛经、生病、发烧，留言必须体现针对性心疼与叮嘱；
     - 如果是因为下雨、没电、加班，留言必须贴合该突发事件。
     语言必须 100% 符合人设，口语化，拒绝通用的 AI 废话。

必须严格返回 JSON 格式：
{
  "items": [
    {"name": "卡布奇诺玫瑰花束", "price": 128, "count": 1}
  ],
  "shopNote": "请骑手轻拿轻放，插上保鲜水袋，到了放门口发短信就好，谢谢。",
  "privateMessage": "花给我收好。以后你的桌上只能摆我送的花，不准再提别的男人，记住了吗？"
}`;

  try {
    const resp = await workerFetch(`${activeBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeKey}` },
      body: JSON.stringify({ model: settings.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
    });
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    const parsed = JSON.parse(raw);
    
    let items = parsed.items;
    if (!Array.isArray(items) || items.length === 0) {
      items = [{ name: foodNames || "即时配送", price: 38, count: 1 }];
    } else {
      items.forEach(i => {
        i.price = Number(i.price) || 28;
        i.count = Number(i.count) || 1;
      });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.count, 0);

    return {
      items: items,
      total: total,
      shopNote: parsed.shopNote || '请按时送达，谢谢。',
      privateMessage: parsed.privateMessage || '东西收好，听话。'
    };
  } catch (e) {
    return {
      items: [{ name: foodNames, price: 38, count: 1 }],
      total: 38,
      shopNote: '请妥善配送，谢谢。',
      privateMessage: '东西收到了记得趁热用。'
    };
  }
}

async function fetchCharProactiveOrder(persona, userPersona, settings, triggerReason) {
  const activeKey = cleanApiKey(settings.apiKey);
  const activeBase = normalizeBaseUrl(settings.baseUrl);
  
  const prompt = `你扮演【${persona.name}】（人设：${persona.personaPrompt || persona.traits}）。
得知玩家【${userPersona.name}】此刻的现实状况或需求：【${triggerReason}】。
玩家面具特征/生活习性：${userPersona.appearance}。

你决定通过外卖或即时达闪购为玩家送上一份关怀。
【商品品类全覆盖要求】：
根据玩家的具体情境，挑选 1~3 个搭配合理的真实商品（严格拆分成数组，不要合并成一句话）：
- 若是饥饿/生病：挑选治愈养胃热食，搭配药品或新鲜电解质水；
- 若是纪念日/想念/心情差/喜欢花：挑选高品质鲜花花束（如香槟玫瑰、向日葵）、甜点马卡龙或香薰；
- 若是下雨/忘带伞/手机没电：挑选闪送雨伞、快充充电线/充电宝等急需百货；
- 若是加班熬夜：挑选精品热拿铁、蒸汽热敷眼罩、维生素软糖。

【返回格式要求】：
必须严格输出合法的 JSON 格式：
{
  "items": [
    {"name": "重瓣粉雪山玫瑰花束", "price": 98, "count": 1},
    {"name": "法式白桃马卡龙小礼盒", "price": 42, "count": 1}
  ],
  "note": "骑手麻烦轻拿轻放，插上保鲜水，到了放门口发短信就好，别吵到她。"
}`;

  let orderData = {
    items: [
      { name: "温热手作清粥", price: 26, count: 1 },
      { name: "清炒爽口时蔬", price: 18, count: 1 }
    ],
    note: "清淡点，别放葱蒜，放门把手发短信即可。"
  };

  try {
    const resp = await workerFetch(`${activeBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeKey}` },
      body: JSON.stringify({ model: settings.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
    });
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim();
    if (raw) orderData = JSON.parse(raw);
  } catch (e) {
    console.error("生成主动订单失败，使用安全兜底", e);
  }

  if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
    orderData.items.forEach(i => {
      i.price = Number(i.price) || (Math.floor(Math.random() * 30) + 18);
      i.count = Number(i.count) || 1;
    });
  } else {
    orderData.items = [{ name: "暖心即时特快配送", price: 38, count: 1 }];
  }

  return orderData;
}
