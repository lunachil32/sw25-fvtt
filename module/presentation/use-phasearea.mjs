import { showPhaseareaCostDialog } from "./dialogs/phasearea-cost.mjs";
import { usePhasearea } from "../use-cases/use-phasearea.mjs";
import { postPhaseareaEffect } from "./chat/effect-messages.mjs";
import { Util } from "../helpers/utils.mjs";

/** Coordinate target selection, cost input, and feedback without a sheet dependency. */
export async function presentPhaseareaUse(actor, item) {
  if (item?.type !== "phasearea") return;
  const tokens = await Util.getControlledActor(actor);
  if (tokens.length !== 1) {
    return ui.notifications.warn(game.i18n.localize(tokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
  }
  const apply = async cost => {
    const currentTokens = await Util.getControlledActor(actor);
    if (currentTokens.length !== 1) {
      return ui.notifications.warn(game.i18n.localize(currentTokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
    }
    const name = item.name + game.i18n.localize("SW25.Use") + " " + cost + game.i18n.localize("SW25.Item.Phasearea.Point");
    const { effects, consumed } = await usePhasearea(actor, item, cost, name, currentTokens);
    const lifeline = { ten: "Ten", chi: "Chi", jin: "Jin" }[item.system.type] ?? "";
    if (!consumed) ui.notifications.warn(game.i18n.localize("SW25.NotResource") + ":" + game.i18n.localize("SW25.Item.Phasearea." + lifeline));
    return postPhaseareaEffect(actor, currentTokens[0].actor.name, effects[0].name, lifeline);
  };
  if (item.system.maxcost && item.system.mincost != item.system.maxcost) {
    return showPhaseareaCostDialog({ name: item.name, minimum: item.system.mincost, maximum: item.system.maxcost }, apply);
  }
  return apply(item.system.mincost || 0);
}
