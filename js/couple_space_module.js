// js/couple_space_module.js
function useCoupleSpaceModule(personaList, activeDailySessions, settings = {}, imageConfig = {}) {
    const { ref, reactive, computed, watch, onMounted, onUnmounted } = Vue;

    const coupleSpaces = ref([]);
    
    onMounted(async () => {
        let data = null;
        if (typeof dbGetItem === 'function') data = await dbGetItem('se_couple_spaces');
        if (!data) data = JSON.parse(localStorage.getItem('se_couple_spaces') || '[]');
        
        data.forEach(space => {
            if (!space.flora) space.flora = { level: 1, exp: 0, maxExp: 100, imgUrl: '' };
            if (!space.pet) space.pet = { status: 'idle', history: [], hasUnread: false, unreadData: null, returnTime: 0, backpack: [], type: 'sprite', avatar: '' };
            if (!space.pet.history) space.pet.history = [];
            if (!space.pet.backpack) space.pet.backpack = [];
            if (!space.pet.type) space.pet.type = 'sprite';
            if (space.pet.avatar === undefined) space.pet.avatar = '';
            if (space.resonanceScore === undefined) space.resonanceScore = 90;
        });
        coupleSpaces.value = data;
    });

    const activeSpacePersonaId = ref(null);
    const saveCoupleSpaces = async () => { 
        if (typeof dbSetItem === 'function') {
            await dbSetItem('se_couple_spaces', JSON.parse(JSON.stringify(coupleSpaces.value)));
        } else {
            try { localStorage.setItem('se_couple_spaces', JSON.stringify(coupleSpaces.value)); } catch(e){}
        }
    };

    const getCurrentSpace = computed(() => coupleSpaces.value.find(s => s.personaId === activeSpacePersonaId.value) || null);
    const getAnniversaryDays = (startDate) => { if (!startDate) return 0; return Math.floor(Math.abs(new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)); };

    const showPetTimelineModal = ref(false);

    const timelineRows = computed(() => {
        const hist = getCurrentSpace.value?.pet?.history || [];
        const rows = [];
        const itemsPerRow = 2; 
        for (let i = 0; i < hist.length; i += itemsPerRow) {
            rows.push(hist.slice(i, i + itemsPerRow));
        }
        return rows;
    });

    const deleteTimelineRecord = (recordId) => {
        if (!getCurrentSpace.value) return;
        if (confirm('确定要删除这段时空印记吗？(这不会影响已存入信物箱的物品)')) {
            getCurrentSpace.value.pet.history = getCurrentSpace.value.pet.history.filter(r => r.id !== recordId);
            saveCoupleSpaces();
            return true;
        }
        return false;
    };

    // ★ 新增：独立删除信物箱物品的功能
    const deleteBackpackItem = (itemId) => {
        if (!getCurrentSpace.value) return;
        if (confirm('确定要从信物箱丢弃这件物品吗？')) {
            getCurrentSpace.value.pet.backpack = getCurrentSpace.value.pet.backpack.filter(b => b.id !== itemId);
            saveCoupleSpaces();
        }
    };

    const aiConfirmDialog = reactive({ show: false, title: '', desc: '', confirmText: '✨ 确认调用', onConfirm: null });
    const openAiConfirm = (title, desc, callback) => { aiConfirmDialog.title = title; aiConfirmDialog.desc = desc; aiConfirmDialog.onConfirm = callback; aiConfirmDialog.show = true; };
    const handleAiConfirmYes = async () => { const cb = aiConfirmDialog.onConfirm; aiConfirmDialog.show = false; if (typeof cb === 'function') await cb(); };
    const handleAiConfirmCancel = () => { aiConfirmDialog.show = false; aiConfirmDialog.onConfirm = null; };

    const callImageGenerationApi = async (promptText) => {
        const localImgCfgStr = localStorage.getItem('se_img_config') || '{}';
        const localImgCfg = JSON.parse(localImgCfgStr);
        const provider = (imageConfig && imageConfig.provider) || localImgCfg.provider || 'public';
        const apiKey = (imageConfig && imageConfig.apiKey) || localImgCfg.apiKey || (settings && settings.apiKey) || '';
        const rawBaseUrl = (imageConfig && imageConfig.baseUrl) || localImgCfg.baseUrl || (settings && settings.baseUrl) || 'https://api.openai.com';
        const modelName = (imageConfig && imageConfig.model) || localImgCfg.model || 'dall-e-3';

        if (provider !== 'public' && !apiKey) throw new Error('请先前往主页【接口设置】配置生图 API Key！');

        if (provider === 'public') {
            const seed = Math.floor(Math.random() * 999999);
            const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=512&height=512&seed=${seed}&nologo=true`;
            await new Promise((resolve, reject) => {
                const img = new Image(); img.onload = resolve; img.onerror = () => reject(new Error('免费生图节点网络超时')); img.src = imgUrl;
            });
            return imgUrl;
        } else {
            const base = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
            const endpoint = base.endsWith('/v1') ? `${base}/images/generations` : `${base}/v1/images/generations`;
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model: modelName, prompt: promptText, n: 1, size: "1024x1024" })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const url = data.data?.[0]?.url || (data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : '');
            if (!url) throw new Error('API 未返回有效图片数据');
            return url;
        }
    };

    const sendCoupleSpaceInvite = async (currentDailySession, getAffectionScore, getPersonaObj, getUserPersonaObj) => {
        if (!currentDailySession) return; const pId = currentDailySession.personaId;
        if (coupleSpaces.value.some(s => s.personaId === pId)) { alert('你们已有专属情侣空间啦！'); return; }
        if (getAffectionScore(pId) < 75) { alert('契合度不足75，再多聊聊吧~'); return; }

        const inviteMsgId = 'inv_' + Date.now();
        currentDailySession.messages.push({ id: inviteMsgId, role: 'system', isCoupleInvite: true, text: '💌 一份【专属情侣空间】建立邀请。', status: 'waiting' });
        const p = getPersonaObj(pId); const up = getUserPersonaObj(currentDailySession.userPersonaId) || { name: '你' };
        
        try {
            const base = (settings?.baseUrl || '').endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
            const resp = await fetch(`${base}/v1/chat/completions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings?.apiKey || ''}` },
                body: JSON.stringify({ model: settings?.model || '', messages: [{ role: 'user', content: `你扮演【${p.name}】。玩家【${up.name}】发送了建立情侣空间邀请。输出JSON：{"reply":"答应的台词","letter":"情书"}` }] })
            });
            const parsed = JSON.parse((await resp.json()).choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
            const inviteMsg = currentDailySession.messages.find(m => m.id === inviteMsgId); if (inviteMsg) inviteMsg.status = 'accepted';
            currentDailySession.messages.push({ role: 'assistant', text: parsed.reply || '我愿意。', isNarrative: false });

            const todayStr = new Date().toISOString().split('T')[0];
            coupleSpaces.value.unshift({
                id: 'space_' + Date.now(), personaId: pId, inviteMsgId: inviteMsgId, startDate: new Date().toISOString(),
                diaryEntries: { [todayStr]: { userText: '', aiText: parsed.letter, userStickers: [], aiStickers: [], aiReplyToUser: '', userCommentToAi: '', aiReplyToComment: '' } },
                flora: { level: 1, exp: 0, maxExp: 100, imgUrl: '' },
                pet: { status: 'idle', history: [], hasUnread: false, unreadData: null, returnTime: 0, backpack: [], type: 'sprite', avatar: '' },
                resonanceScore: 90
            }); saveCoupleSpaces();
        } catch (e) { alert('邀请失败：' + e.message); currentDailySession.messages.pop(); }
    };

    // 日记本逻辑保持不变
    const showDiaryModal = ref(false); const isDiaryFlipped = ref(false); const showDiarySettings = ref(false); const isGeneratingDiary = ref(false);
    const diaryConfig = reactive(JSON.parse(localStorage.getItem('se_diary_config') || '{"theme":"diary-theme-classic","font":"font-serif","customBg":"","customFont":""}'));
    const applyCustomFont = (bFont) => { if(!bFont)return; let st=document.getElementById('se-c-font'); if(!st){st=document.createElement('style'); st.id='se-c-font'; document.head.appendChild(st);} st.innerHTML=`@font-face{font-family:'DiaryCustomFont';src:url(${bFont});}`; };
    if (diaryConfig.customFont) applyCustomFont(diaryConfig.customFont); watch(diaryConfig, newVal => localStorage.setItem('se_diary_config', JSON.stringify(newVal)), { deep: true });

    const selectedDiaryDate = ref(new Date().toISOString().split('T')[0]);
    const currentDiaryEntry = computed(() => {
        if (!getCurrentSpace.value || !selectedDiaryDate.value) return null;
        let entry = getCurrentSpace.value.diaryEntries?.[selectedDiaryDate.value];
        if (!entry) { entry = { userText: '', aiText: '', userStickers: [], aiStickers: [], aiReplyToUser: '', userCommentToAi: '', aiReplyToComment: '' }; if(!getCurrentSpace.value.diaryEntries)getCurrentSpace.value.diaryEntries={}; getCurrentSpace.value.diaryEntries[selectedDiaryDate.value] = entry; }
        if (!entry.userStickers) entry.userStickers = []; if (!entry.aiStickers) entry.aiStickers = []; return entry;
    });

    const saveUserDiary = (text) => { if (currentDiaryEntry.value) { currentDiaryEntry.value.userText = text; saveCoupleSpaces(); } };
    const deleteCurrentDiary = () => { if (confirm('删除日记？')) { delete getCurrentSpace.value.diaryEntries[selectedDiaryDate.value]; saveCoupleSpaces(); showDiarySettings.value = false; } };
    const handleDiaryBgUpload = (e) => { const f = e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{diaryConfig.customBg=ev.target.result; diaryConfig.theme='custom';}; r.readAsDataURL(f); };
    const handleDiaryFontUpload = (e) => { const f = e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{diaryConfig.customFont=ev.target.result; diaryConfig.font='font-custom'; applyCustomFont(ev.target.result);}; r.readAsDataURL(f); };

    const activeSticker = ref(null);
    const dragState = reactive({ isDragging: false, isResizing: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, startSize: 0, containerRef: null });
    let pressTimer = null; let isTouchMoved = false;

    const addSticker = (url) => { if(!url||!currentDiaryEntry.value)return; const n = {id:'stk_'+Date.now(),url,x:20,y:20,size:80}; if(isDiaryFlipped.value)currentDiaryEntry.value.aiStickers.push(n); else currentDiaryEntry.value.userStickers.push(n); saveCoupleSpaces(); };
    const handleStickerUpload = (e) => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>addSticker(ev.target.result); r.readAsDataURL(f); };
    const addStickerByUrl = () => { const url=prompt("输入URL："); if(url)addSticker(url.trim()); };
    const deleteSticker = (id) => { if(isDiaryFlipped.value)currentDiaryEntry.value.aiStickers=currentDiaryEntry.value.aiStickers.filter(s=>s.id!==id); else currentDiaryEntry.value.userStickers=currentDiaryEntry.value.userStickers.filter(s=>s.id!==id); activeSticker.value=null; saveCoupleSpaces(); };
    
    const getClientPos = e => e.touches ? {x: e.touches[0].clientX, y: e.touches[0].clientY} : {x: e.clientX, y: e.clientY};
    const handleStickerDown = (e, st, container) => { if(e.target.classList.contains('sticker-ctrl-btn'))return; isTouchMoved=false; dragState.containerRef=container; const pos=getClientPos(e); dragState.startX=pos.x; dragState.startY=pos.y; dragState.startLeft=st.x; dragState.startTop=st.y; pressTimer=setTimeout(()=>{if(!isTouchMoved){activeSticker.value=st; dragState.isDragging=true; if(navigator.vibrate)navigator.vibrate(50);}}, 800); };
    const startStickerResize = (e, st, container) => { activeSticker.value=st; dragState.isResizing=true; dragState.containerRef=container; const pos=getClientPos(e); dragState.startX=pos.x; dragState.startY=pos.y; dragState.startSize=st.size; };
    const handleGlobalMove = (e) => { const pos=getClientPos(e); if(Math.abs(pos.x-dragState.startX)>5 || Math.abs(pos.y-dragState.startY)>5){isTouchMoved=true; if(!dragState.isDragging && pressTimer){clearTimeout(pressTimer); pressTimer=null;}} if(!dragState.isDragging && !dragState.isResizing)return; if(e.preventDefault)e.preventDefault(); const dx=pos.x-dragState.startX; const dy=pos.y-dragState.startY; if(dragState.isDragging && dragState.containerRef){const cw=dragState.containerRef.clientWidth; const ch=dragState.containerRef.clientHeight; activeSticker.value.x=dragState.startLeft+(dx/cw)*100; activeSticker.value.y=dragState.startTop+(dy/ch)*100;} else if(dragState.isResizing){activeSticker.value.size=Math.max(30, dragState.startSize+(dx+dy)/1.5);} };
    const handleGlobalEnd = () => { if(pressTimer){clearTimeout(pressTimer); pressTimer=null;} if(dragState.isDragging||dragState.isResizing){dragState.isDragging=false; dragState.isResizing=false; saveCoupleSpaces();} };
    const handleStickerUp = (e, st) => { if(pressTimer){clearTimeout(pressTimer); pressTimer=null;} if(!dragState.isDragging && !dragState.isResizing && !isTouchMoved){if(activeSticker.value?.id===st.id)activeSticker.value=null; else activeSticker.value=st;} };
    const clearStickerSelection = () => { activeSticker.value = null; };

    const isInteracting = ref(false);
    const generateAIDiary = async (getPersonaObj) => {
        if (isGeneratingDiary.value || !getCurrentSpace.value) return;
        isDiaryFlipped.value = true; isGeneratingDiary.value = true; showDiarySettings.value = false;
        try {
            const base = (settings?.baseUrl || '').endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
            const resp = await fetch(`${base}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings?.apiKey||''}` }, body: JSON.stringify({ model: settings?.model||'', messages: [{ role: 'user', content: `扮演【${getPersonaObj(getCurrentSpace.value.personaId).name}】。玩家日记：${currentDiaryEntry.value.userText}。在另一面写你的日记（150字）。输出 JSON：{"diary": "正文"}` }] }) });
            currentDiaryEntry.value.aiText = JSON.parse((await resp.json()).choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}').diary; saveCoupleSpaces();
        } catch (e) { alert('API 异常'); } finally { isGeneratingDiary.value = false; }
    };
    const pokeCharForComment = async (getPersonaObj) => {
        if (!currentDiaryEntry.value.userText.trim()) return; isInteracting.value = true;
        try {
            const base = (settings?.baseUrl || '').endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
            const resp = await fetch(`${base}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings?.apiKey||''}` }, body: JSON.stringify({ model: settings?.model||'', messages: [{ role: 'user', content: `扮演【${getPersonaObj(getCurrentSpace.value.personaId).name}】批注日记："${currentDiaryEntry.value.userText}"。简短便签。输出JSON：{"reply": "留言"}` }] }) });
            currentDiaryEntry.value.aiReplyToUser = JSON.parse((await resp.json()).choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}').reply; saveCoupleSpaces(); getCurrentSpace.value.flora.exp += 15;
        } catch (e) {} finally { isInteracting.value = false; }
    };
    const commentInput = ref('');
    const replyToCharDiary = async (getPersonaObj) => {
        if (!commentInput.value.trim()) return; currentDiaryEntry.value.userCommentToAi = commentInput.value.trim(); commentInput.value = ''; saveCoupleSpaces(); isInteracting.value = true;
        try {
            const base = (settings?.baseUrl || '').endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
            const resp = await fetch(`${base}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings?.apiKey||''}` }, body: JSON.stringify({ model: settings?.model||'', messages: [{ role: 'user', content: `扮演【${getPersonaObj(getCurrentSpace.value.personaId).name}】回复留言。输出 JSON：{"reply": "回复"}` }] }) });
            currentDiaryEntry.value.aiReplyToComment = JSON.parse((await resp.json()).choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}').reply; saveCoupleSpaces(); getCurrentSpace.value.flora.exp += 15;
        } catch (e) {} finally { isInteracting.value = false; }
    };

    const showFloraModal = ref(false); const showNebulaModal = ref(false);
    const getHeartbeatQuotes = (pId) => { const list = JSON.parse(localStorage.getItem('se_collected_heartbeats') || '{}')[pId] || []; return list.length > 0 ? list.map(h => h.summary) : ['“时空流转，我依然会在每个宇宙找到你。”', '“听见了吗？这就是我为你跳动的声音。”']; };
    const waterFlora = () => { if (!getCurrentSpace.value) return; getCurrentSpace.value.flora.exp += 10; if (getCurrentSpace.value.flora.exp >= getCurrentSpace.value.flora.maxExp) { getCurrentSpace.value.flora.level++; getCurrentSpace.value.flora.exp = 0; getCurrentSpace.value.flora.maxExp = getCurrentSpace.value.flora.level * 100; } saveCoupleSpaces(); alert('💧 浇水成功！'); };

    const petMessageInput = ref('');
    const isPetTraveling = computed(() => getCurrentSpace.value && getCurrentSpace.value.pet.status === 'traveling');
    const petTimeLeft = ref('');
    const showBackpackModal = ref(false);
    const showRecordDetailModal = ref(false);
    const activeRecordDetail = ref(null);

    let timerInterval = null; let ambientAudio = null;
    const playAmbientSound = (soundType) => {
        if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; }
        let url = '';
        if (soundType === 'rain') url = 'https://www.soundjay.com/nature/sounds/rain-01.mp3';
        else if (soundType === 'wind') url = 'https://www.soundjay.com/nature/sounds/wind-breeze-01.mp3';
        if (url) { ambientAudio = new Audio(url); ambientAudio.volume = 0.5; ambientAudio.play().catch(() => {}); }
    };

    const showPetAvatarModal = ref(false);
    const petAvatarTab = ref('default'); 
    const petAvatarPrompt = ref('');
    const isGeneratingPetAvatar = ref(false);

    const setPetType = (type) => {
        if (!getCurrentSpace.value) return;
        getCurrentSpace.value.pet.type = type;
        getCurrentSpace.value.pet.avatar = '';
        saveCoupleSpaces();
        showPetAvatarModal.value = false;
        alert(`已切换为【${type === 'sprite' ? '星光雪球' : '幻梦流光'}】形态！`);
    };

    const handlePetAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = 300;
                canvas.width = size; canvas.height = size;
                const min = Math.min(img.width, img.height);
                const sx = (img.width - min) / 2; const sy = (img.height - min) / 2;
                ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
                getCurrentSpace.value.pet.avatar = canvas.toDataURL('image/jpeg', 0.85);
                saveCoupleSpaces();
                showPetAvatarModal.value = false;
                alert('自定义云兽头像上传成功！');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const executeGeneratePetAvatar = async () => {
        if (isGeneratingPetAvatar.value || !getCurrentSpace.value || !petAvatarPrompt.value.trim()) return;
        isGeneratingPetAvatar.value = true;
        try {
            const prompt = `Masterpiece 2D game app icon, a cute and magical pet creature, ${petAvatarPrompt.value.trim()}, dreamy pastel fantasy art style, soft magical bokeh lights, highly detailed, centered composition.`;
            const imgUrl = await callImageGenerationApi(prompt);
            getCurrentSpace.value.pet.avatar = imgUrl;
            saveCoupleSpaces();
            showPetAvatarModal.value = false;
            alert('AI 专属云兽头像绘制成功！');
        } catch (e) {
            alert('图标生成失败：' + e.message);
        } finally {
            isGeneratingPetAvatar.value = false;
        }
    };

    const checkPetTravelTime = () => {
        if (!getCurrentSpace.value) return;
        const pet = getCurrentSpace.value.pet;
        if (pet.status === 'traveling') {
            const now = Date.now();
            if (now >= pet.returnTime) { pet.status = 'returned'; pet.hasUnread = true; saveCoupleSpaces(); if (navigator.vibrate) navigator.vibrate([100, 50, 100]); } 
            else { const diff = Math.floor((pet.returnTime - now) / 1000); petTimeLeft.value = `${String(Math.floor(diff / 60)).padStart(2,'0')}:${String(diff % 60).padStart(2,'0')}`; }
        }
    };
    onMounted(() => { timerInterval = setInterval(checkPetTravelTime, 1000); });
    onUnmounted(() => { if (timerInterval) clearInterval(timerInterval); if (ambientAudio) ambientAudio.pause(); });

    const getEventTypeName = (type) => {
        switch(type) {
            case 'selfie': return '🤳 专属定格';
            case 'candid': return '🎞️ 秘境底片';
            case 'item': return '🎁 跨界信物';
            case 'dialogue': return '💌 灵魂私语';
            case 'status': return '🌌 远方剪影';
            default: return '✨ 时空印记';
        }
    };

    // ★ 优化需求 2 & 3：完全随机 5 种事件，引入偷取信物设定，彻底禁止玩家入画
    const sendPetToChar = async (getPersonaObj) => {
        if (isPetTraveling.value) return;
        const userMsg = petMessageInput.value.trim(); petMessageInput.value = '';
        const flightDuration = Math.floor(Math.random() * 25000) + 12000; 
        getCurrentSpace.value.pet.status = 'traveling'; getCurrentSpace.value.pet.returnTime = Date.now() + flightDuration; saveCoupleSpaces();

        const p = getPersonaObj(getCurrentSpace.value.personaId);
        try {
            const base = (settings?.baseUrl || '').endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
            const promptContent = `【绝对核心规则：使魔前往同伴的世界，玩家(User)绝对不能出现在任何画面中！】
