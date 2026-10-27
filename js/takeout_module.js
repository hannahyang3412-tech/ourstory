// js/takeout_module.js - Takeout 模块（生产级终极形态：防抖、IndexedDB、自愈JSON、真图引擎）
function useTakeoutModule() {
  const { ref, computed, onMounted } = Vue;

  // ================= 核心工具 1：防抖函数 (省钱、防卡顿) =================
  const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // ================= 核心工具 2：JSON 容错自愈解析 (防崩溃) =================
  const safeParseJSON = (rawStr, fallbackStr = '[]') => {
    try {
      // 1. 清除 markdown 代码块包裹
      let cleaned = (rawStr || '').replace(/```json/g, '').replace(/```/g, '').trim();
      // 2. 尝试修复末尾多余逗号的致命错误 (例如：[{"a":1},] -> [{"a":1}])
      cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn("大模型 JSON 格式异常，已启动自愈兜底:", e);
      try { return JSON.parse(fallbackStr); } catch (err) { return []; }
    }
  };

  // ================= 核心黑科技 1：真实互联网图片引擎 =================
  const getRealImageURL = (keyword) => {
    const searchKeyword = keyword + " 包装 实物 高清";
    return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(searchKeyword)}&w=400&h=400&c=7&rs=1&p=0`;
  };

  // ================= 核心黑科技 2：无限容量 IndexedDB 缓存引擎 =================
  const shopSearchCache = ref({});
  const shopMenuCache = ref({});

  // 模块挂载时，异步从 IndexedDB 读取海量缓存
  onMounted(async () => {
    if (typeof dbGetItem === 'function') {
      shopSearchCache.value = await dbGetItem('se_takeout_search_cache', {}) || {};
      shopMenuCache.value = await dbGetItem('se_takeout_menu_cache', {}) || {};
    }
  });

  const saveSearchCache = async () => {
    if (typeof dbSetItem === 'function') {
      await dbSetItem('se_takeout_search_cache', JSON.parse(JSON.stringify(shopSearchCache.value)));
    }
  };

  const saveMenuCache = async () => {
    if (typeof dbSetItem === 'function') {
      await dbSetItem('se_takeout_menu_cache', JSON.parse(JSON.stringify(shopMenuCache.value)));
    }
  };

  // 1. 今日主厨推荐
  const chefRecommendations = ref([
    { id: 'c1', title: '黑松露意面馆', subtitle: '手工意面 · 现烤面包', tag: '今日主厨推荐', image: getRealImageURL('黑松露意面 餐厅') },
    { id: 'c2', title: '暮色私厨手作烘焙', subtitle: '法式可颂 · 醇香拿铁', tag: '人气热销', image: getRealImageURL('法式可颂 烘焙店') },
    { id: 'c3', title: '深夜治愈暖心粥铺', subtitle: '慢火熬制 · 养胃首选', tag: '深夜食堂', image: getRealImageURL('砂锅海鲜粥 外卖') }
  ]);

  const isRefreshingChef = ref(false);

  const refreshChefRecommendations = async (settings) => {
    const key = cleanApiKey(settings?.apiKey);
    if (!key) { alert('请先配置 API Key！'); return; }
    isRefreshingChef.value = true;
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `随机生成3家高品质的外卖店铺推荐。包含：title(店名), subtitle(简介12字内), tag(标签如:人气热销/主厨精选)。严格返回JSON数组：[{"title":"...","subtitle":"...","tag":"..."}]`
          }],
          temperature: 0.9
        })
      });
      const data = await resp.json();
      
      // 使用容错 JSON 解析
      const parsed = safeParseJSON(data.choices?.[0]?.message?.content, '[]');
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        chefRecommendations.value = parsed.map((item, idx) => ({
          ...item,
          id: 'ref_' + idx,
          image: getRealImageURL(item.title + ' 餐厅 招牌菜')
        }));
      }
    } catch (e) {
      alert('刷新失败：' + e.message);
    } finally {
      isRefreshingChef.value = false;
    }
  };

  // 2. 分类体系
  const categories = ref([
    { id: 'all', name: '全部' },
    { id: 'western', name: '西餐' },
    { id: 'light', name: '轻食' },
    { id: 'milktea', name: '奶茶' },
    { id: 'coffee', name: '咖啡' },
    { id: 'cake', name: '蛋糕' },
    { id: 'medicine', name: '买药' },
    { id: 'flower', name: '鲜花' },
    { id: 'chinese', name: '中餐' }
  ]);
  const activeCategory = ref('all');
  const searchQuery = ref('');

  // 3. 基础本地商品库
  const foodList = ref([
    { id: 1, name: '黑松露野菌奶油意面', desc: '浓郁黑松露酱与帕玛森芝士', price: 48, image: getRealImageURL('黑松露野菌奶油意面'), category: 'western', tag: '西餐' },
    { id: 2, name: '牛油果低卡大虾轻食沙拉', desc: '高蛋白低脂肪，健康无负担', price: 36, image: getRealImageURL('牛油果大虾轻食沙拉'), category: 'light', tag: '轻食' },
    { id: 3, name: '霸王茶姬 伯牙绝弦', desc: '原叶鲜奶茶，经典必喝', price: 22, image: getRealImageURL('霸王茶姬 伯牙绝弦'), category: 'milktea', tag: '奶茶' },
    { id: 4, name: '瑞幸 生椰拿铁', desc: '经典爆款，YYDS', price: 18, image: getRealImageURL('瑞幸 生椰拿铁 咖啡'), category: 'coffee', tag: '咖啡' },
    { id: 5, name: '好利来 半熟芝士', desc: '绵密入口即化', price: 38, image: getRealImageURL('好利来 半熟芝士'), category: 'cake', tag: '蛋糕' },
    { id: 6, name: '999感冒灵颗粒', desc: '缓解发烧头痛，常备良药', price: 18, image: getRealImageURL('999感冒灵颗粒 包装盒'), category: 'medicine', tag: '买药' },
    { id: 7, name: '达喜 铝碳酸镁咀嚼片', desc: '快速缓解胃痛胃酸', price: 32, image: getRealImageURL('达喜 铝碳酸镁咀嚼片 包装'), category: 'medicine', tag: '买药' },
    { id: 8, name: '海底捞 脆肚自热火锅', desc: '随时随地，想吃就吃', price: 39, image: getRealImageURL('海底捞 脆肚自热火锅'), category: 'chinese', tag: '中餐' }
  ]);

  // 4. 联网店铺搜索（接入防抖与 IndexedDB）
  const isSearchingShops = ref(false);
  const searchShopsResult = ref([]);
  
  // 核心执行函数
  const doSearchShops = async (keyword, settings) => {
    const kw = keyword?.trim();
    if (!kw) { searchShopsResult.value = []; return; }
    
    // 从无上限的 IndexedDB 缓存中秒读数据
    if (shopSearchCache.value[kw]) {
      searchShopsResult.value = shopSearchCache.value[kw];
      return;
    }

    const key = cleanApiKey(settings?.apiKey);
    if (!key) { searchShopsResult.value = []; return; }

    isSearchingShops.value = true;
    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `用户在搜索商品："${kw}"。请生成 4 家真实风格的外卖店铺列表。包含：name(店名)、category(品类)、rating(如4.8)、stars("⭐⭐⭐⭐⭐")、monthlySales("月售 2500+")、deliveryTime("25分钟")、priceDescription("人均 ¥40")、signatureDish("招牌菜")。返回JSON数组：[{"name":"...","category":"...","rating":4.8,"stars":"⭐⭐⭐⭐⭐","monthlySales":"月售 2000+","deliveryTime":"25分钟","priceDescription":"人均 ¥40","signatureDish":"..."}]`
          }],
          temperature: 0.7
        })
      });
      const data = await resp.json();
      
      // 使用容错 JSON 解析
      const parsed = safeParseJSON(data.choices?.[0]?.message?.content, '[]');
      
      searchShopsResult.value = parsed;
      shopSearchCache.value[kw] = parsed;
      await saveSearchCache(); // 异步存入 IndexedDB
    } catch (e) {
      searchShopsResult.value = [];
    } finally {
      isSearchingShops.value = false;
    }
  };

  // ★ 暴露给外部的搜索方法（包装了 600ms 的防抖拦截）
  const searchShopsByApi = debounce(doSearchShops, 600);

  // 5. 点击店铺生成菜单（接入 IndexedDB 与真实配图）
  const selectedShop = ref(null);
  const isloadingShopMenu = ref(false);
  const shopMenuItems = ref([]);

  const openShopMenu = async (shop, settings) => {
    selectedShop.value = shop;
    isloadingShopMenu.value = true;
    shopMenuItems.value = [];

    // 从 IndexedDB 中读取店铺缓存
    if (shopMenuCache.value[shop.name]) {
      shopMenuItems.value = shopMenuCache.value[shop.name];
      isloadingShopMenu.value = false;
      return;
    }

    const key = cleanApiKey(settings?.apiKey);
    if (!key) { isloadingShopMenu.value = false; return; }

    try {
      const base = normalizeBaseUrl(settings.baseUrl);
      const resp = await workerFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{
            role: 'user',
            content: `你现在是外卖店铺【${shop.name}】（主营：${shop.category}，招牌是${shop.signatureDish}）。请为这家店生成 5 个该品牌真实售卖的商品（如果是品牌店，请用真实名称，如瑞幸的生椰拿铁、连花清瘟胶囊等）。
包含：name (商品名), desc (描述), price (价格数字)。返回JSON数组：[{"name":"...","desc":"...","price":38}]`
          }],
          temperature: 0.75
        })
      });
      const data = await resp.json();
      
      // 容错解析
      const parsed = safeParseJSON(data.choices?.[0]?.message?.content, '[]');
      
      const newMenu = parsed.map((item, idx) => ({
        ...item,
        id: 'shop_item_' + Date.now() + '_' + idx,
        image: getRealImageURL(item.name),
        count: 0
      }));

      shopMenuItems.value = newMenu;
      shopMenuCache.value[shop.name] = newMenu;
      await saveMenuCache(); // 异步存入 IndexedDB
    } catch (e) {
      shopMenuItems.value = [
        { id: 's1', name: shop.signatureDish || '招牌商品', desc: '美味呈现', price: 45, image: getRealImageURL(shop.signatureDish || '美食'), count: 0 }
      ];
    } finally {
      isloadingShopMenu.value = false;
    }
  };

  const closeShopMenu = () => {
    selectedShop.value = null;
    shopMenuItems.value = [];
  };

  // 6. 过滤商品列表
  const filteredFoodList = computed(() => {
    return foodList.value.filter(food => {
      const matchCat = activeCategory.value === 'all' || food.category === activeCategory.value;
      const matchQuery = !searchQuery.value.trim() || food.name.includes(searchQuery.value.trim()) || food.tag.includes(searchQuery.value.trim());
      return matchCat && matchQuery;
    });
  });

  // 7. 购物车计算 (防呆安全解析，剔除 '元'/'¥' 字符，杜绝 NaN)
  const cartTotal = computed(() => {
    const calcList = (list) => {
      return (list || []).reduce((total, item) => {
        // 清洗价格中的非数字字符
        const cleanPrice = parseFloat(String(item.price || 0).replace(/[^0-9.]/g, '')) || 0;
        const count = parseInt(item.count || 0, 10) || 0;
        return total + (cleanPrice * count);
      }, 0);
    };
    const total = calcList(shopMenuItems.value) + calcList(foodList.value);
    return Math.round(total * 100) / 100;
  });

  const cartCount = computed(() => {
    const countItems = (list) => {
      return (list || []).reduce((total, item) => total + (parseInt(item.count || 0, 10) || 0), 0);
    };
    return countItems(shopMenuItems.value) + countItems(foodList.value);
  });

  const addFood = (food) => { food.count++; };
  const removeFood = (food) => { if (food.count > 0) food.count--; };
  // 外卖结算弹窗状态
  const showCheckoutModal = ref(false);
  const checkoutForm = ref({ address: 'TA的家', note: '', isAdvance: false, targetSessionId: '' });

  const openCheckout = () => {
    if (cartCount.value === 0) { alert("购物车是空的，请先选购商品哦！"); return; }
    showCheckoutModal.value = true;
  };

  const clearCart = () => {
    foodList.value.forEach(item => item.count = 0);
    shopMenuItems.value.forEach(item => item.count = 0);
  };

  return {
    showCheckoutModal, checkoutForm, openCheckout, clearCart,
    chefRecommendations, isRefreshingChef, refreshChefRecommendations,
    categories, activeCategory, searchQuery, filteredFoodList,
    searchShopsResult, isSearchingShops, searchShopsByApi,
    selectedShop, isloadingShopMenu, shopMenuItems, openShopMenu, closeShopMenu,
    cartTotal, cartCount, addFood, removeFood
  };
}