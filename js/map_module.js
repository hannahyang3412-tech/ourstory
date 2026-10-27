// js/map_module.js
function useMapModule() {
  const { ref, reactive, computed } = Vue;

  const dbName = "SE_MapStorage";
  const storeName = "mapImages";

  function openMapDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveMapImageToDB(id, base64Data) {
    const db = await openMapDB();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(base64Data, id);
    return new Promise(resolve => { tx.oncomplete = resolve; });
  }

  async function getMapImageFromDB(id) {
    const db = await openMapDB();
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(id);
    return new Promise(resolve => { req.onsuccess = () => resolve(req.result); });
  }

  async function deleteMapImageFromDB(id) {
    const db = await openMapDB();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
  }

  const mapList = ref(JSON.parse(localStorage.getItem('se_map_list') || '[]'));
  const activeMapFilterId = ref('all');

  const loadAllMapImages = async () => {
    for (let i = 0; i < mapList.value.length; i++) {
      if (mapList.value[i].hasDbImage) {
        getMapImageFromDB(mapList.value[i].id).then(img => {
          mapList.value[i].mapImageUrl = img;
        });
      }
    }
  };
  loadAllMapImages();

  const presetBuildings = [
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/House/3D/house_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Convenience%20store/3D/convenience_store_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Office%20building/3D/office_building_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hospital/3D/hospital_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Deciduous%20tree/3D/deciduous_tree_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Locomotive/3D/locomotive_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Airplane/3D/airplane_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Department%20store/3D/department_store_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cityscape/3D/cityscape_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Castle/3D/castle_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Stadium/3D/stadium_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Classical%20building/3D/classical_building_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Factory/3D/factory_3d.png", 
    "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Tent/3D/tent_3d.png" 
  ];

  const currentMapConfig = reactive({
    id: null,
    mapName: '',
    cityName: '',
    description: '',
    mapMode: 'sandbox',
    bgMaterial: 'parchment', // 默认设为复古羊皮纸
    mapImageUrl: '',
    isGenerated: false,
    isGeneratingMap: false,
    pins: [], 
    paths: [], 
    activeUserId: '',
    activeCharId: '',
    companionLocationId: null, // 新增：同伴当前所在的建筑 ID
    showMapAddModal: false, 
    showPinEditModal: false, 
    editingPinId: null,
    tempPinName: '',
    tempPinImage: '',
    draggingPinId: null,
    isLinkingMode: false,
    linkStartPinId: null
  });

  const filteredMapList = computed(() => {
    if (activeMapFilterId.value === 'all') return mapList.value;
    return mapList.value.filter(m => m.activeCharId === activeMapFilterId.value);
  });

  const saveMapListSafely = () => {
    const listToSave = mapList.value.map(m => {
      const copy = { ...m };
      delete copy.mapImageUrl; 
      return copy;
    });
    localStorage.setItem('se_map_list', JSON.stringify(listToSave));
  };

  const createNewMap = () => {
    currentMapConfig.id = 'map_' + Date.now();
    currentMapConfig.mapName = '未命名的新地图';
    currentMapConfig.cityName = '';
    currentMapConfig.description = '';
    currentMapConfig.mapMode = 'sandbox'; 
    currentMapConfig.bgMaterial = 'parchment'; 
    currentMapConfig.mapImageUrl = '';
    currentMapConfig.isGenerated = false;
    currentMapConfig.pins = [];
    currentMapConfig.paths = [];
    currentMapConfig.showMapAddModal = true;
  };

  const openMap = async (mapData) => {
    Object.assign(currentMapConfig, mapData);
    currentMapConfig.mapImageUrl = ''; 
    if (!currentMapConfig.paths) currentMapConfig.paths = [];
    if (!currentMapConfig.bgMaterial) currentMapConfig.bgMaterial = 'parchment';
    currentMapConfig.isLinkingMode = false;
    currentMapConfig.linkStartPinId = null;
    // === 新增：每次打开地图，随机让同伴出现在一个建筑里 ===
    if (currentMapConfig.pins && currentMapConfig.pins.length > 0) {
      // 随机抽取一个地标的 ID
      const randomPin = currentMapConfig.pins[Math.floor(Math.random() * currentMapConfig.pins.length)];
      currentMapConfig.companionLocationId = randomPin.id;
    } else {
      currentMapConfig.companionLocationId = null;
    }
    // ====================================================

    if (mapData.hasDbImage) {
      currentMapConfig.mapImageUrl = await getMapImageFromDB(mapData.id) || '';
    }
  };

  const updateCurrentMapData = async () => {
    if (!currentMapConfig.id) return;
    const index = mapList.value.findIndex(m => m.id === currentMapConfig.id);
    
    const mapDataForStorage = {
      id: currentMapConfig.id,
      mapName: currentMapConfig.mapName,
      cityName: currentMapConfig.cityName,
      description: currentMapConfig.description,
      mapMode: currentMapConfig.mapMode,
      bgMaterial: currentMapConfig.bgMaterial,
      hasDbImage: !!currentMapConfig.mapImageUrl, 
      isGenerated: currentMapConfig.isGenerated,
      pins: JSON.parse(JSON.stringify(currentMapConfig.pins)),
      paths: JSON.parse(JSON.stringify(currentMapConfig.paths)),
      activeUserId: currentMapConfig.activeUserId,
      activeCharId: currentMapConfig.activeCharId
    };

    const activeMapData = { ...mapDataForStorage, mapImageUrl: currentMapConfig.mapImageUrl };
    if (index >= 0) mapList.value[index] = activeMapData;
    else mapList.value.push(activeMapData);

    if (currentMapConfig.mapImageUrl) {
      await saveMapImageToDB(currentMapConfig.id, currentMapConfig.mapImageUrl);
    } else {
      await deleteMapImageFromDB(currentMapConfig.id);
    }

    saveMapListSafely();
  };

  const handleMapBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      currentMapConfig.mapImageUrl = event.target.result;
      currentMapConfig.bgMaterial = 'custom';
      updateCurrentMapData(); 
    };
    reader.readAsDataURL(file);
  };

  const generateMap = async (imageConfig) => {
    if (!currentMapConfig.cityName) {
      alert("请先填写城市/沙盘名称！");
      return;
    }
    currentMapConfig.isGeneratingMap = true;

    if (currentMapConfig.mapMode === 'sandbox' && currentMapConfig.bgMaterial !== 'custom') {
      setTimeout(() => {
        currentMapConfig.mapImageUrl = ''; 
        finishMapGeneration();
      }, 500);
      return;
    }

    if (!imageConfig || !imageConfig.apiKey || !imageConfig.baseUrl) {
      setTimeout(() => {
        currentMapConfig.mapImageUrl = "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80";
        finishMapGeneration();
      }, 1500);
      return;
    }

    try {
      let base = imageConfig.baseUrl.trim();
      if (base.endsWith('/')) base = base.slice(0, -1);
      if (base.endsWith('/v1')) base = base.slice(0, -3);

      const prompt = `A cute flat vector illustration of a city map, top-down isometric view, soft pastel colors. Features: ${currentMapConfig.cityName}, ${currentMapConfig.description}. MUST INCLUDE: distinct roads, green park areas, buildings. UI game map style, Q-version cartoon aesthetic, clean, minimalist. NO TEXT.`;
      
      const response = await fetch(`${base}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${imageConfig.apiKey.trim()}` },
        body: JSON.stringify({ model: imageConfig.model || 'dall-e-3', prompt: prompt, n: 1, size: "1024x1024" })
      });

      if (!response.ok) throw new Error(`接口拒绝 (${response.status})`);
      const data = await response.json();
      
      if (data && data.data && data.data.length > 0) {
        const imgData = data.data[0];
        currentMapConfig.mapImageUrl = imgData.url || ('data:image/jpeg;base64,' + imgData.b64_json);
        finishMapGeneration();
      } else throw new Error("API返回数据为空");
    } catch (err) {
      alert("生成地图失败: " + err.message);
      currentMapConfig.isGeneratingMap = false;
    }
  };

  const generateBackgroundFromLayout = async (imageConfig) => {
    if (!imageConfig || !imageConfig.apiKey || !imageConfig.baseUrl) {
      alert("请先在「设置-接口设置」中配置生图 API！");
      return;
    }
    if (currentMapConfig.pins.length === 0) {
      alert("沙盘上没有任何建筑，请先摆放几个地标！");
      return;
    }
    currentMapConfig.isGeneratingMap = true;

    try {
      const layoutDesc = currentMapConfig.pins.map(pin => {
        let pos = "";
        if (pin.y < 33) pos += "top "; else if (pin.y > 66) pos += "bottom "; else pos += "center ";
        if (pin.x < 33) pos += "left"; else if (pin.x > 66) pos += "right"; else pos += "middle";
        return `leave space for ${pin.name} at ${pos.trim()}`;
      }).join(", ");

      const prompt = `Top-down isometric 2D game map texture, no buildings, terrain and paved asphalt roads only. Structure layout: ${layoutDesc}. Vibrant colors, highly detailed strategy map background style, clean, no text.`;

      let base = imageConfig.baseUrl.trim();
      if (base.endsWith('/')) base = base.slice(0, -1);
      if (base.endsWith('/v1')) base = base.slice(0, -3);

      const response = await fetch(`${base}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${imageConfig.apiKey.trim()}` },
        body: JSON.stringify({ model: imageConfig.model || 'dall-e-3', prompt: prompt, n: 1, size: "1024x1024" })
      });

      if (!response.ok) throw new Error(`接口拒绝 (${response.status})`);
      const data = await response.json();
      
      if (data && data.data && data.data.length > 0) {
        const imgData = data.data[0];
        currentMapConfig.mapImageUrl = imgData.url || ('data:image/jpeg;base64,' + imgData.b64_json);
        currentMapConfig.bgMaterial = 'custom'; 
        await updateCurrentMapData();
        alert("✨ AI 环境底图渲染成功！已有建筑和路线完美保留。");
      } else {
        throw new Error("API返回数据为空");
      }
    } catch (err) {
      alert("渲染地形失败: " + err.message);
    } finally {
      currentMapConfig.isGeneratingMap = false;
      currentMapConfig.showMapAddModal = false;
    }
  };

  const finishMapGeneration = () => {
    currentMapConfig.isGenerated = true;
    currentMapConfig.isGeneratingMap = false;
    currentMapConfig.showMapAddModal = false; 
    if(!currentMapConfig.mapName) currentMapConfig.mapName = currentMapConfig.cityName;

    if (currentMapConfig.pins.length === 0) {
      currentMapConfig.pins = [
        { id: Date.now() + 1, x: 25, y: 35, name: '市中心公园', color: 'bg-emerald-500', image: presetBuildings[4] },
        { id: Date.now() + 2, x: 65, y: 25, name: '星巴克咖啡', color: 'bg-amber-500', image: presetBuildings[1] },
        { id: Date.now() + 3, x: 75, y: 55, name: '温馨的家', color: 'bg-blue-500', image: presetBuildings[0] }
      ];
    }
    updateCurrentMapData();
  };

  const addNewPin = () => {
    const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
    currentMapConfig.pins.push({
      id: Date.now(),
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      name: '新建地标',
      color: colors[Math.floor(Math.random() * colors.length)],
      image: presetBuildings[Math.floor(Math.random() * presetBuildings.length)]
    });
    updateCurrentMapData();
  };

  let pressTimer = null;
  let isDragging = false;
  let draggingPin = null;

  const toggleLinkMode = () => {
    currentMapConfig.isLinkingMode = !currentMapConfig.isLinkingMode;
    currentMapConfig.linkStartPinId = null;
  };

  const handlePinClick = (pin) => {
    if (currentMapConfig.isLinkingMode) {
      if (!currentMapConfig.linkStartPinId) {
        currentMapConfig.linkStartPinId = pin.id;
      } else {
        if (currentMapConfig.linkStartPinId !== pin.id) {
          const exists = currentMapConfig.paths.find(p => 
            (p.fromId === currentMapConfig.linkStartPinId && p.toId === pin.id) ||
            (p.toId === currentMapConfig.linkStartPinId && p.fromId === pin.id)
          );
          if (!exists) {
            currentMapConfig.paths.push({
              id: 'path_' + Date.now(),
              fromId: currentMapConfig.linkStartPinId,
              toId: pin.id,
              distance: '标注距离'
            });
            updateCurrentMapData();
          }
        }
        currentMapConfig.linkStartPinId = null;
      }
      return;
    }
    openEditPin(pin);
  };

  const startPinInteraction = (e, pin) => {
    if (currentMapConfig.isLinkingMode) return;
    isDragging = false;
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      isDragging = true;
      draggingPin = pin;
      currentMapConfig.draggingPinId = pin.id; 
      if (navigator.vibrate) navigator.vibrate(50); 
    }, 500); 
  };

  const moveDragPin = (e) => {
    if (!isDragging || !draggingPin || currentMapConfig.isLinkingMode) return;
    const container = document.getElementById('interactive-map-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    draggingPin.x = Math.max(0, Math.min(100, x));
    draggingPin.y = Math.max(0, Math.min(100, y));
  };
  
  const endPinInteraction = (e, pin) => {
    if (pressTimer) clearTimeout(pressTimer);
    if (isDragging) {
      updateCurrentMapData();
    } else {
      handlePinClick(pin);
    }
    isDragging = false;
    currentMapConfig.draggingPinId = null;
    draggingPin = null;
  };

  const cancelPinInteraction = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  const openEditPin = (pin) => {
    currentMapConfig.editingPinId = pin.id;
    currentMapConfig.tempPinName = pin.name;
    currentMapConfig.tempPinImage = pin.image || presetBuildings[0];
    currentMapConfig.showPinEditModal = true;
  };
  
  const confirmEditPin = () => {
    const pin = currentMapConfig.pins.find(p => p.id === currentMapConfig.editingPinId);
    if (pin) {
      pin.name = currentMapConfig.tempPinName;
      pin.image = currentMapConfig.tempPinImage;
      updateCurrentMapData();
    }
    currentMapConfig.showPinEditModal = false;
  };

  const deletePin = () => {
    currentMapConfig.pins = currentMapConfig.pins.filter(p => p.id !== currentMapConfig.editingPinId);
    currentMapConfig.paths = currentMapConfig.paths.filter(p => 
      p.fromId !== currentMapConfig.editingPinId && p.toId !== currentMapConfig.editingPinId
    );
    updateCurrentMapData();
    currentMapConfig.showPinEditModal = false;
  };

  const updatePathDistance = (pathId, newDistance) => {
    const p = currentMapConfig.paths.find(p => p.id === pathId);
    if (p) p.distance = newDistance;
    updateCurrentMapData();
  };

  const deletePath = (pathId) => {
    currentMapConfig.paths = currentMapConfig.paths.filter(p => p.id !== pathId);
    updateCurrentMapData();
  };

  const deleteMap = async (id) => {
    if(confirm("确定要删除这张地图吗？")) {
      mapList.value = mapList.value.filter(m => m.id !== id);
      saveMapListSafely();
      await deleteMapImageFromDB(id); 
    }
  };

  // 三大高级视觉材质引擎（微缩立体、复古羊皮纸、赛博朋克深空流光）
  const getMapBackgroundClass = (theme, mode, material) => {
    if (mode === 'image' || material === 'custom') return ''; 
    
    // 方案一：复古羊皮纸手帐风 (带有温润细腻的纸张颗粒与复古边界暗角)
    if (material === 'parchment') return 'bg-[#f4ebd0] bg-[radial-gradient(#e2d5af_1px,transparent_1px)] bg-[size:20px_20px] shadow-[inset_0_0_50px_rgba(168,139,94,0.35)] border-amber-800/30';
    
    // 方案二：微缩立体拼贴风 (高级马卡龙森林绿底盘，带有柔和的光晕质感)
    if (material === 'grass') return 'bg-[#e2f0d9] bg-[radial-gradient(#c5e1a5_3px,transparent_3px),radial-gradient(#a3c77d_2px,transparent_2px)] bg-[size:36px_36px,18px_18px] shadow-[inset_0_0_40px_rgba(82,143,62,0.2)] border-emerald-400';
    
    // 方案三：高级暗夜战术沙盘风 (深邃紫蓝渐变 + 充满科技感的霓虹微光流星网格)
    if (material === 'cyberpunk') return 'bg-[#0b0f19] bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:32px_32px] shadow-[inset_0_0_80px_rgba(168,85,247,0.25)] border-indigo-500/50';
    
    // 默认精致底版
    return theme === 'warm' 
      ? 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] bg-[#f8fafc] border-stone-300 shadow-inner' 
      : 'bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] bg-slate-900 border-slate-800 shadow-inner';
  };

  return {
    mapList,
    filteredMapList,
    activeMapFilterId,
    presetBuildings,
    currentMapConfig,
    createNewMap,
    openMap,
    updateCurrentMapData,
    generateMap,
    generateBackgroundFromLayout,
    addNewPin,
    startPinInteraction,
    moveDragPin,
    endPinInteraction,
    cancelPinInteraction,
    openEditPin,
    confirmEditPin,
    deletePin,
    deleteMap,
    toggleLinkMode,
    updatePathDistance,
    deletePath,
    handleMapBgUpload,
    getMapBackgroundClass
  };
}