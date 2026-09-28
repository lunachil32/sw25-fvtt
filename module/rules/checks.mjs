/** Classify automatic success/failure from the check's unmodified dice total. */
export function getCheckOutcome(diceTotal) {
  return { critical: diceTotal == 12 ? 1 : null, fumble: diceTotal == 2 ? 1 : null };
}

/** A return check must exceed the supplied target. */
export function calculateReturnCheckTarget(targetValue) {
  return Number(targetValue) + 1;
}

/** Combine the power modifiers that apply before any halving. */
export function calculatePowerModifier(powMod, halfPow, halfPowMod) {
  let modifier = powMod;
  if (halfPow == 0 && halfPowMod && halfPowMod != 0) modifier += halfPowMod;
  return modifier;
}
