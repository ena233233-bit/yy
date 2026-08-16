const DATA_BASE = "https://raw.githubusercontent.com/Sekai-World/sekai-master-db-en-diff/main";
const STORAGE_KEY = "pjsk-en-builder-v2";

const UNIT_NAMES = {
  light_sound: "Leo/need",
  idol: "MORE MORE JUMP!",
  street: "Vivid BAD SQUAD",
  theme_park: "Wonderlands×Showtime",
  school_refusal: "Nightcord at 25:00",
  piapro: "VIRTUAL SINGER",
  none: "VIRTUAL SINGER"
};

const ATTR_NAMES = {
  cool: "Cool",
  cute: "Cute",
  happy: "Happy",
  mysterious: "Mysterious",
  pure: "Pure"
};

const FALLBACK_UNITS = [
  [1, 1, "Hoshino Ichika", "Leo/need"], [2, 2, "Tenma Saki", "Leo/need"],
  [3, 3, "Mochizuki Honami", "Leo/need"], [4, 4, "Hinomori Shiho", "Leo/need"],
  [5, 5, "Hanasato Minori", "MORE MORE JUMP!"], [6, 6, "Kiritani Haruka", "MORE MORE JUMP!"],
  [7, 7, "Momoi Airi", "MORE MORE JUMP!"], [8, 8, "Hinomori Shizuku", "MORE MORE JUMP!"],
  [9, 9, "Azusawa Kohane", "Vivid BAD SQUAD"], [10, 10, "Shiraishi An", "Vivid BAD SQUAD"],
  [11, 11, "Shinonome Akito", "Vivid BAD SQUAD"], [12, 12, "Aoyagi Toya", "Vivid BAD SQUAD"],
  [13, 13, "Tenma Tsukasa", "Wonderlands×Showtime"], [14, 14, "Otori Emu", "Wonderlands×Showtime"],
  [15, 15, "Kusanagi Nene", "Wonderlands×Showtime"], [16, 16, "Kamishiro Rui", "Wonderlands×Showtime"],
  [17, 17, "Yoisaki Kanade", "Nightcord at 25:00"], [18, 18, "Asahina Mafuyu", "Nightcord at 25:00"],
  [19, 19, "Shinonome Ena", "Nightcord at 25:00"], [20, 20, "Akiyama Mizuki", "Nightcord at 25:00"]
].map(([id, gameCharacterId, characterName, unitName]) => ({ id, gameCharacterId, characterName, unitName }));

const state = {
  cards: [],
  account: {
    decoration: 0,
    characterRank: 0,
    title: 0,
    furniture: 0,
    gate: 0
  },
  selectedEvent: "manual",
  strategy: "balanced",
  data: {
    events: [],
    bonuses: [],
    units: FALLBACK_UNITS,
    loaded: false
  },
  recommendation: []
};

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[ch]);
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nullableNum(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeTs(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < 1e12 ? n * 1000 : n;
}

function eventStart(event) {
  return normalizeTs(event.startAt ?? event.start_at ?? event.startDatetime ?? event.startDate);
}

function eventEnd(event) {
  return normalizeTs(event.aggregateAt ?? event.endAt ?? event.closedAt ?? event.end_at ?? event.endDatetime);
}

function formatDate(ts) {
  if (!ts) return "?";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function unitLabel(unit) {
  return `${unit.characterName} · ${unit.unitName}`;
}

function getUnit(unitId) {
  return state.data.units.find(unit => Number(unit.id) === Number(unitId));
}

function eventById(id) {
  return state.data.events.find(event => Number(event.id) === Number(id));
}

function selectedEventRules() {
  if (state.selectedEvent === "manual") return [];
  const id = Number(state.selectedEvent);
  return state.data.bonuses.filter(rule => Number(rule.eventId) === id);
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cards: state.cards,
    account: state.account,
    selectedEvent: state.selectedEvent,
    strategy: state.strategy
  }));
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.cards)) state.cards = saved.cards;
    if (saved.account && typeof saved.account === "object") {
      state.account = { ...state.account, ...saved.account };
    }
    if (saved.selectedEvent != null) state.selectedEvent = String(saved.selectedEvent);
    if (["bonus", "talent", "balanced"].includes(saved.strategy)) state.strategy = saved.strategy;
  } catch (error) {
    console.warn("Could not load saved data", error);
  }
}

