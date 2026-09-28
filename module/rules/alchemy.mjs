/** Preserve which card costs require spending, including invalid legacy values. */
export function isMaterialCardRequired(cost) {
  return !(!isNaN(cost) && cost <= 0);
}

/** Select the configured rank adjustment without depending on an Item. */
export function getAlchemyRankAdjustment(effectValue, rank) {
  if (!effectValue?.type || effectValue.type === "-") return null;
  const value = effectValue[rank];
  if (!value) return null;
  return { type: effectValue.type, value };
}
