/** Update element flags to match a selected property. */
export async function applyPropertyElements(item, prop) {
  const clearElements = {
    "system.elements.type": "",
    "system.elements.magic.earth": false,
    "system.elements.magic.ice": false,
    "system.elements.magic.fire": false,
    "system.elements.magic.wind": false,
    "system.elements.magic.thunder": false,
    "system.elements.magic.energy": false,
    "system.elements.magic.cut": false,
    "system.elements.magic.impact": false,
    "system.elements.magic.poison": false,
    "system.elements.magic.disease": false,
    "system.elements.magic.curse": false,
    "system.elements.magic.mental": false,
    "system.elements.magic.mentalw": false,
    "system.elements.magic.healing": false,
    "system.elements.physical.blade": false,
    "system.elements.physical.blow": false,
    "system.elements.physical.mithril": false,
  };

  const propElementMap = {
    earth: { "system.elements.magic.earth": true },
    ice: { "system.elements.magic.ice": true },
    fire: { "system.elements.magic.fire": true },
    wind: { "system.elements.magic.wind": true },
    thunder: { "system.elements.magic.thunder": true },
    energy: { "system.elements.magic.energy": true },
    cut: { "system.elements.magic.cut": true },
    impact: { "system.elements.magic.impact": true },
    poison: { "system.elements.magic.poison": true },
    disease: { "system.elements.magic.disease": true },
    mental: { "system.elements.magic.mental": true },
    mentalw: { "system.elements.magic.mentalw": true },
    curse: { "system.elements.magic.curse": true },
    curseMental: {
      "system.elements.type": "or",
      "system.elements.magic.curse": true,
      "system.elements.magic.mental": true,
    },
    mentalPoison: {
      "system.elements.type": "or",
      "system.elements.magic.mental": true,
      "system.elements.magic.poison": true,
    },
    other: {},
    fandw: {
      "system.elements.type": "and",
      "system.elements.magic.fire": true,
      "system.elements.magic.wind": true,
    },
    iandt: {
      "system.elements.type": "and",
      "system.elements.magic.ice": true,
      "system.elements.magic.thunder": true,
    },
  };

  if (!prop || !propElementMap[prop]) return false;

  const updates = {
    ...clearElements,
    ...propElementMap[prop],
  };

  await item.update(updates);
  return true;
}

/** Update blade/blow flags for a weapon type, preserving other elements. */
export async function applyWeaponTypeElements(item, prop) {
  if (item.type != "weapon") return false;
  const clearElements = {
    "system.elements.physical.blade": false,
    "system.elements.physical.blow": false,
  };

  const propElementMap = {
    blade: { "system.elements.physical.blade": true },
    blow: { "system.elements.physical.blow": true },
    both: {
      "system.elements.physical.blade": true,
      "system.elements.physical.blow": true,
    },
    other: {},
  };

  if (!prop || !propElementMap[prop]) return false;

  const updates = {
    ...clearElements,
    ...propElementMap[prop],
  };

  await item.update(updates);
  return true;
}
