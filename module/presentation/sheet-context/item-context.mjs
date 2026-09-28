import { prepareActiveEffectCategories } from "../../helpers/effects.mjs";

/** Build item-specific template options and effect groups from a base context. */
export function prepareItemSheetContext(item, context) {
  // Use a safe clone of the item data for further operations.
  const itemData = context.data;

  // Add the item's data to context.data for easier access, as well as flags.
  context.system = itemData.system;
  context.flags = itemData.flags;

  context.config = CONFIG.SW25;

  context.applyOptions = {
    "-": "SW25.Item.Noapply",
    on: "SW25.Item.applyon",
    custom: "SW25.Item.Custom",
  };

  if (itemData.type == "check") {
    context.checkmethodOptions = {
      normal: "SW25.Item.Check.Normalcheck",
      dice: "SW25.Item.Check.Customroll",
      power: "SW25.Item.Check.Powerroll",
    };
  }

  if (itemData.type == "weapon") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      rescost: "SW25.Item.Resourcecost",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "armor") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "accessory") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "item") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "combatability") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "enhancearts") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      mpcost: "SW25.Item.Mpcost",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "magicalsong") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "ridingtrick") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "alchemytech") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };

    context.resistOptions = {
      decide: "SW25.Item.Decide",
      any: "SW25.Item.Any",
      disappear: "SW25.Item.Disappear",
      shortening: "SW25.Item.Shortening",
    };
  }

  if (itemData.type == "phasearea") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "tactics") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "infusion") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "barbarousskill") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      mpcost: "SW25.Item.Mpcost",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "essenceweave") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      hpcost: "SW25.Item.Hpcost",
      description: "SW25.Item.Onlydescription",
    };

    context.resistOptions = {
      decide: "SW25.Item.Decide",
      any: "SW25.Item.Any",
      none: "SW25.Item.None",
      disappear: "SW25.Item.Disappear",
      halving: "SW25.Item.Halving",
    };
  }

  if (itemData.type == "otherfeature") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      mpcost: "SW25.Item.Mpcost",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "raceability") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "language") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "spell") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Powerroll",
      dice: "SW25.Item.Diceroll",
      mpcost: "SW25.Item.Mpcost",
      description: "SW25.Item.Onlydescription",
    };
  }

  if (itemData.type == "monsterability") {
    context.applyOptions = {
      "-": "SW25.Item.Noapply",
      on: "SW25.Item.applyon",
    };
  }

  if (itemData.type == "action") {
    context.clickitemOptions = {
      all: "SW25.Item.All",
      power: "SW25.Item.Power",
      dice2: "SW25.Check",
      dice1: "SW25.Item.Action.ActionValue",
      mpcost: "SW25.Item.Mpcost",
      description: "SW25.Item.Onlydescription",
    };
  }

  // Retrieve the roll data for TinyMCE editors.
  context.rollData = item.getRollData();

  // Prepare active effects for easier access
  context.effects = prepareActiveEffectCategories(item.effects);

  return context;
}
