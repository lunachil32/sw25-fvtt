/** Calculate a bounded consumption without changing its input. */
export function calculateResourceConsumption(quantity, amount, minimum) {
  const remainingQuantity = quantity - amount;
  if (quantity < amount || remainingQuantity < minimum) return { consumed: false };
  return { consumed: true, previousQuantity: quantity, remainingQuantity };
}

/** Alchemy and lifelines allow negative quantities and treat a falsy quantity as zero. */
export function calculateUnboundedConsumption(quantity, amount) {
  const previousQuantity = quantity ? quantity : 0;
  return { previousQuantity, remainingQuantity: previousQuantity - amount };
}

/** Summoning and returning exclude the summoned Actor as the MP payer. */
export function isMpCostTarget(actorId, { sourceActorId, type }) {
  return !(sourceActorId === actorId && (type === "summon" || type === "return"));
}
