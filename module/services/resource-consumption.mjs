/**
 * Consume an existing Item's quantity without dropping below its minimum.
 * Returns consumed: false when insufficient; successful results include the
 * before/after quantities. Save failures reject before a success is returned.
 */
export async function consumeResource(resource, amount) {
  const previousQuantity = resource.system.quantity;
  const remainingQuantity = previousQuantity - amount;

  if (previousQuantity < amount || remainingQuantity < resource.system.qmin) {
    return { consumed: false };
  }

  await resource.update({ "system.quantity": remainingQuantity });
  return { consumed: true, previousQuantity, remainingQuantity };
}

/** Determine who can pay the cost; summoning and returning exclude the summoned Actor. */
export function isMpCostTarget(actor, { sourceActorId, type }) {
  return !(sourceActorId === actor.id && (type === "summon" || type === "return"));
}
