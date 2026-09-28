import { calculateSessionRewards, addSwordShardHonor } from "../rules/session-rewards.mjs";

/** Resolve session rewards and rolls without requiring an item sheet. */
export async function resolveSessionResult(item) {
  let roll = null;
  let formula = null;
  let tooltip = null;
  let total = null;
  let isRoll = false;

  const title = item.name;
  const rewards = calculateSessionRewards(item.system.session);
  const { getGamel, keepGamel, getExp, getAbyss, keepAbyss, getTresure, getSword } = rewards;
  let getHonor = rewards.getHonor;

  // basic info.
  const isBasic = item.system.result.character;
  const date = item.system.session.date;
  const gm = item.system.session.gamemaster;
  const player = item.system.session.player;

  // character result.
  let characterNames = item.system.result.character
    ? canvas.tokens.placeables
        .filter((token) => token.actor?.type === "character")
        .map((token) => token.name)
    : [];

  let isCharaExp = false;
  let charaResult = [];
  if (0 < characterNames.length) {
    isCharaExp = true;
    for (let name of characterNames) {
      const targetActor = game.actors.find((a) => a.name === name);
      if (targetActor) {
        const oneRollValue = targetActor.system.attributes.fumble ?? 0;
        charaResult.push({ name: name, value: oneRollValue });
      }
    }
  }

  // custom items.
  const fieldsRaw = item.system.customFields;
  const customItems = Object.values(fieldsRaw);
  const isCustom = item.system.result.custom && customItems;

  // sword shard result.
  if (item.system.result.sword && 0 < getSword) {
    isRoll = true;
    formula = getSword + "d6";
    roll = new Roll(formula);
    await roll.evaluate({ async: true });
    tooltip = await roll.getTooltip();
    total = roll.total;

    getHonor = addSwordShardHonor(getHonor, roll.total);
  }
  const isGamel = 0 < getGamel || 0 < keepGamel;
  const isHonor = 0 < getHonor || 0 < getSword;
  const isAbyss = 0 < getAbyss || 0 < keepAbyss;

  return {
    roll,
    result: {
      title: title,
      isGamel: isGamel,
      getGamel: getGamel,
      keepGamel: keepGamel,
      getExp: getExp,
      isHonor: isHonor,
      getHonor: getHonor,
      getSword: getSword,
      isAbyss: isAbyss,
      getAbyss: getAbyss,
      keepAbyss: keepAbyss,
      getTresure: getTresure,
      isBasic: isBasic,
      date: date,
      gm: gm,
      player: player,
      isCharaExp: isCharaExp,
      charaResult: charaResult,
      isCustom: isCustom,
      customItems: customItems,
      isRoll: isRoll,
      formula: formula,
      tooltip: tooltip,
      total: total,
    },
  };
}