function setDataStatus(text, kind = "") {
  const el = $("dataStatus");
  el.textContent = text;
  el.className = `status-pill ${kind}`.trim();
}

async function fetchJSON(filename, force = false) {
  const suffix = force ? `?refresh=${Date.now()}` : "";
  const response = await fetch(`${DATA_BASE}/${filename}${suffix}`, {
    cache: force ? "no-store" : "default"
  });
  if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  return response.json();
}

function buildUnits(gameCharacters, gameCharacterUnits) {
  const characterMap = new Map(gameCharacters.map(character => [Number(character.id), character]));
  return gameCharacterUnits.map(unit => {
    const character = characterMap.get(Number(unit.gameCharacterId)) || {};
    const first = character.firstName || character.firstNameEnglish || "";
    const given = character.givenName || character.givenNameEnglish || `Character ${unit.gameCharacterId}`;
    const characterName = `${first} ${given}`.trim();
    const rawUnit = unit.unit || character.unit || "none";
    return {
      id: Number(unit.id),
      gameCharacterId: Number(unit.gameCharacterId),
      characterName,
      unitName: UNIT_NAMES[rawUnit] || rawUnit,
      rawUnit
    };
  }).sort((a, b) => a.gameCharacterId - b.gameCharacterId || a.id - b.id);
}

async function loadRemoteData(force = false) {
  setDataStatus("正在读取 EN 活动数据…");
  $("refreshData").disabled = true;
  try {
    const [events, bonuses, gameCharacters, gameCharacterUnits] = await Promise.all([
      fetchJSON("events.json", force),
      fetchJSON("eventDeckBonuses.json", force),
      fetchJSON("gameCharacters.json", force),
      fetchJSON("gameCharacterUnits.json", force)
    ]);

    state.data.events = Array.isArray(events) ? events : [];
    state.data.bonuses = Array.isArray(bonuses) ? bonuses : [];
    state.data.units = buildUnits(
      Array.isArray(gameCharacters) ? gameCharacters : [],
      Array.isArray(gameCharacterUnits) ? gameCharacterUnits : []
    );
    state.data.loaded = true;

    populateCharacterSelect();
    populateEventSelect();
    setDataStatus(`EN 数据已加载 · ${state.data.events.length} 个活动`, "ok");
    renderEventInfo();
    renderLibrary();
    recommend();
  } catch (error) {
    console.error(error);
    state.data.loaded = false;
    state.data.units = FALLBACK_UNITS;
    populateCharacterSelect();
    populateEventSelect();
    setDataStatus("EN 数据读取失败 · 可继续手动模式", "bad");
    $("eventError").textContent = "远程活动数据暂时没有读到。你仍可录入卡片，并用“手动加成覆盖”计算。";
  } finally {
    $("refreshData").disabled = false;
  }
}

function populateCharacterSelect() {
  const select = $("cardUnit");
  const old = select.value;
  const grouped = new Map();

  for (const unit of state.data.units) {
    const key = unit.unitName || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(unit);
  }

  select.innerHTML = '<option value="">选择角色 / 所属</option>';
  for (const [groupName, units] of grouped) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;
    for (const unit of units) {
      const option = document.createElement("option");
      option.value = String(unit.id);
      option.textContent = unitLabel(unit);
      optgroup.appendChild(option);
    }
    select.appendChild(optgroup);
  }
  if ([...select.options].some(option => option.value === old)) select.value = old;
}

function eventName(event) {
  return event.name || event.eventName || event.assetbundleName || `Event ${event.id}`;
}

