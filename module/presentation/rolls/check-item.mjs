import { resolveActorCheck } from "../../use-cases/actor-checks.mjs";
import { resolveActorPower } from "../../use-cases/actor-power-rolls.mjs";
import { targetRollDialog } from "../../helpers/dialogs.mjs";
import { postActorCheck } from "../chat/check-roll.mjs";
import { postActorPower } from "../chat/power-roll.mjs";
import { postApplyAll } from "../chat/apply-all.mjs";

/** Present a check item using the shared roll operations and target choices. */
export async function rollCheckItem(actor, item, targets) {
  const system = item.system;
  const power = system.checkmethod === "power";
  const dataset = {
    label: item.name,
    apply: power ? system.applypower : system.applycheck,
    checktype: (system.checkTypesButton ?? []).join(","),
    powertype: (system.powerTypesButton ?? []).join(","),
    resist: system.resistinfo?.type === "input" ? system.resistinfo.input : (system.resistinfo?.type ? game.i18n.localize("SW25.Resist.Check." + system.resistinfo.type) : ""),
    resistresult: system.resistinfo?.result,
  };
  const execute = async selected => {
    if (power) {
      const result = await resolveActorPower(actor, {
        formula: system.formula, powerTable: system.powertable.map(String), itemId: item.id,
      });
      return postActorPower(actor, dataset, result, selected);
    }
    const result = await resolveActorCheck(actor, {
      formula: system.formula + "+" + system.checkbase, itemId: item.id,
    });
    return postActorCheck(actor, dataset, result, selected);
  };
  if (!dataset.apply || dataset.apply === "-" || !targets.size) return execute();
  const choice = await targetRollDialog(targets, item.name);
  if (choice === "cancel") return;
  if (choice === "once") return execute(targets);
  if (choice === "individual") {
    const ids = [];
    for (const token of targets) ids.push((await execute(new Set([token]))).chatMessageId);
    return postApplyAll(actor, dataset, item.name, ids, power ? "powertype" : "checktype");
  }
  return execute();
}
