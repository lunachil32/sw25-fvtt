/** Determine element flags for a selected property. */
export function getPropertyElements(prop) {
  const clearElements = {
    "type": "",
    "magic.earth": false,
    "magic.ice": false,
    "magic.fire": false,
    "magic.wind": false,
    "magic.thunder": false,
    "magic.energy": false,
    "magic.cut": false,
    "magic.impact": false,
    "magic.poison": false,
    "magic.disease": false,
    "magic.curse": false,
    "magic.mental": false,
    "magic.mentalw": false,
    "magic.healing": false,
    "physical.blade": false,
    "physical.blow": false,
    "physical.mithril": false,
  };

  const propElementMap = {
    earth: { "magic.earth": true },
    ice: { "magic.ice": true },
    fire: { "magic.fire": true },
    wind: { "magic.wind": true },
    thunder: { "magic.thunder": true },
    energy: { "magic.energy": true },
    cut: { "magic.cut": true },
    impact: { "magic.impact": true },
    poison: { "magic.poison": true },
    disease: { "magic.disease": true },
    mental: { "magic.mental": true },
    mentalw: { "magic.mentalw": true },
    curse: { "magic.curse": true },
    curseMental: {
      "type": "or",
      "magic.curse": true,
      "magic.mental": true,
    },
    mentalPoison: {
      "type": "or",
      "magic.mental": true,
      "magic.poison": true,
    },
    other: {},
    fandw: {
      "type": "and",
      "magic.fire": true,
      "magic.wind": true,
    },
    iandt: {
      "type": "and",
      "magic.ice": true,
      "magic.thunder": true,
    },
  };

  if (!prop || !propElementMap[prop]) return null;

  const updates = {
    ...clearElements,
    ...propElementMap[prop],
  };

  return updates;
}

/** Determine blade/blow flags for a weapon type. */
export function getWeaponTypeElements(prop) {
  const clearElements = {
    "physical.blade": false,
    "physical.blow": false,
  };

  const propElementMap = {
    blade: { "physical.blade": true },
    blow: { "physical.blow": true },
    both: {
      "physical.blade": true,
      "physical.blow": true,
    },
    other: {},
  };

  if (!prop || !propElementMap[prop]) return null;

  const updates = {
    ...clearElements,
    ...propElementMap[prop],
  };

  return updates;
}
