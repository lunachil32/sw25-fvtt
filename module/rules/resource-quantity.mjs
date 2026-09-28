/** Convert an adjustment using the existing resource rules. */
export function calculateResourceAdjustment(modifyValue, multiple = 1) {
  return isNaN(Number(modifyValue)) ? 0 : Number(modifyValue) * multiple;
}

/** Preserve the single-resource operation's existing quantity coercion. */
export function addResourceQuantity(quantity, adjustment) {
  const previousQuantity = quantity ? quantity : 0;
  return previousQuantity + Number(adjustment);
}

/** Bulk operations coerce quantities to numbers and use a falsy input to reset. */
export function resetOrAddResourceQuantity(quantity, adjustment, reset) {
  const previousQuantity = Number(quantity ?? 0);
  return reset ? 0 : previousQuantity + Number(adjustment);
}

/** Apply maximum then minimum, retaining numeric zero as an inactive bound. */
export function limitResourceQuantity(quantity, { min, max }) {
  const limits = [];
  if (max && quantity > max) {
    quantity = max;
    limits.push("max");
  }
  if (min && quantity < min) {
    quantity = min;
    limits.push("min");
  }
  return { quantity, limits };
}
