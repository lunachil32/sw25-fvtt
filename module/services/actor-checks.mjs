import { consumeResource } from "./resource-consumption.mjs";
import { getActorDamageContext } from "./actor-roll-context.mjs";

/** Evaluate a check and its automatic cost without opening a sheet or posting chat. */
export async function resolveActorCheck(actor, {
  formula,
  itemId,
  resourceId,
  resourceAmount,
}) {
  const roll = new Roll(formula, actor.getRollData());
  await roll.evaluate();

  let resourceCost;
  if (resourceId) {
    const resource = actor.items.get(resourceId);
    const result = await consumeResource(resource, resourceAmount);
    resourceCost = { ...result, name: resource.name };
    if (!result.consumed) return { roll, resourceCost };
  }

  let critical = null;
  let fumble = null;
  if (roll.terms[0].total == 12) critical = 1;
  if (roll.terms[0].total == 2) fumble = 1;

  const context = getActorDamageContext(actor, itemId);

  return { roll, resourceCost, critical, fumble, ...context };
}
