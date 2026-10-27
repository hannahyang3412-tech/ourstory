// js/offline_date_module.js - 线下约会长文与沉浸便签系统 (100% 无损搬迁)

function useOfflineDateModule(dependencies) {
  const { ref, reactive, onMounted, onUnmounted, nextTick } = Vue;
  const {
    activeDailySessions,
    currentDailySession,
    personaList,
    userPersonaList,
    chosenUserPersonaId,
    settings,
    isNarrativeMode,
    helpers
  } = dependencies;

  const {
    cleanApiKey, normalizeBaseUrl, workerFetch,
    getPersonaName, getPersonaObj, getUserPersonaName, getUserPersonaObj,
    showToast
  } = helpers;

  // ======= 📍 线下长文模式控制逻辑 =======
  const showOfflineSettingsModal = ref(false);
  const offlineInput = ref('');
  const isOfflineStreaming = ref(false);
  const offlineBoxRef = ref(null);
  const offlineChoices = ref(["凝视对方的眼睛轻声回应", "顺势靠近对方并伸手触碰", "环顾周围环境并转换话题"]);

  const isOfflineCountdownActive = ref(false);
  const offlineCountdown = ref(3);
  let offlineCountdownTimer = null;

  // 约会记录状态
  const showDateRecordsModal = ref(false);
  const showDateDetailModal = ref(false);
  const activeDateRecord = ref(null);

  const saveDateRecords = () => {
    localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
  };

  const getOfflineThemeClass = () => {
    if (!currentDailySession.value?.offlineUiTheme) {
      if (currentDailySession.value) currentDailySession.value.offlineUiTheme = 'theater';
    }
    return `offline-theme-${currentDailySession.value?.offlineUiTheme || 'theater'}`;
  };

  const formatTheaterScript = (text) => {
    if (!text) return '';
    return text.replace(/“([^”]+)”/g, '“<em>$1</em>”');
  };

  const toggleOfflineMode = async () => {
    if (!currentDailySession.value) return;
    currentDailySession.value.isOfflineMode = !currentDailySession.value.isOfflineMode;
    
    if (currentDailySession.value.isOfflineMode) {
      if (!currentDailySession.value.offlineTargetWordCount) {
        currentDailySession.value.offlineTargetWordCount = 800;
      }
      if (!currentDailySession.value.offlineLogs || currentDailySession.value.offlineLogs.length === 0) {
        currentDailySession.value.offlineLogs = [];
        isOfflineCountdownActive.value = true;
        offlineCountdown.value = 1;
        if (offlineCountdownTimer) clearInterval(offlineCountdownTimer);
        offlineCountdownTimer = setInterval(async () => {
          offlineCountdown.value--;
          if (offlineCountdown.value <= 0) {
            cancelOfflineCountdown();
            await executeOfflineAction(); 
          }
        }, 1000);
      }
    }
    localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
  };

  const activeOfflineMsgMenuIdx = ref(null);
  const toggleOfflineMsgActionMenu = (idx) => {
    activeOfflineMsgMenuIdx.value = activeOfflineMsgMenuIdx.value === idx ? null : idx;
  };
  
  const startOfflineMsgEdit = (log) => {
    log.isEditing = true;
    if (log.type === 'player') log.editText = log.text;
    else log.editStoryText = log.storyText;
  };
  
  const cancelOfflineMsgEdit = (log) => { log.isEditing = false; };
  
  const saveOfflineMsgEdit = (log) => {
    if (log.type === 'player' && log.editText?.trim()) log.text = log.editText.trim();
    if (log.type === 'engine' && log.editStoryText?.trim()) log.storyText = log.editStoryText.trim();
    log.isEditing = false;
    localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
  };
  
  const rollbackOfflineTo = (idx) => {
    if (confirm('确定回溯到此处吗？该条之后的所有线下互动将被清除。')) {
      currentDailySession.value.offlineLogs = currentDailySession.value.offlineLogs.slice(0, idx + 1);
      localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
      scrollToOfflineBottom();
    }
  };
  
  const deleteOfflineMsg = (idx) => {
    if (confirm('确定删除这条线下记录吗？')) {
      currentDailySession.value.offlineLogs.splice(idx, 1);
      localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
    }
  };

  const scrollToOfflineBottom = async () => {
    await nextTick();
    if (offlineBoxRef.value) offlineBoxRef.value.scrollTop = offlineBoxRef.value.scrollHeight;
  };

  const chooseOfflineOption = (choiceText) => {
    offlineInput.value = choiceText;
    submitOfflineAction();
  };

  const cancelOfflineCountdown = () => {
    if (offlineCountdownTimer) {
      clearInterval(offlineCountdownTimer);
      offlineCountdownTimer = null;
    }
    isOfflineCountdownActive.value = false;
  };

  const submitOfflineAction = () => {
    if (!offlineInput.value.trim() || isOfflineStreaming.value || isOfflineCountdownActive.value) return;
    const text = offlineInput.value.trim();
    offlineInput.value = '';
    
    if (!currentDailySession.value.offlineLogs) currentDailySession.value.offlineLogs = [];

    // 计算当前线下时间戳
    let currentOfflineTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let currentOfflineTimestamp = Date.now();
    if (currentDailySession.value?.timeMode === 'virtual' && currentDailySession.value?.virtualDateTime) {
      const vDate = new Date(currentDailySession.value.virtualDateTime);
      if (!isNaN(vDate.getTime())) {
        currentOfflineTime = `${String(vDate.getHours()).padStart(2, '0')}:${String(vDate.getMinutes()).padStart(2, '0')}`;
        currentOfflineTimestamp = vDate.getTime();
      }
    }

    if (isNarrativeMode.value) {
      currentDailySession.value.offlineLogs.push({ 
        type: 'player', 
        text: text, 
        isNarrative: true,
        time: currentOfflineTime,
        timestamp: currentOfflineTimestamp
      });
      isNarrativeMode.value = false;
    } else {
      currentDailySession.value.offlineLogs.push({ 
        type: 'player', 
        text: text,
        time: currentOfflineTime,
        timestamp: currentOfflineTimestamp
      });
    }
    scrollToOfflineBottom();

    isOfflineCountdownActive.value = true;
    offlineCountdown.value = 3;
    
    offlineCountdownTimer = setInterval(async () => {
      offlineCountdown.value--;
      if (offlineCountdown.value <= 0) {
        cancelOfflineCountdown();
        await executeOfflineAction();
      }
    }, 1000);
  };

  const endOfflineDateAndSwitchOnline = async () => {
    if (!currentDailySession.value) return;
    
    const key = cleanApiKey(settings.apiKey);
    let summary = "美好的线下时光...";
    
    if (key && currentDailySession.value.offlineLogs && currentDailySession.value.offlineLogs.length > 0) {
      try {
        const base = normalizeBaseUrl(settings.baseUrl);
        const chatText = currentDailySession.value.offlineLogs.map(l => l.type === 'player' ? '玩家: ' + l.text : '同伴: ' + l.storyText).join('\n');
        const resp = await workerFetch(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ 
              role: 'user', 
              content: `请对以下刚刚结束的线下约会互动进行详细总结（保留时间、地点、发生的核心互动、彼此的触碰与情感拉扯，150字左右），该总结将作为后续线上微信聊天的重要共同记忆：\n${chatText}` 
            }]
          })
        });
        const data = await resp.json();
        summary = data.choices?.[0]?.message?.content?.trim() || summary;
      } catch(e) { console.error("约会总结提炼异常:", e); }
    }

    if (!currentDailySession.value.dateRecords) {
      currentDailySession.value.dateRecords = [];
    }

    currentDailySession.value.dateRecords.unshift({
      date: new Date().toLocaleString(),
      summary: summary,
      logs: [...currentDailySession.value.offlineLogs]
    });
    
    if (currentDailySession.value.summaryMemory) {
      currentDailySession.value.summaryMemory += `\n【线下约会回忆】: ${summary}`;
    } else {
      currentDailySession.value.summaryMemory = `【线下约会回忆】: ${summary}`;
    }

    currentDailySession.value.offlineLogs = [];
    currentDailySession.value.isOfflineMode = false;
    localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
  };

  const executeOfflineAction = async () => {
    if (!currentDailySession.value || isOfflineStreaming.value) return;
    const key = cleanApiKey(settings.apiKey);
    if (!key) { alert("请配置 API Key"); return; }

    isOfflineStreaming.value = true;
    await scrollToOfflineBottom();

    try {
      const p = personaList.value.find(item => item.id === currentDailySession.value.personaId) || personaList.value[0];
      const userMask = userPersonaList.value.find(u => u.id === currentDailySession.value.userPersonaId) || userPersonaList.value[0];
      
      // 直接调用 chat_module.js 中的全局函数 fetchDailyChatReply
      const replyObj = await window.fetchDailyChatReply(currentDailySession.value, p, settings, userMask);

      let storyPart = replyObj.storyText || '（对方微微倾身，目光深邃地注视着你……）';
      let shouldSwitchOnline = false;
      
      if (storyPart.includes('<<<SWITCH_ONLINE>>>')) {
        shouldSwitchOnline = true;
        storyPart = storyPart.replace(/<<<SWITCH_ONLINE>>>/g, '').trim();
      }

      let charOfflineTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let charOfflineTimestamp = Date.now();
      if (currentDailySession.value?.timeMode === 'virtual' && currentDailySession.value?.virtualDateTime) {
        const vDate = new Date(currentDailySession.value.virtualDateTime);
        if (!isNaN(vDate.getTime())) {
          charOfflineTime = `${String(vDate.getHours()).padStart(2, '0')}:${String(vDate.getMinutes()).padStart(2, '0')}`;
          charOfflineTimestamp = vDate.getTime();
        }
      }

      currentDailySession.value.offlineLogs.push({
        type: 'engine',
        storyText: storyPart,
        time: charOfflineTime,
        timestamp: charOfflineTimestamp
      });
      if (replyObj.choices && replyObj.choices.length > 0) {
        offlineChoices.value = replyObj.choices;
      }
      if (replyObj.location) {
        currentDailySession.value.currentLocation = replyObj.location;
      }
      localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));

      if (shouldSwitchOnline) {
        setTimeout(async () => {
          if (typeof showToast === 'function') {
            showToast(`🚗 你们已相互作别，正在归档约会回忆并切回微信...`);
          }

          await endOfflineDateAndSwitchOnline();

          setTimeout(async () => {
            try {
              const p = getPersonaObj(currentDailySession.value.personaId);
              const up = getUserPersonaObj(currentDailySession.value.userPersonaId);
              const key = cleanApiKey(settings.apiKey);
              if (key && p) {
                const base = normalizeBaseUrl(settings.baseUrl);
                const postDatePrompt = `你扮演【${p.name}】（性格：${p.personaPrompt || p.traits}）。
你刚刚与玩家【${up?.name || '对方'}】在线下结束约会/分别，你刚到家（或刚坐上车）。
请在微信上主动给对方发 1~2 句微信（如：确认对方是否安全到家、对今天的约会表达克制的喜悦或叮嘱洗漱早点休息）。
口语化，真实自然，直接输出内容：`;
                const rResp = await workerFetch(`${base}/v1/chat/completions`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                  body: JSON.stringify({
                    model: settings.model,
                    messages: [{ role: 'user', content: postDatePrompt }],
                    temperature: 0.75
                  })
                });
                const rData = await rResp.json();
                const followUpText = rData.choices?.[0]?.message?.content?.trim();
                if (followUpText) {
                  currentDailySession.value.messages.push({
                    role: 'assistant',
                    authorId: p.id,
                    text: followUpText,
                    isVoice: false
                  });
                  localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
                }
              }
            } catch(e) {
              console.warn("报平安消息触发跳过", e);
            }
          }, 1200);

        }, 1500);
      }

    } catch (e) {
      alert('线下推演失败：' + e.message);
    } finally {
      isOfflineStreaming.value = false;
      await scrollToOfflineBottom();
    }
  };


  // ======= 📜 羊皮纸手帐专属：沉浸式划词、荧光高光与便签批复逻辑 =======
  const showStickyNoteModal = ref(false);
  const stickyNoteInput = ref('');
  const activeTargetLog = ref(null);
  const isReplyingStickyNote = ref(false);

  const showTextSelectMenu = ref(false);
  const textSelectMenuPos = reactive({ x: 0, y: 0 });
  const currentSelectedText = ref('');
  const currentSelectionContext = ref('active'); 

  const handleTextSelection = (e, log, context) => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        textSelectMenuPos.x = rect.left + rect.width / 2;
        textSelectMenuPos.y = rect.top - 10;
        
        currentSelectedText.value = text;
        activeTargetLog.value = log;
        currentSelectionContext.value = context;
        showTextSelectMenu.value = true;
      } else {
        showTextSelectMenu.value = false;
      }
    }, 50);
  };

  const hideTextSelectMenu = () => {
    if (showTextSelectMenu.value) {
      showTextSelectMenu.value = false;
    }
  };

  onMounted(() => { 
    window.addEventListener('mousedown', hideTextSelectMenu); 
    window.addEventListener('touchstart', hideTextSelectMenu); 
  });
  
  onUnmounted(() => { 
    window.removeEventListener('mousedown', hideTextSelectMenu); 
    window.removeEventListener('touchstart', hideTextSelectMenu); 
  });
  
  const toggleTextHighlight = (log) => { applyHighlight(); };

  const applyHighlight = () => {
    if (activeTargetLog.value && currentSelectedText.value) {
      const highlightedHtml = `<span class="parchment-highlight">${currentSelectedText.value}</span>`;
      activeTargetLog.value.storyText = activeTargetLog.value.storyText.replace(currentSelectedText.value, highlightedHtml);
      localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
    }
    window.getSelection().removeAllRanges();
    showTextSelectMenu.value = false;
  };

  const sentenceCandidates = ref([]);

  const splitTextIntoSentences = (rawText) => {
    if (!rawText) return [];
    const clean = rawText.replace(/<[^>]+>/g, '').trim();
    const list = [];
    
    const dialogueRegex = /[“"']([^”"']+)[”"']/g;
    let match;
    while ((match = dialogueRegex.exec(clean)) !== null) {
      const dialogue = match[1].trim();
      if (dialogue.length >= 2 && !list.includes(dialogue)) {
        list.push(dialogue);
      }
    }

    const sentences = clean.split(/[。！？…\n]+/).map(s => s.trim().replace(/^[“"']+|[”"']+$/g, '')).filter(s => s.length >= 6 && s.length <= 45);
    sentences.forEach(s => {
      if (!list.some(item => item.includes(s))) {
        list.push(s);
      }
    });

    return list.slice(0, 6);
  };

  const selectSentenceCandidate = (cand) => {
    currentSelectedText.value = cand;
  };

  const openStickyNoteModal = (log) => { openStickyNoteForLog(log); };

  const openStickyNoteForLog = (log) => {
    activeTargetLog.value = log;
    stickyNoteInput.value = '';
    
    const sel = window.getSelection ? window.getSelection().toString().trim() : '';
    const candidates = splitTextIntoSentences(log.storyText || log.text || '');
    sentenceCandidates.value = candidates;

    if (sel) {
      currentSelectedText.value = sel;
    } else if (candidates.length > 0) {
      currentSelectedText.value = candidates[0];
    } else {
      const cleanText = (log.storyText || log.text || '').replace(/<[^>]+>/g, '').trim();
      currentSelectedText.value = cleanText.slice(0, 30);
    }

    showStickyNoteModal.value = true;
    showTextSelectMenu.value = false;
  };

  const toggleNoteExpand = (note) => {
    note.isExpanded = !note.isExpanded;
  };

  const confirmAddStickyNote = async () => {
    if (!stickyNoteInput.value.trim() || !activeTargetLog.value) return;
    const userCommentText = stickyNoteInput.value.trim();
    const targetLog = activeTargetLog.value;
    const quotedText = currentSelectedText.value.trim();

    if (!targetLog.stickyNotes) targetLog.stickyNotes = [];
    
    const newNote = {
      quote: quotedText,
      userComment: userCommentText,
      charReply: '（正在看你的批注……）',
      isExpanded: true
    };
    targetLog.stickyNotes.push(newNote);
    showStickyNoteModal.value = false;
    window.getSelection && window.getSelection().removeAllRanges();
    localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));

    const key = cleanApiKey(settings.apiKey);
    const p = getPersonaObj(currentDailySession.value?.personaId);
    const up = getUserPersonaObj(currentDailySession.value?.userPersonaId);

    if (key && p) {
      isReplyingStickyNote.value = true;
      try {
        const base = normalizeBaseUrl(settings.baseUrl);
        const replyPrompt = `你扮演同伴【${p.name}】（人设特征：${p.personaPrompt || p.traits}）。
你们正在现实中约会，并把互动记录在情侣手账上。
玩家【${up?.name || '对方'}】刚刚指着你说的这句话/动作：“${quotedText}”，并在便签上写下私密吐槽：“${userCommentText}”。
请以你的口吻与人设（如傲娇拆穿、耳语低笑或深情回应），在便签下方写下一句简短的手写红墨水批注（25字以内，不要多余废话）：
直接输出批注正文，不要加引号：`;

        const resp = await workerFetch(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ role: 'user', content: replyPrompt }],
            temperature: 0.8
          })
        });
        const data = await resp.json();
        const replyText = data.choices?.[0]?.message?.content?.trim();
        if (replyText) {
          newNote.charReply = replyText;
          localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
        }
      } catch (err) {
        newNote.charReply = '（把便签抚平，低笑了一声，没多辩解）';
      } finally {
        isReplyingStickyNote.value = false;
      }
    }
  };

  const deleteStickyNote = (log, index) => {
    if (confirm('确定撕下这张便签吗？')) {
      log.stickyNotes.splice(index, 1);
      localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
    }
  };

  const openStickyNoteForSelection = () => {
    stickyNoteInput.value = '';
    showStickyNoteModal.value = true;
    showTextSelectMenu.value = false;
  };

  const renderInlineStoryWithNotes = (log) => {
    if (!log) return '';
    let text = log.storyText || log.text || '';
    
    const isInlineMode = (currentDailySession.value?.offlineStickyStyle || 'inline') === 'inline';
    if (!isInlineMode || !log.stickyNotes || log.stickyNotes.length === 0) {
      return currentDailySession.value?.offlineUiTheme === 'theater' ? formatTheaterScript(text) : text;
    }

    const charName = getPersonaName(currentDailySession.value?.personaId);

    log.stickyNotes.forEach((note, nIdx) => {
      if (!note.quote) return;
      const rawQuote = note.quote.trim();
      const cleanQuote = rawQuote.replace(/^[“"']+|[”"']+$/g, '').trim();
      if (!cleanQuote) return;

      const bubbleTag = `<span class="inline-sticky-tag" data-action="toggle-inline" data-note-idx="${nIdx}">💬 ${charName}的笔触${note.isExpanded ? ' ▲' : ' ▼'}</span>`;

      const expandedCard = note.isExpanded ? `
        <span class="inline-sticky-card">
          <span class="inline-card-header">
            <span>📌 我的随手批注</span>
            <button type="button" data-action="delete-inline" data-note-idx="${nIdx}" class="text-stone-400 hover:text-red-500 cursor-pointer">✕ 撕下</button>
          </span>
          <span class="inline-user-comment">“${note.userComment}”</span>
          <span class="inline-char-reply">✍️ ${charName} 亲笔批注：${note.charReply}</span>
        </span>
      ` : '';

      let matchedStr = '';
      if (text.includes(`“${cleanQuote}”`)) matchedStr = `“${cleanQuote}”`;
      else if (text.includes(rawQuote)) matchedStr = rawQuote;
      else if (text.includes(cleanQuote)) matchedStr = cleanQuote;

      if (matchedStr) {
        const replacement = `<span class="parchment-highlight font-bold">${matchedStr}</span>${bubbleTag}${expandedCard}`;
        text = text.replace(matchedStr, replacement);
      } else {
        text = `${bubbleTag}${expandedCard}` + text;
      }
    });

    return currentDailySession.value?.offlineUiTheme === 'theater' ? formatTheaterScript(text) : text;
  };

  const handleInlineNoteClick = (e, log) => {
    const target = e.target.closest('[data-note-idx]');
    if (!target) return;
    e.stopPropagation();

    const idx = parseInt(target.getAttribute('data-note-idx'), 10);
    const action = target.getAttribute('data-action');
    if (isNaN(idx) || !log.stickyNotes || !log.stickyNotes[idx]) return;

    if (action === 'delete-inline') {
      deleteStickyNote(log, idx);
    } else {
      log.stickyNotes[idx].isExpanded = !log.stickyNotes[idx].isExpanded;
      localStorage.setItem('se_daily_sessions', JSON.stringify(activeDailySessions.value));
    }
  };

  return {
    showOfflineSettingsModal, offlineInput, isOfflineStreaming, offlineBoxRef, offlineChoices, isOfflineCountdownActive, offlineCountdown,
    toggleOfflineMode, activeOfflineMsgMenuIdx, toggleOfflineMsgActionMenu, startOfflineMsgEdit, cancelOfflineMsgEdit, saveOfflineMsgEdit, rollbackOfflineTo, deleteOfflineMsg,
    chooseOfflineOption, submitOfflineAction, cancelOfflineCountdown, endOfflineDateAndSwitchOnline, executeOfflineAction, scrollToOfflineBottom,
    showDateRecordsModal, showDateDetailModal, activeDateRecord, saveDateRecords,
    getOfflineThemeClass, formatTheaterScript,
    showStickyNoteModal, stickyNoteInput, isReplyingStickyNote,
    showTextSelectMenu, textSelectMenuPos, currentSelectedText,
    handleTextSelection, applyHighlight, openStickyNoteForSelection, openStickyNoteForLog,
    renderInlineStoryWithNotes, handleInlineNoteClick, sentenceCandidates, selectSentenceCandidate, toggleNoteExpand,
    toggleTextHighlight, openStickyNoteModal, confirmAddStickyNote, deleteStickyNote
  };
}