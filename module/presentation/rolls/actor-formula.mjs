import { resolveActorCheck } from "../../use-cases/actor-checks.mjs";
import { resolveActorPower } from "../../use-cases/actor-power-rolls.mjs";
import { targetRollDialog } from "../../helpers/dialogs.mjs";
import { postActorCheck } from "../chat/check-roll.mjs";
import { postActorPower } from "../chat/power-roll.mjs";
import { postApplyAll } from "../chat/apply-all.mjs";

/** Execute the formula and target choices exposed by a PC sheet control. */
export async function rollActorFormula(actor, dataset, itemId, targets) {
  const power = dataset.power === "true";
  const execute = async selected => {
    if (power) {
      const result = await resolveActorPower(actor, {
        formula: dataset.roll, powerTable: dataset.pt.split(","), itemId,
      });
      return postActorPower(actor, dataset, result, selected);
    }
    const result = await resolveActorCheck(actor, {
      formula: dataset.roll, itemId, resourceId: dataset.resuse, resourceAmount: dataset.resusequantity,
    });
    if (result.resourceCost && !result.resourceCost.consumed) {
      ui.notifications.warn(game.i18n.localize("SW25.Item.Noresquantitiywarn") + result.resourceCost.name);
      return;
    }
    return postActorCheck(actor, dataset, result, selected);
  };
  if (!dataset.apply || dataset.apply === "-" || !targets.size) return execute();
  const choice = await targetRollDialog(targets, dataset.label ?? "");
  if (choice === "cancel") return;
  if (choice === "once") return execute(targets);
  if (choice === "individual") {
    const ids = [];
    for (const token of targets) {
      const result = await execute(new Set([token]));
      if (!result) return;
      ids.push(result.chatMessageId);
    }
    return postApplyAll(actor, dataset, dataset.label ?? "", ids, power ? "powertype" : "checktype");
  }
  return execute();
}