function populateEventSelect() {
  const select = $("eventSelect");
  select.innerHTML = '<option value="manual">手动模式（单张卡自己填加成）</option>';

  if (!state.data.events.length) {
    state.selectedEvent = "manual";
    select.value = "manual";
    return;
  }

  const now = Date.now();
  const sorted = [...state.data.events]
    .filter(event => event && event.id != null)
    .sort((a, b) => eventStart(b) - eventStart(a));

  const recent = sorted.filter(event => {
    const start = eventStart(event);
    return !start || start <= now + 1000 * 60 * 60 * 24 * 60;
  }).slice(0, 90);

  for (const event of recent) {
    const option = document.createElement("option");
    option.value = String(event.id);
    const start = eventStart(event);
    const end = eventEnd(event);
    const active = start && start <= now && (!end || now <= end);
    option.textContent = `${active ? "● " : ""}${eventName(event)}${start ? ` · ${formatDate(start)}` : ""}`;
    select.appendChild(option);
  }

  const savedExists = [...select.options].some(option => option.value === String(state.selectedEvent));
  if (!savedExists) {
    const current = recent.find(event => {
      const start = eventStart(event);
      const end = eventEnd(event);
      return start && start <= now && (!end || now <= end);
    });
    const latestStarted = recent.find(event => !eventStart(event) || eventStart(event) <= now);
    state.selectedEvent = String((current || latestStarted || {}).id || "manual");
  }
  select.value = state.selectedEvent;
}

function renderEventInfo() {
  const box = $("eventInfo");
  $("specialNotice").classList.add("hidden");
  $("eventError").textContent = "";

  if (state.selectedEvent === "manual") {
    box.innerHTML = `
      <strong>手动模式</strong>
      <div class="small">不会猜活动规则。每张卡的“手动加成覆盖 %”是多少，就按多少算；没填就是 0%。</div>
    `;
    return;
  }

  const event = eventById(state.selectedEvent);
  const rules = selectedEventRules();
  if (!event) {
    box.innerHTML = '<strong>活动资料未找到</strong>';
    return;
  }

  const attrs = [...new Set(rules.map(rule => rule.cardAttr).filter(Boolean))];
  const unitIds = [...new Set(rules.map(rule => rule.gameCharacterUnitId).filter(value => value != null).map(Number))];
  const rates = [...new Set(rules.map(rule => num(rule.bonusRate)).filter(rate => rate > 0))].sort((a,b) => b-a);
  const targetNames = unitIds.map(id => getUnit(id)).filter(Boolean).map(unit => unit.characterName);
  const uniqueNames = [...new Set(targetNames)];
  const type = event.eventType || event.type || "unknown";
  const start = eventStart(event);
  const end = eventEnd(event);

  const tags = [
    ...attrs.map(attr => `属性 ${ATTR_NAMES[attr] || attr}`),
    ...rates.map(rate => `${rate}% rule`),
    uniqueNames.length ? `${uniqueNames.length} 个指定角色/组合` : "无角色条件"
  ];

  box.innerHTML = `
    <strong>${escapeHTML(eventName(event))}</strong>
    <div class="small">类型：${escapeHTML(type)}${start ? ` · ${escapeHTML(formatDate(start))}` : ""}${end ? ` → ${escapeHTML(formatDate(end))}` : ""}</div>
    <div class="rule-tags">${tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>
    ${uniqueNames.length ? `<div class="small" style="margin-top:8px">指定：${escapeHTML(uniqueNames.slice(0, 10).join("、"))}${uniqueNames.length > 10 ? "…" : ""}</div>` : ""}
  `;

  if (/world|bloom/i.test(String(type))) {
    $("specialNotice").classList.remove("hidden");
  }
}

function syncAccountInputs() {
  $("decorationBonus").value = state.account.decoration || "";
  $("characterRankBonus").value = state.account.characterRank || "";
  $("titleBonus").value = state.account.title || "";
  $("furnitureBonus").value = state.account.furniture || "";
  $("gateBonus").value = state.account.gate || "";
  renderAccountTotal();
}

function accountBonusTotal() {
  return Object.values(state.account).reduce((sum, value) => sum + num(value), 0);
}

function renderAccountTotal() {
  $("accountBonusTotal").textContent = accountBonusTotal().toLocaleString();
}

function readAccountInputs() {
  state.account.decoration = num($("decorationBonus").value);
  state.account.characterRank = num($("characterRankBonus").value);
  state.account.title = num($("titleBonus").value);
  state.account.furniture = num($("furnitureBonus").value);
  state.account.gate = num($("gateBonus").value);
  renderAccountTotal();
  saveLocal();
  renderRecommendation();
}

