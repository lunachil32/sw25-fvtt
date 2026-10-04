import { hpCost, mpCost } from "../helpers/mpcost.mjs";
import { isMpCostTarget } from "../services/resource-consumption.mjs";

/** Execute an item's prepared cost using the existing token-based payment rules. */
export async function payItemVitalCost(actor, itemId, resource, tokens) {
  const item = actor.items.get(itemId);
  if (!item || !["hp", "mp"].includes(resource)) return {};
  if (tokens.length === 0) return { warning: "SW25.Noselectwarn" };
  if (tokens.length > 1) return { warning: "SW25.Multiselectwarn" };
  const token = tokens[0];
  if (resource === "mp") {
    if (!isMpCostTarget(token.actor, { sourceActorId: actor.id, type: item.type })) {
      return { warning: "SW25.SummonMpwarn" };
    }
    await mpCost(token, item.system.mpcost, item.name, item.type, 1);
  } else {
    await hpCost(token, item.system.hpcost, item.system.maxhpcost, item.name, item.type);
  }
  return {};
}
