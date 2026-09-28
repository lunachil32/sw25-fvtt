/** Prepare V1 effect editor options and classifications without a sheet instance. */
export function prepareEffectContextV1(context) {
  context.effectOptions = CONFIG.SW25.Effect;

  // Use a safe clone of the actor data for further operations.
  const effectData = context.data;

  // Set  keyClassification and kename of exsisting keys
  for (let i = 0; i < effectData.changes.length; i++) {
    let change = effectData.changes[i];
    change.keyname = change.key.replace(/^system\./, "");
    if (change.keyname in context.effectOptions.battle) {
      change.keyClassification = "battle";
    } else if (change.keyname in context.effectOptions.check) {
      change.keyClassification = "check";
    } else if (change.keyname in context.effectOptions.parameter) {
      change.keyClassification = "parameter";
    } else if (change.keyname in context.effectOptions.magicpower) {
      change.keyClassification = "magicpower";
    } else if (change.keyname in context.effectOptions.magicckroll) {
      change.keyClassification = "magicckroll";
    } else if (change.keyname in context.effectOptions.magicpwroll) {
      change.keyClassification = "magicpwroll";
    } else if (change.keyname in context.effectOptions.mpsave) {
      change.keyClassification = "mpsave";
    } else if (change.keyname in context.effectOptions.feature) {
      change.keyClassification = "feature";
    } else if (change.keyname in context.effectOptions.powertable) {
      change.keyClassification = "powertable";
    } else if (change.keyname in context.effectOptions.classPdamage) {
      change.keyClassification = "classPdamage";
    } else if (change.keyname in context.effectOptions.classPdecay) {
      change.keyClassification = "classPdecay";
    } else if (change.keyname in context.effectOptions.elementPdamage) {
      change.keyClassification = "elementPdamage";
    } else if (change.keyname in context.effectOptions.elementPdecay) {
      change.keyClassification = "elementPdecay";
    } else if (change.keyname in context.effectOptions.classMdamage) {
      change.keyClassification = "classMdamage";
    } else if (change.keyname in context.effectOptions.classMdecay) {
      change.keyClassification = "classMdecay";
    } else if (change.keyname in context.effectOptions.elementMdamage) {
      change.keyClassification = "elementMdamage";
    } else if (change.keyname in context.effectOptions.elementMdecay) {
      change.keyClassification = "elementMdecay";
    } else if (change.keyname.startsWith("effect.checkinputmod.")) {
      change.keyClassification = "checkname";
      change.checkname = change.key.replace(/^system\.effect\.checkinputmod\./, "");
    } else if (change.key === "system.") {
      change.key = "";
    } else if (change.key === null || change.key === "") {
      change.keyname = "";
    } else {
      change.keyClassification = "input";
    }
  }
  return context;
}

/** Prepare V2 effect editor options and classifications without a sheet instance. */
export function prepareEffectContextV2(context) {
  const systemPrefixedEffects = {};
  for (const [category, entries] of Object.entries(CONFIG.SW25.Effect)) {
    if (category === "keyClassifications") {
      systemPrefixedEffects[category] = entries;
      continue;
    }

    systemPrefixedEffects[category] = Object.fromEntries(
      Object.entries(entries).map(([key, value]) => [`system.${key}`, value])
    );
  }

  context.effectOptions = systemPrefixedEffects;

  // checkinput , input
  if (context.source?.changes) {
    context.source.changes = context.source.changes.map((change) => {
      if (!change.key) return change;

      const match = change.key.match(/^system\.effect\.checkinputmod\.(.+)$/);

      if (match) {
        const [, checkname] = match;
        change.keyClassification = "checkinput";
        change.checkname = checkname;
      } else {
        let isInput = true;

        const categories = Object.keys(systemPrefixedEffects).filter(k => k !== "keyClassifications");
        for (const category of categories) {
          const keys = Object.keys(systemPrefixedEffects[category]);
          if (keys.includes(change.key)) isInput = false;
        }
        if (isInput) {
          change.keyClassification = "input";
        }
      }
      return change;
    });
  }

  return context;
}