function addCard(event) {
  event.preventDefault();
  $("cardError").textContent = "";

  const unitId = Number($("cardUnit").value);
  const unit = getUnit(unitId);
  const attr = $("cardAttr").value;
  const talent = num($("cardTalent").value, NaN);

  if (!unit) {
    $("cardError").textContent = "先选角色 / 所属。";
    return;
  }
  if (!attr) {
    $("cardError").textContent = "先选属性。";
    return;
  }
  if (!Number.isFinite(talent) || talent <= 0) {
    $("cardError").textContent = "Talent 要填一个大于 0 的数字。";
    return;
  }

  const rarity = $("cardRarity").value;
  const customName = $("cardName").value.trim();
  const card = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: customName,
    unitId: unit.id,
    gameCharacterId: unit.gameCharacterId,
    characterName: unit.characterName,
    unitName: unit.unitName,
    attr,
    talent,
    rarity,
    masterRank: num($("cardMasterRank").value),
    skillLevel: num($("cardSkillLevel").value, 1),
    bonusOverride: nullableNum($("cardBonusOverride").value)
  };

  state.cards.push(card);
  saveLocal();
  renderLibrary();
  recommend();

  $("cardName").value = "";
  $("cardTalent").value = "";
  $("cardBonusOverride").value = "";
}

function cardTitle(card) {
  return card.name || `${card.characterName}${card.rarity ? ` · ${card.rarity}` : ""}`;
}

function renderLibrary() {
  const list = $("libraryList");
  $("cardCount").textContent = `${state.cards.length} 张`;

  if (!state.cards.length) {
    list.innerHTML = '<div class="library-empty">卡库还是空的。先把你常用的卡录几张进去 😈</div>';
    return;
  }

  list.innerHTML = state.cards.map(card => {
    const unit = getUnit(card.unitId);
    const currentUnitLabel = unit ? unitLabel(unit) : `${card.characterName || "Unknown"} · ${card.unitName || "?"}`;
    const override = card.bonusOverride == null ? "自动" : `${card.bonusOverride}% 覆盖`;
    return `
      <div class="library-card">
        <div>
          <div class="library-card-title">${escapeHTML(cardTitle(card))}</div>
          <div class="library-meta">
            ${escapeHTML(currentUnitLabel)} · ${escapeHTML(ATTR_NAMES[card.attr] || card.attr)} · Talent ${num(card.talent).toLocaleString()}<br>
            MR ${num(card.masterRank)} · Skill Lv.${num(card.skillLevel,1)} · 活动加成：${escapeHTML(override)}
          </div>
        </div>
        <button class="btn btn-danger btn-small delete-card" data-id="${escapeHTML(card.id)}" type="button">删除</button>
      </div>`;
  }).join("");
}

function eventBonusForCard(card) {
  if (card.bonusOverride != null) return Math.max(0, num(card.bonusOverride));
  if (state.selectedEvent === "manual") return 0;

  const rules = selectedEventRules();
  let best = 0;
  for (const rule of rules) {
    if (rule.gameCharacterUnitId != null && Number(rule.gameCharacterUnitId) !== Number(card.unitId)) continue;
    if (rule.cardAttr && String(rule.cardAttr) !== String(card.attr)) continue;
    best = Math.max(best, num(rule.bonusRate));
  }
  return best;
}

function compareDecorated(a, b) {
  if (state.strategy === "bonus") {
    return b.bonus - a.bonus || b.card.talent - a.card.talent;
  }
  if (state.strategy === "talent") {
    return b.card.talent - a.card.talent || b.bonus - a.bonus;
  }
  return b.score - a.score || b.bonus - a.bonus || b.card.talent - a.card.talent;
}

function recommend() {
  state.strategy = $("strategySelect")?.value || state.strategy;
  saveLocal();

  const decorated = state.cards.map(card => {
    const bonus = eventBonusForCard(card);
    return {
      card,
      bonus,
      score: num(card.talent) * (1 + bonus / 100)
    };
  }).sort(compareDecorated);

  const bestPerCharacter = new Map();
  for (const item of decorated) {
    const key = Number(item.card.gameCharacterId);
    if (!bestPerCharacter.has(key)) bestPerCharacter.set(key, item);
  }

  state.recommendation = [...bestPerCharacter.values()].sort(compareDecorated).slice(0, 5);
  renderRecommendation();
}

