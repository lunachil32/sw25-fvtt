import { updateResourceQuantity } from "./resource-quantity.mjs";

/** Gain a tactic's tacspower. Returns the resource criteria that were not found. */
export async function gainTacspower(actor, tactic) {
  return updateTacspower(actor, tactic.system.get);
}

/** Spend a tactic's tacspower. Returns the resource criteria that were not found. */
export async function spendTacspower(actor, tactic) {
  return updateTacspower(actor, tactic.system.cost, -1);
}

async function updateTacspower(actor, amount, multiple = 1) {
  if (!amount) return [];

  const resourceType = { type: "tacspower" };
  const updated = await updateResourceQuantity(actor, resourceType, amount, multiple);
  return updated ? [] : [resourceType];
}
