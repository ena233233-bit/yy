const SCREENSHOT_PRESET_CARDS = [
  {
    presetKey: "the-arrogant-princess-rin",
    id: "preset-rin-arrogant-princess",
    name: "The Arrogant Princess",
    unitId: 22,
    gameCharacterId: 22,
    characterName: "Kagamine Rin",
    unitName: "VIRTUAL SINGER",
    attr: "mysterious",
    talent: 38794,
    rarity: "4★",
    masterRank: 5,
    skillLevel: 3,
    bonusOverride: null
  },
  {
    presetKey: "unexpected-farewell-gift-akito",
    id: "preset-akito-unexpected-farewell-gift",
    name: "Unexpected Farewell Gift",
    unitId: 11,
    gameCharacterId: 11,
    characterName: "Shinonome Akito",
    unitName: "Vivid BAD SQUAD",
    attr: "cute",
    talent: 38792,
    rarity: "4★",
    masterRank: 5,
    skillLevel: 1,
    bonusOverride: null
  },
  {
    presetKey: "after-school-assistance-toya",
    id: "preset-toya-after-school-assistance",
    name: "After-School Assistance",
    unitId: 12,
    gameCharacterId: 12,
    characterName: "Aoyagi Toya",
    unitName: "Vivid BAD SQUAD",
    attr: "pure",
    talent: 37302,
    rarity: "4★",
    masterRank: 2,
    skillLevel: 1,
    bonusOverride: null
  },
  {
    presetKey: "happy-snacker-airi",
    id: "preset-airi-happy-snacker",
    name: "Happy Snacker!",
    unitId: 7,
    gameCharacterId: 7,
    characterName: "Momoi Airi",
    unitName: "MORE MORE JUMP!",
    attr: "mysterious",
    talent: 37301,
    rarity: "4★",
    masterRank: 2,
    skillLevel: 1,
    bonusOverride: null
  },
  {
    presetKey: "waiting-for-you-akito",
    id: "preset-akito-waiting-for-you",
    name: "Waiting For You",
    unitId: 11,
    gameCharacterId: 11,
    characterName: "Shinonome Akito",
    unitName: "Vivid BAD SQUAD",
    attr: "mysterious",
    talent: 37297,
    rarity: "4★",
    masterRank: 2,
    skillLevel: 2,
    bonusOverride: null
  },
  {
    presetKey: "beyond-that-door-miku",
    id: "preset-miku-beyond-that-door",
    name: "Beyond That Door",
    unitId: 29,
    gameCharacterId: 21,
    characterName: "Hatsune Miku",
    unitName: "Vivid BAD SQUAD",
    attr: "mysterious",
    talent: 36992,
    rarity: "4★",
    masterRank: 2,
    skillLevel: 3,
    bonusOverride: null
  },
  {
    presetKey: "huddle-of-resolve-akito",
    id: "preset-akito-huddle-of-resolve",
    name: "Huddle Of Resolve",
    unitId: 11,
    gameCharacterId: 11,
    characterName: "Shinonome Akito",
    unitName: "Vivid BAD SQUAD",
    attr: "mysterious",
    talent: 36992,
    rarity: "4★",
    masterRank: 2,
    skillLevel: 1,
    bonusOverride: null
  },
  {
    presetKey: "those-wild-cheers-akito",
    id: "preset-akito-those-wild-cheers",
    name: "Those Wild Cheers",
    unitId: 11,
    gameCharacterId: 11,
    characterName: "Shinonome Akito",
    unitName: "Vivid BAD SQUAD",
    attr: "pure",
    talent: 36992,
    rarity: "4★",
    masterRank: 2,
    skillLevel: 1,
    bonusOverride: null
  },
  {
    presetKey: "a-heart-pounding-world-kohane",
    id: "preset-kohane-heart-pounding-world",
    name: "A Heart-Pounding World",
    unitId: 9,
    gameCharacterId: 9,
    characterName: "Azusawa Kohane",
    unitName: "Vivid BAD SQUAD",
    attr: "mysterious",
    talent: 36102,
    rarity: "4★",
    masterRank: 0,
    skillLevel: 1,
    bonusOverride: null
  },
  {
    presetKey: "kaleidoscopic-steps-kohane",
    id: "preset-kohane-kaleidoscopic-steps",
    name: "Kaleidoscopic Steps",
    unitId: 9,
    gameCharacterId: 9,
    characterName: "Azusawa Kohane",
    unitName: "Vivid BAD SQUAD",
    attr: "cool",
    talent: 36992,
    rarity: "4★",
    masterRank: 2,
    skillLevel: 1,
    bonusOverride: null
  }
];

function mergeScreenshotPresetCards() {
  const existingKeys = new Set(
    state.cards.map(card => card.presetKey || `${card.name}|${card.characterName}|${card.talent}|${card.masterRank}`)
  );

  let added = 0;
  for (const card of SCREENSHOT_PRESET_CARDS) {
    const fallbackKey = `${card.name}|${card.characterName}|${card.talent}|${card.masterRank}`;
    if (existingKeys.has(card.presetKey) || existingKeys.has(fallbackKey)) continue;
    state.cards.push({ ...card });
    existingKeys.add(card.presetKey);
    added += 1;
  }

  if (added > 0) {
    saveLocal();
    renderLibrary();
    recommend();
    const status = document.getElementById("importStatus");
    if (status) status.textContent = `已从你发来的截图导入 ${added} 张卡。`;
  }
}

document.addEventListener("DOMContentLoaded", mergeScreenshotPresetCards);