你扮演【${p.name}】（外貌与穿搭：${p.appearance}。核心性格：${p.personaPrompt || p.traits}）。玩家派使魔来看你${userMsg ? '，带话："'+userMsg+'"' : ''}。
请在以下 5 种事件中【随机等概率选择 1 种】发生：
1. "status": 客观描写你当下的状态（无图）。
2. "dialogue": 你发现了使魔，并托它给玩家带句话（无图）。
3. "candid": 使魔偷偷抓拍了你的生活照（画面只有你一人，需生图）。
4. "selfie": 你主动拿着使魔对镜头自拍并留言（画面只有你一人，需生图）。
5. "item": 实体信物（需生图）。此处必须再随机决定：A. 你主动送给玩家的小物件；B. 云兽趁你不注意悄悄顺走/偷走的小物件（如咖啡杯、钢笔、领带）。你要根据是A还是B，在 text 里给出符合人设的文字反应（送礼的温柔，或发现东西没了的无奈/生气/好笑）。

严格输出合法 JSON：
{
  "type": "status" 或 "dialogue" 或 "candid" 或 "item" 或 "selfie",
  "text": "对应的内容台词或状态描述。如果是item被偷走，描写你发现东西不见时的傲娇/无奈反应。",
  "photoDesc": "如果是 candid/item/selfie，请务必生成一句专业的高质量纯英文 Stable Diffusion 提示词！必须把你设定的外貌特征（${p.appearance}）翻译成英文融入。candid/selfie 强制加 '1boy/1girl, solo, NO OTHER PEOPLE'；item 则是宏观物品特写，不出现人脸。无图类型留空。",
  "lootName": "对应的名称（如：被顺走的钢笔、工作抓拍底片、温存便签）"
}`;

            const resp = await fetch(`${base}/v1/chat/completions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings?.apiKey||''}` },
                body: JSON.stringify({ model: settings?.model||'', messages: [{ role: 'user', content: promptContent }] })
            });
            const parsed = JSON.parse((await resp.json()).choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
            
            const eventType = parsed.type || 'dialogue';
            const isPhoto = (eventType === 'candid' || eventType === 'item' || eventType === 'selfie');

            getCurrentSpace.value.pet.unreadData = {
                id: 'rec_' + Date.now(), 
                type: eventType, 
                eventTypeName: getEventTypeName(eventType),
                from: isPhoto ? (eventType === 'candid' ? '使魔抓拍' : p.name) : p.name,
                text: parsed.text || '“很想你。”', 
                imgUrl: '', 
                isDeveloped: false, 
                photoDesc: parsed.photoDesc || '',
                lootName: parsed.lootName || (eventType === 'candid' ? '生活抓拍底片' : (eventType === 'item' ? '时空信物' : '温存便签')),
                color: isPhoto ? 'pink' : (eventType === 'status' ? 'blue' : 'purple'), 
                sound: isPhoto ? 'rain' : 'none', 
                userMsg: userMsg || '', 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }; 
            saveCoupleSpaces();
        } catch (e) {
            getCurrentSpace.value.pet.unreadData = {
                id: 'rec_' + Date.now(), type: 'dialogue', eventTypeName: '💌 灵魂私语', from: p.name, text: '“时空信号微弱，但我依然在想你。”', imgUrl: '', isDeveloped: false, lootName: '时空信笺', color: 'blue', sound: 'wind', userMsg: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }; saveCoupleSpaces();
        }
    };

    const forceRecallPet = () => {
        if (!isPetTraveling.value) return; getCurrentSpace.value.pet.status = 'idle'; getCurrentSpace.value.pet.returnTime = 0;
        if (Math.random() > 0.3 && !getCurrentSpace.value.pet.unreadData) { getCurrentSpace.value.pet.hasUnread = false; getCurrentSpace.value.pet.unreadData = null; alert("使魔两手空空地回来了..."); } 
        else {
            if (!getCurrentSpace.value.pet.unreadData) getCurrentSpace.value.pet.unreadData = { id: 'rec_' + Date.now(), type: 'candid', eventTypeName: '🎞️ 秘境底片', from: '使魔抓拍', text: '匆匆抓拍到的模糊背影', imgUrl: '', isDeveloped: false, photoDesc: "candid snapshot, back view of a person, blurry, cinematic", lootName: '匆忙抓拍的底片', color: 'purple', sound: 'none', userMsg: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            getCurrentSpace.value.pet.status = 'returned'; getCurrentSpace.value.pet.hasUnread = true;
        } saveCoupleSpaces();
    };

    // ★ 优化需求 1 & 4：戳破光球不弹详情，只提示。若为信物，自动丢入信物箱。
    const burstingOrb = ref(false); 
    const showOrbResultToast = ref(false);
    const orbResultEventName = ref('');

    const burstUnreadOrb = () => {
        if (!getCurrentSpace.value.pet.hasUnread || !getCurrentSpace.value.pet.unreadData) return;
        burstingOrb.value = true;
        setTimeout(() => {
            const data = getCurrentSpace.value.pet.unreadData;
            playAmbientSound(data.sound);
            
            // 自动存入历史记录
            getCurrentSpace.value.pet.history.unshift(data); 
            getCurrentSpace.value.pet.hasUnread = false;
            getCurrentSpace.value.pet.unreadData = null;
            getCurrentSpace.value.pet.status = 'idle';
            
            // ★ 需求 4：如果是信物（不管显没显影），直接存进信物箱
            if (data.type === 'item') {
                const bpIndex = getCurrentSpace.value.pet.backpack.findIndex(item => item.id === data.id);
                if (bpIndex === -1) {
                    getCurrentSpace.value.pet.backpack.unshift({ 
                        id: data.id, 
                        name: data.lootName, 
                        imgUrl: '', 
                        date: new Date().toLocaleDateString()
                    });
                }
            }

            burstingOrb.value = false;
            saveCoupleSpaces();
            
            // ★ 需求 1：只弹出轻量提示框揭晓盲盒
            orbResultEventName.value = data.eventTypeName;
            showOrbResultToast.value = true;
        }, 450); 
    };

    // ★ 优化需求 5：三段式视图控制 ('text' -> 'config' -> 'image')
    const recordViewState = ref('text');
    const photoPromptInput = ref('');
    const photoStyle = ref('realistic'); 
    const developingItems = reactive({});

    const STYLE_PRESETS = {
        realistic: "Cinematic photography, photorealistic, 8k UHD, masterpiece, cinematic soft lighting, shot on 35mm lens, depth of field",
        anime: "Masterpiece aesthetic anime romance illustration, Makoto Shinkai style, vibrant pastel colors, delicate line art, gorgeous volumetric lighting",
        polaroid: "Authentic vintage grainy 90s polaroid snapshot, warm flash photography, nostalgic film texture, disposable camera effect, candid emotion",
        watercolor: "Soft dreamy pastel watercolor illustration, delicate wet-on-wet brush strokes, romantic storybook atmosphere, whimsical"
    };

    const buildAutoPrompt = (record, persona) => {
        if (record.photoDesc && record.photoDesc.trim() !== '') {
            return record.photoDesc;
        }
        const appearancePrompt = persona?.appearance ? persona.appearance : '1 person, highly detailed face';
        if (record.type === 'item') {
            return `macro photography of ${record.lootName || 'item'}, highly detailed, cinematic lighting, close up`;
        } else {
            return `solo, 1 person, ${appearancePrompt}, candid snapshot, natural lighting, highly detailed, no other people`;
        }
    };

    const openRecordDetail = (record) => { 
        activeRecordDetail.value = record; 
        
        // 判断初始状态
        if (record.isDeveloped) {
            recordViewState.value = 'image';
        } else {
            recordViewState.value = 'text';
        }
        
        const p = (getCurrentSpace.value) ? personaList.value.find(item => item.id === getCurrentSpace.value.personaId) : null;
        photoPromptInput.value = buildAutoPrompt(record, p);
        
        if (!activeRecordDetail.value.eventTypeName) {
            activeRecordDetail.value.eventTypeName = getEventTypeName(activeRecordDetail.value.type);
        }

        showRecordDetailModal.value = true; 
    };
    
    const closeRecordDetail = () => { 
        showRecordDetailModal.value = false; 
        setTimeout(() => activeRecordDetail.value = null, 250); 
    };

    const enterDevelopConfig = () => {
        recordViewState.value = 'config';
    };

    const executePhotoGeneration = async (record) => {
        if (!record || developingItems[record.id]) return;
        developingItems[record.id] = true;

        try {
            const styleModifier = STYLE_PRESETS[photoStyle.value] || STYLE_PRESETS.realistic;
            const finalFullPrompt = `${styleModifier}, ${photoPromptInput.value.trim()}`;
            
            const imgUrl = await callImageGenerationApi(finalFullPrompt);
            record.imgUrl = imgUrl; 
            record.isDeveloped = true;
            
            if (activeRecordDetail.value && activeRecordDetail.value.id === record.id) {
                activeRecordDetail.value.imgUrl = imgUrl; 
                activeRecordDetail.value.isDeveloped = true;
                recordViewState.value = 'image'; // 生成成功后跳到图片视图
            }

            // 同步更新信物箱中这件信物的图片
            if (record.type === 'item') {
                const bpIndex = getCurrentSpace.value.pet.backpack.findIndex(item => item.id === record.id);
                if (bpIndex !== -1) {
                    getCurrentSpace.value.pet.backpack[bpIndex].imgUrl = imgUrl;
                } else {
                    getCurrentSpace.value.pet.backpack.unshift({ id: record.id, name: record.lootName, imgUrl: imgUrl, date: new Date().toLocaleDateString() });
                }
            }
            
            saveCoupleSpaces();
            alert('✨ 显影成功！');
        } catch (e) {
            alert('生图失败：' + e.message);
        } finally {
            developingItems[record.id] = false;
        }
    };

    // 根据 Backpack id 打开信物详情的方法（用于信物箱里点击待显影物品）
    const openRecordFromBackpack = (itemId) => {
        if (!getCurrentSpace.value) return;
        const targetRecord = getCurrentSpace.value.pet.history.find(r => r.id === itemId);
        if (targetRecord) {
            showBackpackModal.value = false; // 先关信物箱
            openRecordDetail(targetRecord);
        }
    };

    return {
        showPetTimelineModal, deleteTimelineRecord,
        showPetAvatarModal, petAvatarTab, petAvatarPrompt, isGeneratingPetAvatar, setPetType, handlePetAvatarUpload, executeGeneratePetAvatar,
        coupleSpaces, activeSpacePersonaId, getCurrentSpace, getAnniversaryDays, sendCoupleSpaceInvite, saveCoupleSpaces,
        timelineRows, aiConfirmDialog, openAiConfirm, handleAiConfirmYes, handleAiConfirmCancel,
        showDiaryModal, isDiaryFlipped, showDiarySettings, isGeneratingDiary, diaryConfig, selectedDiaryDate, currentDiaryEntry, saveUserDiary, deleteCurrentDiary, generateAIDiary, handleDiaryBgUpload, handleDiaryFontUpload,
        activeSticker, handleStickerUpload, addStickerByUrl, deleteSticker, clearStickerSelection, startStickerDrag: handleStickerDown, handleStickerUp, startStickerResize, handleGlobalMove, handleGlobalEnd,
        isInteracting, pokeCharForComment, commentInput, replyToCharDiary,
        showFloraModal, showNebulaModal, waterFlora, getHeartbeatQuotes,
        petMessageInput, isPetTraveling, petTimeLeft, sendPetToChar, forceRecallPet, 
        burstUnreadOrb, burstingOrb, showOrbResultToast, orbResultEventName,
        showBackpackModal, openRecordFromBackpack, deleteBackpackItem,
        showRecordDetailModal, activeRecordDetail, openRecordDetail, closeRecordDetail,
        recordViewState, enterDevelopConfig, photoPromptInput, photoStyle, developingItems, executePhotoGeneration
    };
}
window.useCoupleSpaceModule = useCoupleSpaceModule;