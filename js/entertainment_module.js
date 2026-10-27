/**
 * entertaiment_module.js
 * 娱乐休闲模块：采用 reactive 统一状态封装，确保万无一失
 */
window.useEntertainmentModule = function(Vue, context) {
  const { reactive, ref } = Vue;

  // 使用 reactive 统一管理所有状态，避免在 return 里散落几十个 ref 导致映射丢失
  const entertainmentState = reactive({
    showEntertainmentPage: false,
    showCinemaRoom: false,
    showMovieDetailModal: false,
    activeEntertainmentTab: 'movie',
    selectedMovie: null,
    videoSourceUrl: '',
    movieTitleInput: '',
    isVideoLoaded: false,
    isCharAnalyzingFrame: false,
    currentFramePreview: '',
    cinemaUserInput: '',
    cinemaChatLogs: [
      {
        role: 'system',
        text: '已进入双人放映室。选一部你们喜欢的电影，随时点击【让TA看这一幕】或发弹幕交流吧！',
        time: '00:00'
      }
    ],
    movieList: [
      {
        id: 'm1',
        title: '星际余温 (Interstellar Echo)',
        tag: '科幻 / 浪漫',
        duration: '148分钟',
        rating: '9.3',
        poster: '🎬',
        desc: '在无垠宇宙的边缘，唯有彼此的心跳是唯一的引力波。',
        status: '想看',
        review: '适合在关了灯的深夜，与TA裹同一条毛毯安静看完。'
      },
      {
        id: 'm2',
        title: '初雪落下的长椅',
        tag: '治愈 / 纯爱',
        duration: '112分钟',
        rating: '8.8',
        poster: '❄️',
        desc: '第七次下雪时，我们终于学会了坦诚说出那句喜欢。',
        status: '正在放映',
        review: 'TA中途悄悄把热可可推到了你手边。'
      }
    ],
    entertainmentPlaceholders: [
      { id: 'board_game', name: '桌游双人对决', icon: '♟️', status: '筹备中', desc: '飞行棋、心有灵犀大考验与定制双人卡牌' },
      { id: 'music_room', name: '双人私享歌单', icon: '🎧', status: '筹备中', desc: '一人一只耳机，沉浸在彼此收藏的深夜白噪音与BGM中' },
      { id: 'arcade_game', name: '复古街机厅', icon: '🕹️', status: '敬请期待', desc: '投币抓娃娃与双人格斗冒险' }
    ]
  });

  // DOM 引用
  const cinemaVideoRef = ref(null);
  const cinemaCanvasRef = ref(null);

  // 初始化方法（解决 initEntertainment 报错）
  const initEntertainment = () => {
    console.log("🎬 娱乐模块初始化成功");
    entertainmentState.showEntertainmentPage = true;
  };

  // 控制方法
  const openEntertainmentHub = () => { 
    console.log("👉 打开娱乐大厅");
    entertainmentState.showEntertainmentPage = true; 
  };
  const closeEntertainmentHub = () => { entertainmentState.showEntertainmentPage = false; };
  
  const openCinemaRoom = () => { 
    console.log("👉 打开双人放映厅");
    entertainmentState.showCinemaRoom = true; 
  };
  const closeCinemaRoom = () => { 
    entertainmentState.showCinemaRoom = false;
    if (cinemaVideoRef.value) cinemaVideoRef.value.pause();
  };

  const openMovieDetail = (movie) => {
    entertainmentState.selectedMovie = movie;
    entertainmentState.showMovieDetailModal = true;
  };

  const toggleMovieStatus = (movie) => {
    if (movie.status === '想看') movie.status = '正在放映';
    else if (movie.status === '正在放映') movie.status = '已看';
    else movie.status = '想看';
  };

  const handleMovieFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    entertainmentState.videoSourceUrl = localUrl;
    if (!entertainmentState.movieTitleInput) {
      entertainmentState.movieTitleInput = file.name.replace(/\.[^/.]+$/, "");
    }
    entertainmentState.isVideoLoaded = true;
    entertainmentState.cinemaChatLogs.push({
      role: 'char',
      text: `爆米花准备好啦，我们来看《${entertainmentState.movieTitleInput}》吧！`,
      time: '00:00'
    });
  };

  const loadMovieFromUrl = () => {
    if (!entertainmentState.videoSourceUrl.trim()) return;
    entertainmentState.isVideoLoaded = true;
  };

  const formatVideoTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const captureCurrentVideoFrame = () => {
    const video = cinemaVideoRef.value;
    if (!video || video.readyState < 2) return null;
    let canvas = cinemaCanvasRef.value;
    if (!canvas) {
      canvas = document.createElement('canvas');
      cinemaCanvasRef.value = canvas;
    }
    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / (video.videoWidth || 640));
    canvas.width = (video.videoWidth || 640) * scale;
    canvas.height = (video.videoHeight || 360) * scale;
    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      return null;
    }
  };

  const interactWithCharOverMovie = async (globalSettings, currentCompanion, userPersona) => {
    const video = cinemaVideoRef.value;
    const currentTimeStr = video ? formatVideoTime(video.currentTime) : '00:00';
    const userMsg = entertainmentState.cinemaUserInput.trim() || '（指了指屏幕）你看这一幕……';

    const frameBase64 = captureCurrentVideoFrame();
    entertainmentState.currentFramePreview = frameBase64;

    entertainmentState.cinemaChatLogs.push({
      role: 'user',
      text: userMsg,
      time: currentTimeStr,
      frame: frameBase64
    });
    entertainmentState.cinemaUserInput = '';

    entertainmentState.isCharAnalyzingFrame = true;
    try {
      const apiKey = globalSettings?.apiKey || '';
      const rawBaseUrl = globalSettings?.baseUrl || 'https://api.openai.com';
      const cleanBase = rawBaseUrl.replace(/\/+$/, '');
      const url = cleanBase.endsWith('/v1') ? `${cleanBase}/chat/completions` : `${cleanBase}/v1/chat/completions`;
      const model = globalSettings?.model || 'gpt-4o-mini';

      const charName = currentCompanion?.name || 'TA';
      const userNick = currentCompanion?.userNickname || '你';
      const charPrompt = currentCompanion?.personaPrompt || '温柔、细腻的恋人';

      const systemPrompt = `你现在正坐在沙发上，和${userNick}紧挨着一起看电影《${entertainmentState.movieTitleInput || '未知影片'}》。
当前影片播放进度为【${currentTimeStr}】。
你的角色人设：${charName}，${charPrompt}。
你现在看到了用户发过来的这一帧电影截图，以及${userNick}对你说的吐槽。
请做出符合你性格的真实反应：
1. 观察画面里的场景、人物动作或氛围并做简短点评（1~3句话）；
2. 伴随一点你们二人肢体互动（用括号包裹动作描写）。`;

      const userContent = [
        { type: 'text', text: `[播放进度 ${currentTimeStr}] ${userNick}说: "${userMsg}"` }
      ];
      if (frameBase64) {
        userContent.push({ type: 'image_url', image_url: { url: frameBase64, detail: 'low' } });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
          temperature: 0.8,
          max_tokens: 300
        })
      });

      if (!response.ok) throw new Error(`API 错误: ${response.status}`);
      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content || '（悄悄看了你一眼，似乎也很沉浸在剧情里）';

      entertainmentState.cinemaChatLogs.push({ role: 'char', text: aiReply, time: currentTimeStr });
    } catch (err) {
      console.error("伴看互动失败:", err);
      entertainmentState.cinemaChatLogs.push({ role: 'char', text: `（往你身边靠了靠）这一幕看得太入迷了……刚才没听清，你说什么？`, time: currentTimeStr });
    } finally {
      entertainmentState.isCharAnalyzingFrame = false;
    }
  };

  return {
    initEntertainment,
    entertainmentState,
    cinemaVideoRef,
    cinemaCanvasRef,
    openEntertainmentHub,
    closeEntertainmentHub,
    openCinemaRoom,
    closeCinemaRoom,
    openMovieDetail,
    toggleMovieStatus,
    handleMovieFileUpload,
    loadMovieFromUrl,
    formatVideoTime,
    interactWithCharOverMovie
  };
};