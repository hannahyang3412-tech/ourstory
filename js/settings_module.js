// 模块 4：同伴人设、面具库与接口管理 (Settings & Persona Module)

// 在 DEFAULT_PERSONAS 中为每个人设添加 voice 默认参数
const DEFAULT_PERSONAS = [
  {
    id: "p_shen",
    name: "沈知韫",
    userNickname: "小朋友",
    appearance: "清冷出尘，黑色微卷长发，深色风衣，冰蓝色眼眸。",
    traits: "从容敏锐、克制护短",
    personaPrompt: "性格清冷自持但极度护短，习惯检查细节。在危险时刻绝不退让，对玩家怀有隐忍而深沉的温和。",
    defaultSeed: 12345,
    refImage: "",
    voice: "onyx" // TTS 音色标识（可自由修改为模型对应的 voice_id 或名称）
  },
  {
    id: "p_li",
    name: "黎深",
    userNickname: "乖宝",
    appearance: "清冷矜贵，金丝眼镜，笔挺深色大衣与衬衫。",
    traits: "表面严谨克制，情绪内敛",
    personaPrompt: "作为心脏外科医师，冷静客观，但唯独对玩家常流露出少见的无可奈何的纵容与细致关照。",
    defaultSeed: 67890,
    refImage: "",
    voice: "echo"
  }
];

const DEFAULT_USER_PERSONAS = [
  { id: "up_default", name: "林言", appearance: "身手敏捷、眼神清澈，常着深色风衣。" }
];

function validatePersonaForm(form) {
  if (!form.name.trim()) { alert('请填写同伴姓名！'); return false; }
  return true;
}

function validateUserPersonaForm(form) {
  if (!form.name.trim()) { alert('请填写面具身份名称！'); return false; }
  return true;
}

function processPersonaImageUpload(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result);
  reader.readAsDataURL(file);
}