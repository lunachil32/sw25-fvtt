import { getCheckOutcome } from "../rules/checks.mjs";
import { consumeResource } from "../services/resource-consumption.mjs";
import { getActorDamageContext } from "../services/actor-roll-context.mjs";

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

  const { critical, fumble } = getCheckOutcome(roll.terms[0].total);

  const context = getActorDamageContext(actor, itemId);

  return { roll, resourceCost, critical, fumble, ...context };
}
