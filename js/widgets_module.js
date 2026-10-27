// widgets_module.js - 桌面微缩组件数据与左右滑动逻辑

// 1. 多规格组件库默认配置
const defaultDesktopWidgets = [
  { id: 'weather', name: '天气图标 / 心情晴雨表', spec: '1x1', icon: '☀️', desc: '实时显示当前世界的天气与心情状态', enabled: true },
  { id: 'gacha', name: '今日心动签抽卡', spec: '1x1', icon: '🎴', desc: '每日抽取一张属于你和TA的命运盲盒', enabled: true },
  { id: 'gramophone_mini', name: '心跳留声机 mini 播放条', spec: '2x1', icon: '📻', desc: '随时随地聆听 TA 的专属声线与私语磁带', enabled: true },
  { id: 'status', name: 'TA 此刻的忙碌状态', spec: '2x1', icon: '🩺', desc: '如：在诊室看病历 / 在书房写报告', enabled: true },
  { id: 'polaroid_frame', name: '角色精选立绘相框', spec: '2x2', icon: '🖼️', desc: '大尺寸沉浸式展示你最爱的角色精选立绘', enabled: true },
  // 新增：地图组件
  { id: 'map_widget', name: '时空地图导航', spec: '2x2', icon: '🗺️', desc: '实时定位TA当前所在的世界坐标', enabled: true }
];

function getStoredWidgetsConfig() {
  const data = localStorage.getItem('se_desktop_widgets_config');
  if (data) {
    try { return JSON.parse(data); } catch(e) {}
  }
  return defaultDesktopWidgets;
}

function saveStoredWidgetsConfig(widgets) {
  localStorage.setItem('se_desktop_widgets_config', JSON.stringify(widgets));
}