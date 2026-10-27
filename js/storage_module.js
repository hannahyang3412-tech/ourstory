// 模块：无限容量本地数据库存储与数据备份迁移模块 (Storage Module with IndexedDB & Backup)

const DB_NAME = "StoryEngine_DB";
const DB_VERSION = 1;
const STORE_NAME = "app_data";

// 初始化 IndexedDB 数据库
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn("当前浏览器不支持 IndexedDB，将降级使用 localStorage。");
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = event => reject(event.target.error);
    request.onsuccess = event => resolve(event.target.result);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// 异步存入数据（支持海量数据，无 5MB 限制）
async function dbSetItem(key, value) {
  try {
    const db = await openDatabase();
    if (!db) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve(true);
      request.onerror = event => reject(event.target.error);
    });
  } catch (err) {
    console.error("dbSetItem 异常，尝试降级存入 localStorage:", err);
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// 异步读取数据（若 IndexedDB 为空，则自动向下兼容读取旧的 localStorage 并转存）
async function dbGetItem(key, defaultValue = null) {
  try {
    const db = await openDatabase();
    if (!db) {
      const local = localStorage.getItem(key);
      return local ? JSON.parse(local) : defaultValue;
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = async event => {
        const res = event.target.result;
        if (res !== undefined && res !== null) {
          resolve(res);
        } else {
          // 向下兼容：如果 IndexedDB 里没有，去查 localStorage 看看有没有老数据
          const oldLocal = localStorage.getItem(key);
          if (oldLocal) {
            try {
              const parsed = JSON.parse(oldLocal);
              await dbSetItem(key, parsed); // 自动迁移到数据库
              resolve(parsed);
              return;
            } catch(e) {}
          }
          resolve(defaultValue);
        }
      };
      request.onerror = event => reject(event.target.error);
    });
  } catch (err) {
    console.error("dbGetItem 异常，从 localStorage 读取:", err);
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : defaultValue;
  }
}

// ================= 数据备份导出与恢复导入功能 =================

// 1. 导出全部应用数据为 JSON 文件（手机浏览器会自动触发下载）
async function exportAllAppData() {
  try {
    const keys = [
      'se_sessions', 'se_daily_sessions', 'se_persona_list', 
      'se_user_persona_list', 'se_custom_worldbooks', 'se_api_presets', 
      'se_img_presets', 'se_custom_writing_styles', 'se_theme_style',
      'se_s_url', 'se_s_key', 'se_s_model', 'se_img_config'
    ];
    
    const backupObj = {};
    for (const key of keys) {
      backupObj[key] = await dbGetItem(key, null);
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `StoryEngine_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert('全部数据备份导出成功！请妥善保存该 JSON 文件。');
  } catch (err) {
    alert(`导出备份失败：${err.message}`);
  }
}

// 2. 导入恢复备份数据
async function importAppDataFromFile(event, callback) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (!importedData || typeof importedData !== 'object') {
        alert('备份文件格式错误，无法解析！');
        return;
      }

      if (confirm('导入数据将覆盖当前的全部存档、人设与世界书，确定继续吗？')) {
        for (const [key, val] of Object.entries(importedData)) {
          if (val !== null && val !== undefined) {
            await dbSetItem(key, val);
            localStorage.setItem(key, JSON.stringify(val)); // 同步写回备用
          }
        }
        alert('数据恢复导入成功！页面即将重新加载。');
        if (typeof callback === 'function') {
          callback();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      alert(`导入失败，文件损坏或格式不正确：${err.message}`);
    }
  };
  reader.readAsText(file);
}