function renderRecommendation() {
  const results = $("results");
  const warning = $("recommendWarning");
  warning.textContent = "";

  if (!state.recommendation.length) {
    results.innerHTML = '<div class="library-empty">录入卡片后点“自动推荐”。</div>';
    $("sumTalent").textContent = "0";
    $("sumTotal").textContent = accountBonusTotal().toLocaleString();
    $("sumBonus").textContent = "0%";
    return;
  }

  results.innerHTML = state.recommendation.map((item, index) => `
    <div class="result-card">
      <div class="result-top">
        <div class="result-title">${index + 1}. ${escapeHTML(cardTitle(item.card))}</div>
        <div class="result-bonus">+${Number(item.bonus.toFixed(1))}%</div>
      </div>
      <div class="result-meta">
        ${escapeHTML(item.card.characterName)} · ${escapeHTML(ATTR_NAMES[item.card.attr] || item.card.attr)} · Talent ${num(item.card.talent).toLocaleString()}
        ${item.card.bonusOverride != null ? " · 手动覆盖" : " · 自动规则"}
      </div>
    </div>
  `).join("");

  if (state.recommendation.length < 5) {
    warning.textContent = `目前只能组成 ${state.recommendation.length} 人队：卡库里还没有 5 个不同角色。`;
  }

  const talent = state.recommendation.reduce((sum, item) => sum + num(item.card.talent), 0);
  const bonus = state.recommendation.reduce((sum, item) => sum + num(item.bonus), 0);
  const total = talent + accountBonusTotal();
  $("sumTalent").textContent = talent.toLocaleString();
  $("sumTotal").textContent = total.toLocaleString();
  $("sumBonus").textContent = `${Number(bonus.toFixed(1))}%`;
}

function exportData() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    cards: state.cards,
    account: state.account,
    selectedEvent: state.selectedEvent,
    strategy: state.strategy
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pjsk-en-team-builder-data.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.cards)) throw new Error("No cards array");
    state.cards = data.cards;
    state.account = { ...state.account, ...(data.account || {}) };
    state.selectedEvent = String(data.selectedEvent ?? state.selectedEvent);
    state.strategy = ["bonus","talent","balanced"].includes(data.strategy) ? data.strategy : state.strategy;
    saveLocal();
    syncAccountInputs();
    $("strategySelect").value = state.strategy;
    populateEventSelect();
    renderEventInfo();
    renderLibrary();
    recommend();
    $("importStatus").textContent = "导入成功。";
  } catch (error) {
    console.error(error);
    $("importStatus").textContent = "导入失败：这不是这个配队器导出的 JSON。";
  }
}

function clearAll() {
  const ok = window.confirm("真的清空本机保存的卡库和账号加成吗？");
  if (!ok) return;
  state.cards = [];
  state.account = { decoration: 0, characterRank: 0, title: 0, furniture: 0, gate: 0 };
  state.recommendation = [];
  saveLocal();
  syncAccountInputs();
  renderLibrary();
  recommend();
}

function wireEvents() {
  $("eventSelect").addEventListener("change", event => {
    state.selectedEvent = event.target.value;
    saveLocal();
    renderEventInfo();
    recommend();
  });

  $("refreshData").addEventListener("click", () => loadRemoteData(true));
  $("cardForm").addEventListener("submit", addCard);

  $("libraryList").addEventListener("click", event => {
    const button = event.target.closest(".delete-card");
    if (!button) return;
    state.cards = state.cards.filter(card => String(card.id) !== String(button.dataset.id));
    saveLocal();
    renderLibrary();
    recommend();
  });

  for (const id of ["decorationBonus", "characterRankBonus", "titleBonus", "furnitureBonus", "gateBonus"]) {
    $(id).addEventListener("input", readAccountInputs);
  }

  $("strategySelect").addEventListener("change", recommend);
  $("recommendButton").addEventListener("click", recommend);
  $("exportButton").addEventListener("click", exportData);
  $("importButton").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", event => importData(event.target.files?.[0]));
  $("clearButton").addEventListener("click", clearAll);
}

function init() {
  loadLocal();
  wireEvents();
  syncAccountInputs();
  $("strategySelect").value = state.strategy;
  populateCharacterSelect();
  populateEventSelect();
  renderEventInfo();
  renderLibrary();
  renderRecommendation();
  loadRemoteData(false);
}

document.addEventListener("DOMContentLoaded", init);
