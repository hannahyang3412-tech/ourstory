// js/schedule_module.js

function useScheduleModule(personaList, worldbooks, settings) {
  const { ref, computed, reactive } = Vue;

  const savedSchedules = ref({});
  const loadSchedules = () => {
    try {
      const data = localStorage.getItem('se_char_schedules');
      if (data) savedSchedules.value = JSON.parse(data);
    } catch (e) {}
  };
  const saveSchedulesToLocal = () => {
    localStorage.setItem('se_char_schedules', JSON.stringify(savedSchedules.value));
  };
  loadSchedules();

  const today = new Date();
  const currentYear = ref(Number(today.getFullYear()));
  const currentMonth = ref(Number(today.getMonth())); 
  
  const formatDate = (y, m, d) => `${y}/${String(Number(m) + 1).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
  
  const selectedDateStr = ref(formatDate(currentYear.value, currentMonth.value, today.getDate()));
  const selectedScheduleCharId = ref('');
  
  // UI 风格循环切换
  const uiModes = ['A', 'B1', 'B2', 'B3'];
  const uiModeNames = { A: '手帐风', B1: '看板风', B2: '车票风', B3: '动态风' };
  const scheduleUiMode = ref('A');
  const cycleUiMode = () => {
    const idx = uiModes.indexOf(scheduleUiMode.value);
    scheduleUiMode.value = uiModes[(idx + 1) % uiModes.length];
  };

  const calendarDays = computed(() => {
    const days = [];
    const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
    const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
    for(let i = 0; i < firstDay; i++) days.push(null);
    for(let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  });

  const prevMonth = () => {
    if(currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; }
    else currentMonth.value--;
  };
  const nextMonth = () => {
    if(currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; }
    else currentMonth.value++;
  };
  const selectDate = (day) => {
    if(!day) return;
    selectedDateStr.value = formatDate(currentYear.value, currentMonth.value, day);
  };

  const currentSchedule = computed(() => {
    if(!selectedScheduleCharId.value) return [];
    const key = `${selectedScheduleCharId.value}_${selectedDateStr.value}`;
    return savedSchedules.value[key] || [];
  });

  const initSchedule = () => {
     if (!selectedScheduleCharId.value && personaList.value.length > 0) {
        selectedScheduleCharId.value = personaList.value[0].id;
     }
  };

  const showScheduleDetailModal = ref(false);
  const activeScheduleDetailItem = ref(null);
  const openScheduleDetail = (item) => {
    activeScheduleDetailItem.value = item;
    showScheduleDetailModal.value = true;
  };

  const showScheduleEditModal = ref(false);
  const editingItemIndex = ref(-1);
  const scheduleForm = reactive({ timeRange: '', activity: '', location: '', status: '', hasHeartbeat: false, innerThought: '', detailedDesc: '' });

  const openAddSchedule = () => {
    editingItemIndex.value = -1;
    Object.assign(scheduleForm, { timeRange: '', activity: '', location: '', status: '', hasHeartbeat: false, innerThought: '', detailedDesc: '' });
    showScheduleEditModal.value = true;
  };

  const openEditSchedule = (item, index) => {
    editingItemIndex.value = index;
    Object.assign(scheduleForm, {
      timeRange: item.timeRange || '', activity: item.activity || '', location: item.location || '',
      status: item.status || '', hasHeartbeat: !!item.hasHeartbeat, innerThought: item.innerThought || '', detailedDesc: item.detailedDesc || ''
    });
    showScheduleEditModal.value = true;
  };

  const saveScheduleItem = () => {
    const key = `${selectedScheduleCharId.value}_${selectedDateStr.value}`;
    if (!savedSchedules.value[key]) savedSchedules.value[key] = [];
    const newItem = { ...scheduleForm };
    if (!newItem.hasHeartbeat) newItem.innerThought = ''; 
    
    if (editingItemIndex.value === -1) {
      savedSchedules.value[key].push(newItem);
      savedSchedules.value[key].sort((a, b) => a.timeRange.localeCompare(b.timeRange));
    } else {
      savedSchedules.value[key][editingItemIndex.value] = newItem;
    }
    saveSchedulesToLocal();
    showScheduleEditModal.value = false;
  };

  const deleteScheduleItem = (index) => {
    if(confirm('确定要删除这条行程吗？')) {
       const key = `${selectedScheduleCharId.value}_${selectedDateStr.value}`;
       savedSchedules.value[key].splice(index, 1);
       saveSchedulesToLocal();
    }
  };

  // 独立后台生成状态管理
  const generatingStates = reactive({});
  const isGeneratingCurrent = computed(() => {
    const key = `${selectedScheduleCharId.value}_${selectedDateStr.value}`;
    return !!generatingStates[key];
  });

  const generateSchedule = async () => {
    if (!selectedScheduleCharId.value) { alert("请先选择一个联系人！"); return; }
    if (currentSchedule.value.length > 0) {
      if(!confirm("当前已有日程，重新生成将覆盖现有内容，确定继续吗？")) return;
    }
    
    // 锁定当前请求的上下文（就算用户切走了，也要存到对的字典里）
    const targetCharId = selectedScheduleCharId.value;
    const targetDateStr = selectedDateStr.value;
    const targetKey = `${targetCharId}_${targetDateStr}`;
    
    generatingStates[targetKey] = true;
    const charObj = personaList.value.find(p => p.id === targetCharId);
    
    let wbContent = '';
    if (worldbooks && worldbooks.value) {
      const activeWbs = worldbooks.value.filter(wb => wb.boundPersonaIds.includes('global') || wb.boundPersonaIds.includes(charObj.id));
      wbContent = activeWbs.map(wb => wb.content).join('\n');
    }

    const prompt = `你现在负责为角色【${charObj.name}】安排在 ${targetDateStr} 这一天的日程。
角色的设定是：${charObj.personaPrompt || charObj.appearance}
所在的世界规则是：${wbContent}

要求：
1. 生成一个完整且丰富的全天行程安排，请根据该角色的作息习惯自然排布。
2. 必须包含详细的【饮食行程】，并在详细描述中具体描写吃了什么食物、饮品以及就餐环境。
3. 严格按 JSON 数组格式输出，必须包含以下 7 个绝对字段：
   - timeRange: 字符串，如 "08:00 - 09:30"
   - activity: 字符串，简短的主要行程标题（10字以内）
   - location: 字符串，详细地点
   - status: 字符串，用 2-4 个字描述身体或精神状态（如:疲惫/专注/愉悦/慵懒）
   - detailedDesc: 字符串。该行程的丰富细节扩写（50-150字），详细描述角色在做什么、周围环境的氛围。
   - hasHeartbeat: 布尔值。随机让大约 30%-40% 的行程触发心跳（设为 true），其余设为 false。
   - innerThought: 字符串。如果 hasHeartbeat 为 true，写下一段第一人称的心理活动（针对玩家的思念、吃醋或对当前事件的吐槽，30字以内）；如果为 false，留空 ""。
4. 纯 JSON 格式返回，不要有任何 Markdown 代码块包裹（不要输出 \`\`\`json ）。`;

    try {
      const base = settings.baseUrl || '';
      let apiUrl = `${base}/v1/chat/completions`;
      if (base.endsWith('/')) apiUrl = `${base}v1/chat/completions`;
      if (base.endsWith('/v1')) apiUrl = `${base}/chat/completions`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
        body: JSON.stringify({ model: settings.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
      });

      const data = await response.json();
      let text = data.choices[0].message.content;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) text = text.substring(jsonStart, jsonEnd);
      
      const parsed = JSON.parse(text);
      savedSchedules.value[targetKey] = parsed;
      saveSchedulesToLocal();

    } catch (error) {
      console.error(error);
      alert(`生成【${charObj.name}】的日程失败，请重试。`);
    } finally {
      delete generatingStates[targetKey];
    }
  };

  return {
    currentYear, currentMonth, selectedDateStr, selectedScheduleCharId, calendarDays,
    scheduleUiMode, uiModeNames, cycleUiMode,
    prevMonth, nextMonth, selectDate, currentSchedule, isGeneratingCurrent,
    generateSchedule, initSchedule,
    showScheduleEditModal, scheduleForm, openAddSchedule, openEditSchedule, saveScheduleItem, deleteScheduleItem,
    showScheduleDetailModal, activeScheduleDetailItem, openScheduleDetail
  };
}