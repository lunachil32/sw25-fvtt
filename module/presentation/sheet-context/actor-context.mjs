import { prepareActiveEffectCategories } from "../../helpers/effects.mjs";
import { Util } from "../../helpers/utils.mjs";
import { prepareActorItems } from "./actor-items.mjs";

/** Enrich a base sheet context without requiring a sheet instance or saving data. */
export function prepareActorSheetContext(actor, context) {
  // Use a safe clone of the actor data for further operations.
  const actorData = context.data;

  // Add the actor's data to context.data for easier access, as well as flags.
  context.system = actorData.system;
  context.flags = actorData.flags;
  context.isOwner = actor.isOwner;

  context.config = CONFIG.SW25;

  // Prepare character data and items.
  if (actorData.type == "character") {
    prepareActorItems(context);
    prepareCharacterLabels(context);
  }

  // Prepare NPC data and items.
  if (actorData.type == "npc") {
    prepareActorItems(context);
  }

  // Prepare Monster data and items.
  if (actorData.type == "monster") {
    prepareActorItems(context);
  }

  // Add roll data for TinyMCE editors.
  context.rollData = context.actor.getRollData();

  // Prepare active effects
  context.effects = prepareActiveEffectCategories(
    // A generator that returns all effects stored on the actor
    // as well as any items
    actor.allApplicableEffects()
  );

  const colorSetting = actorData.system.color
  ? {
      main: {
        bg: Util.hexToRgb(actorData.system.color.main.bg),
        text: Util.hexToRgb(actorData.system.color.main.text)
      },
      sub: {
        bg: Util.hexToRgb(actorData.system.color.sub.bg),
        text: Util.hexToRgb(actorData.system.color.sub.text)
      }
    }
  : {
      main: {
        bg: {r:239, g:230, b:216},
        text: {r:0, g:0, b:0},
      },
      sub: {
        bg: {r:247, g:243, b:232},
        text: {r:0, g:0, b:0},
      }
    }
  context.colorSetting = colorSetting;

  return context;
}

function prepareCharacterLabels(context) {
  // Handle ability scores.
  for (let [k, v] of Object.entries(context.system.abilities)) {
    v.label = game.i18n.localize(CONFIG.SW25.abilities[k]) ?? k;
  }
}
