import { spendMaterialCards, applyAlchemyRank } from "../services/alchemy.mjs";

/** Spend the required cards, apply the rank and refresh the source Actor. */
export async function useAlchemy(actor, alchemy, rank) {
  const results = await spendMaterialCards(actor, alchemy, rank);
  await applyAlchemyRank(alchemy, rank);
  // Retain the existing unawaited Actor refresh.
  actor.update({});
  return results;
}
