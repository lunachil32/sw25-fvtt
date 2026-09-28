import { calculateResourceConsumption, isMpCostTarget as matchesMpCostTarget } from "../rules/resource-consumption.mjs";

/**
 * Consume an existing Item's quantity without dropping below its minimum.
 * Returns consumed: false when insufficient; successful results include the
 * before/after quantities. Save failures reject before a success is returned.
 */
export async function consumeResource(resource, amount) {
  const result = calculateResourceConsumption(resource.system.quantity, amount, resource.system.qmin);
  if (!result.consumed) return result;

  await resource.update({ "system.quantity": result.remainingQuantity });
  return result;
}

/** Determine who can pay the cost; summoning and returning exclude the summoned Actor. */
export function isMpCostTarget(actor, { sourceActorId, type }) {
  return matchesMpCostTarget(actor.id, { sourceActorId, type });
}
