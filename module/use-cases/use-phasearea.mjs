import { buildPhaseareaEffect, spendLifeline } from "../services/phasearea.mjs";
import { applyPreparedEffectsToTokens } from "../services/effect-application.mjs";

/** Spend lifeline and apply the prepared effect to explicitly supplied targets. */
export async function usePhasearea(actor, phasearea, cost, name, targets) {
  const sourceName = actor.name;
  const sourceId = actor._id;
  const effects = [buildPhaseareaEffect(actor, phasearea, name)];
  const consumed = await spendLifeline(actor, phasearea, cost);
  applyPreparedEffectsToTokens(targets, effects, sourceName, sourceId);
  return { effects, consumed };
}
