import { powerRoll } from "../helpers/powerroll.mjs";
import { getActorDamageContext } from "../services/actor-roll-context.mjs";

/** Resolve a power roll and its result rules without requiring a sheet or chat. */
export async function resolveActorPower(actor, { formula, powerTable, itemId }) {
  const roll = await powerRoll(formula, [...powerTable]);
  const context = getActorDamageContext(actor, itemId);
  return { roll, ...context };
}
